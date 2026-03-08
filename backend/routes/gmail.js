import express from 'express';
import { connectGmail, oauthCallback, syncGmail, disconnectGmail, getGmailStatus, getChildEmailMessages } from '../controllers/gmailController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/connect', connectGmail);
router.post('/callback', oauthCallback);
router.post('/sync/:childId', syncGmail);
router.post('/disconnect/:childId', disconnectGmail);
router.get('/status/:childId', getGmailStatus);
router.get('/emails/:childId', authMiddleware, getChildEmailMessages);

export default router;
