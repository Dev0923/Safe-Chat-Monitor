import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  checkLinkSafety,
  reportSuspiciousLink,
} from '../controllers/checkLinkSafetyController.js';

const router = express.Router();

router.post('/', authMiddleware, checkLinkSafety);
router.post('/report', authMiddleware, reportSuspiciousLink);

export default router;
