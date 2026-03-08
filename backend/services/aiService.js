import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL;
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';

const URL_CATEGORY_VALUES = new Set([
  'Education',
  'Entertainment',
  'Social',
  'Gaming',
  'News',
  'Shopping',
  'Adult',
  'Gambling',
  'Violence',
  'Unknown',
]);

const URL_CATEGORY_MAP = {
  adult: 'Adult',
  'adult content': 'Adult',
  pornography: 'Adult',
  porn: 'Adult',
  gambling: 'Gambling',
  violence: 'Violence',
  violent: 'Violence',
  social: 'Social',
  'social media': 'Social',
  gaming: 'Gaming',
  games: 'Gaming',
  education: 'Education',
  educational: 'Education',
  news: 'News',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  unknown: 'Unknown',
};

const DANGEROUS_URL_CATEGORIES = new Set(['Adult', 'Gambling', 'Violence']);

const toSafeString = (value) => (typeof value === 'string' ? value : '');

const extractDomain = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname || 'unknown';
  } catch {
    return 'unknown';
  }
};

const normalizeUrlCategory = (rawCategory) => {
  const value = toSafeString(rawCategory).trim();
  if (!value) return 'Unknown';

  const normalizedKey = value.toLowerCase();
  const mapped = URL_CATEGORY_MAP[normalizedKey];
  if (mapped && URL_CATEGORY_VALUES.has(mapped)) {
    return mapped;
  }

  return URL_CATEGORY_VALUES.has(value) ? value : 'Unknown';
};

const normalizeUrlRiskLevel = (rawRiskLevel) => {
  const normalized = toSafeString(rawRiskLevel).trim().toLowerCase();

  if (['dangerous', 'high', 'severe', 'critical', 'unsafe', 'block'].includes(normalized)) {
    return 'Dangerous';
  }

  if (['warning', 'warn', 'medium', 'moderate', 'caution', 'suspicious', 'unknown'].includes(normalized)) {
    return 'Warning';
  }

  if (['safe', 'low', 'benign', 'minimal'].includes(normalized)) {
    return 'Safe';
  }

  return 'Warning';
};

const classifyCriticalSiteByKeywords = (url, domain, title = '') => {
  const urlLower = toSafeString(url).toLowerCase();
  const domainLower = toSafeString(domain).toLowerCase();
  const titleLower = toSafeString(title).toLowerCase();
  const combined = `${urlLower} ${domainLower} ${titleLower}`;

  const adultMarkers = [
    'pornhub', 'xvideos', 'xhamster', 'xnxx', 'youporn', 'redtube', 'tube8',
    'brazzers', 'spankwire', 'naughtyamerica', 'bangbros', 'chaturbate',
    'livejasmin', 'onlyfans', 'hentai', 'erotic', 'nsfw', 'adult', 'nude',
    'naked', 'xxx', 'porn'
  ];

  const gamblingMarkers = [
    'casino', 'poker', 'betting', 'bet365', 'draftkings', 'fanduel', 'gamble',
    'slots', 'jackpot', 'sportsbook', 'roulette', 'bookmaker', 'lottery',
    'wager', 'odds', 'stake'
  ];

  const violenceMarkers = [
    'bestgore', 'liveleak', 'watchpeopledie', 'gore', 'torture', 'beheading',
    'graphic violence', 'snuff', 'extreme violence'
  ];

  const adultMatch = adultMarkers.find((marker) => combined.includes(marker));
  if (adultMatch) {
    return {
      category: 'Adult',
      riskLevel: 'Dangerous',
      explanation: `Safety guardrail matched adult marker: "${adultMatch}".`,
    };
  }

  const gamblingMatch = gamblingMarkers.find((marker) => combined.includes(marker));
  if (gamblingMatch) {
    return {
      category: 'Gambling',
      riskLevel: 'Dangerous',
      explanation: `Safety guardrail matched gambling marker: "${gamblingMatch}".`,
    };
  }

  const violenceMatch = violenceMarkers.find((marker) => combined.includes(marker));
  if (violenceMatch) {
    return {
      category: 'Violence',
      riskLevel: 'Dangerous',
      explanation: `Safety guardrail matched violence marker: "${violenceMatch}".`,
    };
  }

  return null;
};

const applyUrlSafetyGuardrails = (rawAnalysis, url, domain, title = '') => {
  const normalizedAnalysis = {
    category: normalizeUrlCategory(rawAnalysis?.category),
    riskLevel: normalizeUrlRiskLevel(rawAnalysis?.riskLevel),
    explanation: toSafeString(rawAnalysis?.explanation).trim() || 'URL analyzed by AI.',
  };

  const critical = classifyCriticalSiteByKeywords(url, domain, title);
  if (critical) {
    return critical;
  }

  // Guardrail: dangerous categories should never be marked as safe.
  if (DANGEROUS_URL_CATEGORIES.has(normalizedAnalysis.category) && normalizedAnalysis.riskLevel === 'Safe') {
    normalizedAnalysis.riskLevel = 'Dangerous';
    normalizedAnalysis.explanation = `Safety guardrail override: ${normalizedAnalysis.category} content cannot be marked Safe.`;
  }

  // Guardrail: unknown sites default to warning, not safe.
  if (normalizedAnalysis.category === 'Unknown' && normalizedAnalysis.riskLevel === 'Safe') {
    normalizedAnalysis.riskLevel = 'Warning';
    normalizedAnalysis.explanation = 'Safety guardrail override: unknown website downgraded to Warning.';
  }

  return normalizedAnalysis;
};

export const analyzeMessageWithAI = async (content, ageGroup) => {
  try {
    // If no API key, use mock analysis
    if (!AI_API_KEY || AI_API_KEY === 'your_openrouter_api_key_here') {
      console.warn('Safety Monitor: AI API key not configured. Using mock analysis.');
      return mockAnalysis(content);
    }

    const prompt = `You are a child safety AI assistant specialized in protecting children online. Analyze the following message from a child (age group: ${ageGroup}) for potential safety risks.

Message: "${content}"

Respond ONLY with valid JSON (no extra text) containing these fields:
- riskLevel: "LOW", "MEDIUM", or "HIGH"
- riskScore: number 0-100
- explanation: brief explanation of risk level
- riskDetails: specific concerns if any exist

Evaluate for: grooming, predatory behavior, self-harm mentions, bullying, drug references, inappropriate content, meeting strangers, sharing personal info, etc.`;

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
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    // Parse AI response
    const parsed = parseAIResponse(aiResponse);
    
    // Validate response has required fields
    if (parsed && parsed.riskLevel && parsed.riskScore !== undefined) {
      console.log('Safety Monitor: AI analysis complete', {
        model: AI_MODEL,
        riskLevel: parsed.riskLevel,
        riskScore: parsed.riskScore
      });
      return parsed;
    }
    
    // If parsing failed, use mock analysis
    console.warn('Safety Monitor: AI response parsing failed, using mock analysis');
    return mockAnalysis(content);
  } catch (error) {
    console.error('AI analysis error:', error.message);
    console.error('Falling back to mock analysis');
    // Fallback to mock analysis
    return mockAnalysis(content);
  }
};

const parseAIResponse = (aiResponse) => {
  try {
    // Try to parse as direct JSON
    try {
      const parsed = JSON.parse(aiResponse);
      if (parsed.riskLevel && parsed.riskScore !== undefined) {
        return parsed;
      }
    } catch (e) {
      // Not direct JSON, try to extract
    }
    
    // Try to extract JSON from the response (handles markdown code blocks, etc)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[0]);
      
      // Ensure fields are properly formatted
      return {
        riskLevel: json.riskLevel || 'LOW',
        riskScore: typeof json.riskScore === 'number' ? json.riskScore : 0,
        explanation: json.explanation || 'Unable to determine risk',
        riskDetails: json.riskDetails || ''
      };
    }
    
    console.warn('Safety Monitor: Could not extract JSON from AI response:', aiResponse.substring(0, 100));
    return null;
  } catch (error) {
    console.error('Error parsing AI response:', error.message);
    return null;
  }
};

const mockAnalysis = (content) => {
  const lowerContent = content.toLowerCase();
  
  // High-risk keywords
  const highRiskKeywords = ['suicide', 'kill myself', 'self harm', 'hurt myself', 'die', 'abuse', 'inappropriate', 'meet stranger'];
  const mediumRiskKeywords = ['sad', 'depressed', 'scared', 'afraid', 'worried', 'bully', 'hate', 'angry'];
  
  let riskLevel = 'LOW';
  let riskScore = 10;
  let explanation = 'Message appears safe with no immediate concerns.';
  let riskDetails = '';

  for (const keyword of highRiskKeywords) {
    if (lowerContent.includes(keyword)) {
      riskLevel = 'HIGH';
      riskScore = 85;
      explanation = 'Message contains concerning content that may indicate potential danger or distress.';
      riskDetails = `Detected high-risk keyword: "${keyword}". Immediate attention recommended.`;
      break;
    }
  }

  if (riskLevel === 'LOW') {
    for (const keyword of mediumRiskKeywords) {
      if (lowerContent.includes(keyword)) {
        riskLevel = 'MEDIUM';
        riskScore = 50;
        explanation = 'Message contains content that may indicate emotional distress or concern.';
        riskDetails = `Detected medium-risk keyword: "${keyword}". Monitoring recommended.`;
        break;
      }
    }
  }

  return { riskLevel, riskScore, explanation, riskDetails };
};

export const chatWithAI = async (userMessage, history = []) => {
  const systemPrompt = `You are SafeBot, a friendly and helpful AI assistant for children. You help with homework, answer curious questions, tell fun facts, and provide friendly support.
Rules you must always follow:
- Keep all responses age-appropriate, safe, and positive.
- Never produce harmful, violent, explicit, or adult content.
- If asked about anything dangerous or inappropriate, gently redirect the conversation.
- Be encouraging, warm, and use simple language a child can understand.
- Keep responses concise (2-4 sentences unless a longer answer is genuinely needed).`;

  try {
    if (!AI_API_KEY || AI_API_KEY === 'your_openrouter_api_key_here') {
      return "Hi! I'm SafeBot. I'm here to help you, but my AI brain isn't connected right now. Ask a parent to set me up!";
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // keep last 10 turns for context
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      AI_API_URL,
      { model: AI_MODEL, messages },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('SafeBot chat error:', error.message);
    return "Oops! I had a little trouble thinking. Could you try asking me again?";
  }
};

export const analyzeUrlWithAI = async (url, domain, title = '') => {
  const resolvedDomain = toSafeString(domain).trim() || extractDomain(url);

  try {
    // If no API key, use enhanced keyword-based analysis
    if (!AI_API_KEY || AI_API_KEY === 'your_openrouter_api_key_here') {
      console.warn('Safety Monitor: AI API key not configured. Using enhanced keyword analysis for URL.');
      const fallback = enhancedUrlAnalysis(url, resolvedDomain, title);
      return applyUrlSafetyGuardrails(fallback, url, resolvedDomain, title);
    }

    const prompt = `You are a child safety AI assistant specialized in website content classification and risk assessment. Analyze the following website for potential risks to children.

URL: ${url}
  Domain: ${resolvedDomain}
${title ? `Page Title: ${title}` : ''}

Respond ONLY with valid JSON (no extra text) containing these fields:
- category: "Adult", "Gambling", "Violence", "Social Media", "Gaming", "Education", "News", "Entertainment", "Shopping", or "Unknown"
- riskLevel: "Safe", "Warning", or "Dangerous"
- explanation: brief explanation of the categorization and risk assessment

Risk Level Guidelines:
- "Dangerous": Adult content, gambling, illegal activities, violence, malware, phishing, child exploitation
- "Warning": Social media (privacy/stranger risks), user-generated content, unknown/suspicious sites, dating sites, forums
- "Safe": Educational sites, reputable news, known safe entertainment, established brands

Consider: domain reputation, keywords in URL/title, known website categories, potential for inappropriate content, user interaction risks.

Never classify adult, pornographic, explicit sexual, gambling, or graphic-violence websites as "Safe".
If uncertain, return "Warning".`;

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
        timeout: 5000, // 5 second timeout
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    const parsed = parseUrlAIResponse(aiResponse);
    
    if (parsed && parsed.category && parsed.riskLevel) {
      const guardedResult = applyUrlSafetyGuardrails(parsed, url, resolvedDomain, title);
      
      console.log('Safety Monitor: AI URL analysis complete', {
        domain: resolvedDomain,
        category: guardedResult.category,
        riskLevel: guardedResult.riskLevel
      });
      return guardedResult;
    }
    
    console.warn('Safety Monitor: AI URL response parsing failed, using enhanced keyword analysis');
    const fallback = enhancedUrlAnalysis(url, resolvedDomain, title);
    return applyUrlSafetyGuardrails(fallback, url, resolvedDomain, title);
  } catch (error) {
    console.error('AI URL analysis error:', error.message);
    console.error('Falling back to enhanced keyword analysis');
    const fallback = enhancedUrlAnalysis(url, resolvedDomain, title);
    return applyUrlSafetyGuardrails(fallback, url, resolvedDomain, title);
  }
};

const parseUrlAIResponse = (aiResponse) => {
  try {
    // Try to parse as direct JSON
    try {
      const parsed = JSON.parse(aiResponse);
      if (parsed.category && parsed.riskLevel) {
        return {
          category: parsed.category,
          riskLevel: parsed.riskLevel,
          explanation: parsed.explanation || 'AI classification'
        };
      }
    } catch (e) {
      // Not direct JSON, try to extract
    }
    
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[0]);
      return {
        category: json.category || 'Unknown',
        riskLevel: json.riskLevel || 'Warning',
        explanation: json.explanation || 'Unable to classify'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing AI URL response:', error.message);
    return null;
  }
};

const enhancedUrlAnalysis = (url, domain, title = '') => {
  const urlLower = toSafeString(url).toLowerCase();
  const domainLower = toSafeString(domain).toLowerCase();
  const titleLower = toSafeString(title).toLowerCase();
  const combined = `${urlLower} ${domainLower} ${titleLower}`;

  // Dangerous content keywords - comprehensive list
  const adultKeywords = [
    'xxx', 'porn', 'nude', 'naked', 'adult', 'erotic', 'hentai', 'nsfw',
    'webcam', 'escort', 'hookup', 'xvideos', 'pornhub', 'xhamster', 'xnxx',
    'redtube', 'youporn', 'tube8', 'spankwire', 'brazzers', 'onlyfans',
    'chaturbate', 'livejasmin', 'naughtyamerica', 'bangbros'
  ];
  
  const gamblingKeywords = [
    'casino', 'poker', 'betting', 'bet365', 'gamble', 'slots', 'jackpot',
    'lottery', 'sportsbook', 'wager', 'odds', 'stake'
  ];
  
  const violenceKeywords = [
    'gore', 'death', 'murder', 'kill', 'torture', 'extreme', 'shock',
    'bestgore', 'liveleak', 'watchpeopledie'
  ];
  
  const illegalKeywords = [
    'torrent', 'pirate', 'crack', 'keygen', 'warez', 'darkweb', 'onion',
    'hack', 'exploit', 'malware', 'virus', 'phishing'
  ];

  const drugKeywords = [
    'cannabis', 'marijuana', 'weed', 'cocaine', 'meth', 'heroin', 
    'drug', 'dealer', 'psychedelic'
  ];

  // Check for dangerous content
  for (const keyword of adultKeywords) {
    if (combined.includes(keyword)) {
      return {
        category: 'Adult',
        riskLevel: 'Dangerous',
        explanation: `Adult content detected. Not suitable for children.`
      };
    }
  }

  for (const keyword of gamblingKeywords) {
    if (combined.includes(keyword)) {
      return {
        category: 'Gambling',
        riskLevel: 'Dangerous',
        explanation: `Gambling site detected. Not appropriate for children.`
      };
    }
  }

  for (const keyword of violenceKeywords) {
    if (combined.includes(keyword)) {
      return {
        category: 'Violence',
        riskLevel: 'Dangerous',
        explanation: `Violent or disturbing content detected.`
      };
    }
  }

  for (const keyword of [...illegalKeywords, ...drugKeywords]) {
    if (combined.includes(keyword)) {
      return {
        category: 'Unknown',
        riskLevel: 'Dangerous',
        explanation: `Potentially illegal or harmful content detected.`
      };
    }
  }

  // Educational sites - safe
  const eduKeywords = ['edu', 'coursera', 'udemy', 'khan', 'wikipedia', 'academia', 'scholar', 'edx', 'learn', 'tutorial', 'course'];
  if (eduKeywords.some(k => combined.includes(k))) {
    return {
      category: 'Education',
      riskLevel: 'Safe',
      explanation: 'Educational content.'
    };
  }

  // News sites - safe
  const newsKeywords = ['news', 'cnn', 'bbc', 'nytimes', 'reuters', 'theguardian', 'wsj', 'forbes', 'bloomberg'];
  if (newsKeywords.some(k => combined.includes(k))) {
    return {
      category: 'News',
      riskLevel: 'Safe',
      explanation: 'News and information.'
    };
  }

  // Social media - warning (privacy/stranger risks)
  const socialKeywords = ['facebook', 'twitter', 'instagram', 'snapchat', 'tiktok', 'reddit', 'discord', 'whatsapp', 'telegram'];
  if (socialKeywords.some(k => combined.includes(k))) {
    return {
      category: 'Social',
      riskLevel: 'Warning',
      explanation: 'Social media site. Monitor for stranger interactions and privacy concerns.'
    };
  }

  // Gaming - warning (varies by game)
  const gamingKeywords = ['steam', 'epicgames', 'roblox', 'minecraft', 'gaming', 'game', 'play'];
  if (gamingKeywords.some(k => combined.includes(k))) {
    return {
      category: 'Gaming',
      riskLevel: 'Warning',
      explanation: 'Gaming platform. Monitor for online interactions.'
    };
  }

  // Entertainment - safe
  const entertainmentKeywords = ['youtube', 'netflix', 'disney', 'spotify', 'hulu', 'music', 'movie', 'video'];
  if (entertainmentKeywords.some(k => combined.includes(k))) {
    return {
      category: 'Entertainment',
      riskLevel: 'Safe',
      explanation: 'Entertainment content.'
    };
  }

  // Shopping - safe
  const shoppingKeywords = ['amazon', 'ebay', 'walmart', 'target', 'shop', 'store', 'buy'];
  if (shoppingKeywords.some(k => combined.includes(k))) {
    return {
      category: 'Shopping',
      riskLevel: 'Safe',
      explanation: 'Shopping website.'
    };
  }

  // Unknown sites - warning by default
  return {
    category: 'Unknown',
    riskLevel: 'Warning',
    explanation: 'Unknown website. Monitor content and usage.'
  };
};