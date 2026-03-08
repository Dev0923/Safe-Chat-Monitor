import {
  generateCyberSafetyLesson,
  getSupportedCyberSafetyTopics,
} from '../services/cyberSafetyLearningService.js';

export const getCyberSafetyTopics = async (req, res) => {
  try {
    res.json({
      success: true,
      data: getSupportedCyberSafetyTopics(),
    });
  } catch (error) {
    console.error('Error fetching cyber safety topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cyber safety topics',
    });
  }
};

export const generateCyberSafetyLessonContent = async (req, res) => {
  try {
    const { topic, ageGroup } = req.body || {};

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'topic is required',
      });
    }

    const lesson = await generateCyberSafetyLesson({ topic, ageGroup });

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error('Error generating cyber safety lesson:', error);

    const status = error.message === 'Unsupported learning topic' ? 400 : 500;
    const message =
      status === 400
        ? 'Unsupported learning topic'
        : 'Failed to generate cyber safety lesson';

    res.status(status).json({
      success: false,
      message,
    });
  }
};
