import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.AI_API_KEY;
const url = process.env.AI_API_URL;
const model = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';

console.log('LOADED_URL:', url);
console.log('LOADED_MODEL:', model);
console.log('');

try {
  const response = await axios.post(
    url,
    {
      model: model,
      messages: [
        {
          role: 'user',
          content: 'You are a safety assistant. Reply with JSON: {"ok":true,"message":"working"}',
        },
      ],
    },
    {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  const text = response?.data?.choices?.[0]?.message?.content || '';
  console.log('✅ AI_STATUS: SUCCESS');
  console.log('');
  console.log('RESPONSE:');
  console.log(text);
} catch (error) {
  const status = error?.response?.status || 'no-status';
  const message = error?.response?.data?.error?.message || error.message;
  const code = error?.response?.data?.error?.code || 'unknown';
  
  console.log('❌ AI_STATUS: ERROR');
  console.log('');
  console.log('HTTP_STATUS:', status);
  console.log('ERROR_CODE:', code);
  console.log('MESSAGE:', message);
  
  if (error?.response?.data) {
    console.log('');
    console.log('FULL_ERROR:');
    console.log(JSON.stringify(error.response.data, null, 2));
  }
}

process.exit(0);
