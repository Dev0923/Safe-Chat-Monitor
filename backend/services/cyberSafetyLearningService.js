import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';

const SUPPORTED_TOPICS = Object.freeze([
  'Phishing Awareness',
  'Online Stranger Danger',
  'Cyberbullying Prevention',
  'Safe Password Practices',
  'Protecting Personal Information',
  'Safe Social Media Usage',
  'Identifying Suspicious Links',
]);

const FALLBACK_LESSONS = {
  'Phishing Awareness': {
    explanation:
      'Phishing is when someone pretends to be trusted, like a school, game, or bank, to trick you into sharing private information.',
    safetyTips: [
      'Do not click links in surprise messages.',
      'Check who sent the message before you reply.',
      'Ask a trusted adult if a message feels urgent or scary.',
    ],
    scenario:
      'You get an email saying your game account will be deleted unless you log in now using a link.',
    advice:
      'Do not click the link. Open the game app or official website yourself and tell a parent or teacher.',
  },
  'Online Stranger Danger': {
    explanation:
      'Online strangers are people you do not know in real life. Some may act friendly to get your trust and personal details.',
    safetyTips: [
      'Do not share your address, school, or phone number.',
      'Never agree to meet someone from the internet alone.',
      'Tell a trusted adult if someone makes you uncomfortable.',
    ],
    scenario:
      'Someone in a game chat asks where you live and says they want to send you a gift.',
    advice:
      'Do not share any personal details. Block the person and report the chat to a parent.',
  },
  'Cyberbullying Prevention': {
    explanation:
      'Cyberbullying is when someone uses messages, comments, or posts to hurt, embarrass, or scare another person online.',
    safetyTips: [
      'Do not reply to hurtful messages.',
      'Block and report the bully on the app.',
      'Save screenshots and tell a trusted adult quickly.',
    ],
    scenario:
      'A classmate sends you a mean message in a group chat.',
    advice:
      'Take a screenshot, do not respond, and show it to a parent, teacher, or school counselor.',
  },
  'Safe Password Practices': {
    explanation:
      'A strong password protects your accounts. Weak passwords are easy for others to guess.',
    safetyTips: [
      'Use long passwords with letters, numbers, and symbols.',
      'Use different passwords for different apps.',
      'Never share your password with friends.',
    ],
    scenario:
      'Your friend asks for your password to keep your game streak active.',
    advice:
      'Do not share your password. Keep accounts private and ask for help from a parent if needed.',
  },
  'Protecting Personal Information': {
    explanation:
      'Personal information includes your full name, address, school, phone number, photos, and location.',
    safetyTips: [
      'Keep your social accounts private.',
      'Do not post details that reveal where you are.',
      'Think before sharing photos or videos.',
    ],
    scenario:
      'A quiz website asks for your full name, school, and home address to show results.',
    advice:
      'Do not enter real personal details. Leave the page and ask an adult if the site is safe.',
  },
  'Safe Social Media Usage': {
    explanation:
      'Social media can be fun, but your posts can spread quickly and be seen by many people.',
    safetyTips: [
      'Use private account settings.',
      'Only accept follow requests from people you know.',
      'Report inappropriate messages or comments.',
    ],
    scenario:
      'A new account follows you and asks for private photos in direct messages.',
    advice:
      'Do not share photos. Block the account and report it to the platform and a trusted adult.',
  },
  'Identifying Suspicious Links': {
    explanation:
      'Suspicious links are web addresses that may steal passwords, install malware, or trick you into fake websites.',
    safetyTips: [
      'Look for misspelled website names.',
      'Avoid short links from unknown people.',
      'When unsure, type the website address yourself.',
    ],
    scenario:
      'You get a message saying you won a prize with a strange link.',
    advice:
      'Do not click the link. Delete the message and tell a trusted adult.',
  },
};

const toSafeString = (value) => (typeof value === 'string' ? value : '');

const normalizeTopic = (topic) => {
  const input = toSafeString(topic).trim();
  if (!input) return null;

  const exact = SUPPORTED_TOPICS.find((supported) => supported === input);
  if (exact) return exact;

  const lower = input.toLowerCase();
  return SUPPORTED_TOPICS.find((supported) => supported.toLowerCase() === lower) || null;
};

const isAIConfigured = () =>
  !!AI_API_KEY && AI_API_KEY !== 'your_openrouter_api_key_here';

const cleanTips = (tips) => {
  if (!Array.isArray(tips)) return [];
  return tips
    .map((tip) => toSafeString(tip).trim())
    .filter(Boolean)
    .slice(0, 6);
};

const toLessonShape = (lesson, topic, source) => {
  const fallback = FALLBACK_LESSONS[topic];

  const normalized = {
    topic,
    explanation:
      toSafeString(lesson?.explanation).trim() || fallback.explanation,
    safetyTips: cleanTips(lesson?.safetyTips),
    scenario: toSafeString(lesson?.scenario).trim() || fallback.scenario,
    advice: toSafeString(lesson?.advice).trim() || fallback.advice,
    source,
  };

  if (normalized.safetyTips.length === 0) {
    normalized.safetyTips = fallback.safetyTips;
  }

  return normalized;
};

const parseGeminiLessonResponse = (responseText) => {
  try {
    try {
      const direct = JSON.parse(responseText);
      if (direct && typeof direct === 'object') {
        return direct;
      }
    } catch {
      // Continue to regex extraction.
    }

    const jsonMatch = toSafeString(responseText).match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return extracted && typeof extracted === 'object' ? extracted : null;
  } catch (error) {
    console.error('Cyber learning JSON parse failed:', error.message);
    return null;
  }
};

const buildAIPrompt = (topic, ageGroup) => `You are a cyber safety tutor for children.
Explain the topic "${topic}" for a ${ageGroup} year old child in very simple and friendly language.

Return ONLY valid JSON with this exact shape:
{
  "explanation": "2-4 short sentences",
  "safetyTips": ["tip 1", "tip 2", "tip 3"],
  "scenario": "short realistic example situation",
  "advice": "clear action steps for what the child should do"
}

Rules:
- Keep content age-appropriate and non-scary.
- Use practical, specific advice.
- Never include technical jargon without simple explanation.
- Do not include markdown or extra text outside JSON.`;

export const getSupportedCyberSafetyTopics = () => SUPPORTED_TOPICS;

export const generateCyberSafetyLesson = async ({ topic, ageGroup = '10-14' }) => {
  const normalizedTopic = normalizeTopic(topic);
  if (!normalizedTopic) {
    throw new Error('Unsupported learning topic');
  }

  if (!isAIConfigured()) {
    const fallback = FALLBACK_LESSONS[normalizedTopic];
    return toLessonShape(fallback, normalizedTopic, 'fallback');
  }

  try {
    const prompt = buildAIPrompt(normalizedTopic, ageGroup);

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

    const responseText =
      response?.data?.choices?.[0]?.message?.content || '';
    const parsed = parseGeminiLessonResponse(responseText);

    if (!parsed) {
      const fallback = FALLBACK_LESSONS[normalizedTopic];
      return toLessonShape(fallback, normalizedTopic, 'fallback');
    }

    return toLessonShape(parsed, normalizedTopic, 'ai');
  } catch (error) {
    console.error('Cyber learning AI request failed:', error.message);
    const fallback = FALLBACK_LESSONS[normalizedTopic];
    return toLessonShape(fallback, normalizedTopic, 'fallback');
  }
};
