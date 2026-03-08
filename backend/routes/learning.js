import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  generateCyberSafetyLessonContent,
  getCyberSafetyTopics,
} from '../controllers/cyberSafetyLearningController.js';

const router = express.Router();

router.get('/topics', authMiddleware, getCyberSafetyTopics);
router.post('/generate', authMiddleware, generateCyberSafetyLessonContent);

export default router;
