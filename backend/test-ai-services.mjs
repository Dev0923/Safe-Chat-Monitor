import dotenv from 'dotenv';
dotenv.config();

console.log('=== AI Configuration Check ===\n');

console.log('AI_API_KEY:', process.env.AI_API_KEY ? '✅ Present' : '❌ Missing');
console.log('AI_API_URL:', process.env.AI_API_URL);
console.log('AI_MODEL:', process.env.AI_MODEL || 'openai/gpt-3.5-turbo');
console.log('');

console.log('=== Testing Service Imports ===\n');

try {
  const { generateCyberSafetyLesson, getSupportedCyberSafetyTopics } = await import('./services/cyberSafetyLearningService.js');
  console.log('✅ cyberSafetyLearningService imported');
  
  const topics = getSupportedCyberSafetyTopics();
  console.log('   Supported topics:', topics.length);
  
} catch (error) {
  console.log('❌ cyberSafetyLearningService failed:', error.message);
}

try {
  const { checkLinkSafetyWithAI } = await import('./services/checkLinkSafetyService.js');
  console.log('✅ checkLinkSafetyService imported');
} catch (error) {
  console.log('❌ checkLinkSafetyService failed:', error.message);
}

try {
  const { analyzeMessageWithAI, analyzeUrlWithAI } = await import('./services/aiService.js');
  console.log('✅ aiService imported');
} catch (error) {
  console.log('❌ aiService failed:', error.message);
}

console.log('');
console.log('=== Testing Live AI Call ===\n');

try {
  const { generateCyberSafetyLesson } = await import('./services/cyberSafetyLearningService.js');
  
  console.log('Generating cyber safety lesson...');
  const lesson = await generateCyberSafetyLesson({ 
    topic: 'Phishing Awareness', 
    ageGroup: '10-14' 
  });
  
  console.log('✅ Lesson generated successfully!');
  console.log('   Topic:', lesson.topic);
  console.log('   Source:', lesson.source);
  console.log('   Explanation:', lesson.explanation.substring(0, 80) + '...');
  console.log('   Safety Tips:', lesson.safetyTips.length, 'tips');
  
} catch (error) {
  console.log('❌ Live test failed:', error.message);
}

console.log('');
console.log('=== All Checks Complete ===');
process.exit(0);
