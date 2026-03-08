import axios from 'axios';
import dotenv from 'dotenv';
import { analyzeUrlWithAI } from './aiService.js';

dotenv.config();

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';

const SHORT_LINK_DOMAINS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'shorturl.at',
  'rebrand.ly',
  'cutt.ly',
]);

const isAIConfigured = () =>
  !!AI_API_KEY && AI_API_KEY !== 'your_openrouter_api_key_here';

const toSafeString = (value) => (typeof value === 'string' ? value : '');

const normalizeRiskLevel = (rawRiskLevel) => {
  const normalized = toSafeString(rawRiskLevel).trim().toLowerCase();

  if (['dangerous', 'high', 'severe', 'critical', 'unsafe'].includes(normalized)) {
    return 'Dangerous';
  }

  if (['warning', 'warn', 'medium', 'moderate', 'caution', 'suspicious'].includes(normalized)) {
    return 'Warning';
  }

  if (['safe', 'low', 'ok'].includes(normalized)) {
    return 'Safe';
  }

  return 'Warning';
};

const normalizeUrl = (rawUrl) => {
  const value = toSafeString(rawUrl).trim();
  if (!value) {
    throw new Error('url is required');
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Invalid URL format');
  }

  return {
    normalizedUrl: parsed.toString(),
    domain: parsed.hostname.toLowerCase(),
  };
};

const isShortLink = (domain) => {
  if (!domain) return false;
  if (SHORT_LINK_DOMAINS.has(domain)) return true;
  return [...SHORT_LINK_DOMAINS].some((shortDomain) => domain.endsWith(`.${shortDomain}`));
};

const buildAdvice = (riskLevel, context = {}) => {
  const { shortLink = false } = context;

  if (riskLevel === 'Dangerous') {
    return 'Do not open this link. Tell a parent, teacher, or trusted adult right away.';
  }

  if (riskLevel === 'Warning') {
    if (shortLink) {
      return 'This is a shortened link. Do not click it unless a trusted adult checks it first.';
    }
    return 'Be careful before opening this link. Ask a parent or trusted adult to confirm it is safe.';
  }

  return 'This looks safer, but always double-check who sent the link and avoid sharing personal information.';
};

const defaultExplanationByRisk = (riskLevel) => {
  if (riskLevel === 'Dangerous') {
    return 'This link appears risky and could lead to harmful or inappropriate content.';
  }

  if (riskLevel === 'Warning') {
    return 'This link has warning signs, so you should be careful before opening it.';
  }

  return 'This link appears safer based on available checks.';
};

const parseGeminiLinkResponse = (responseText) => {
  try {
    try {
      const direct = JSON.parse(responseText);
      if (direct && typeof direct === 'object') return direct;
    } catch {
      // Continue to JSON extraction from text.
    }

    const jsonMatch = toSafeString(responseText).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const extracted = JSON.parse(jsonMatch[0]);
    return extracted && typeof extracted === 'object' ? extracted : null;
  } catch (error) {
    console.error('Link safety response parse error:', error.message);
    return null;
  }
};

const finalizeLinkSafetyResult = (candidateResult, normalizedUrl, domain, source = 'fallback') => {
  const shortLink = isShortLink(domain);
  let riskLevel = normalizeRiskLevel(candidateResult?.riskLevel);

  let explanation =
    toSafeString(candidateResult?.explanation).trim() || defaultExplanationByRisk(riskLevel);

  if (shortLink && riskLevel === 'Safe') {
    riskLevel = 'Warning';
    explanation =
      'This link uses a shortened URL, which can hide the real destination. You should be careful.';
  }

  const advice =
    toSafeString(candidateResult?.advice).trim() ||
    buildAdvice(riskLevel, { shortLink });

  return {
    riskLevel,
    explanation,
    advice,
    normalizedUrl,
    domain,
    source,
  };
};

const buildAIPrompt = (normalizedUrl, ageGroup) => `You are an internet safety assistant for children aged ${ageGroup}.
Analyze this link and explain whether it is safe or risky in very simple child-friendly language.

Link: ${normalizedUrl}

Return ONLY valid JSON in this exact shape:
{
  "riskLevel": "Safe|Warning|Dangerous",
  "explanation": "simple explanation",
  "advice": "what the child should do"
}

Rules:
- Keep language simple for children.
- Mention if the link looks shortened or suspicious.
- If uncertain, use "Warning".
- Do not include markdown or extra text outside JSON.`;

export const checkLinkSafetyWithAI = async ({ url, ageGroup = '10-14' }) => {
  const { normalizedUrl, domain } = normalizeUrl(url);

  if (!isAIConfigured()) {
    const baseAnalysis = await analyzeUrlWithAI(normalizedUrl, domain, '');
    return finalizeLinkSafetyResult(
      {
        riskLevel: baseAnalysis?.riskLevel,
        explanation: baseAnalysis?.explanation,
      },
      normalizedUrl,
      domain,
      'fallback'
    );
  }

  try {
    const prompt = buildAIPrompt(normalizedUrl, ageGroup);

    const response = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 7000,
      }
    );

    const aiText = response?.data?.choices?.[0]?.message?.content || '';
    const parsed = parseGeminiLinkResponse(aiText);

    if (!parsed) {
      const baseAnalysis = await analyzeUrlWithAI(normalizedUrl, domain, '');
      return finalizeLinkSafetyResult(
        {
          riskLevel: baseAnalysis?.riskLevel,
          explanation: baseAnalysis?.explanation,
        },
        normalizedUrl,
        domain,
        'fallback'
      );
    }

    return finalizeLinkSafetyResult(parsed, normalizedUrl, domain, 'ai');
  } catch (error) {
    console.error('Link safety AI request failed:', error.message);

    const baseAnalysis = await analyzeUrlWithAI(normalizedUrl, domain, '');
    return finalizeLinkSafetyResult(
      {
        riskLevel: baseAnalysis?.riskLevel,
        explanation: baseAnalysis?.explanation,
      },
      normalizedUrl,
      domain,
      'fallback'
    );
  }
};
