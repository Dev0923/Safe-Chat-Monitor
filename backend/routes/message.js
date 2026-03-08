import express from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import * as messageService from '../services/messageService.js';
import { captureMessageFromExtension } from '../controllers/messageExtensionController.js';

const router = express.Router();

// Validation middleware
const validateMessage = [
  body('content').notEmpty().withMessage('Message content is required'),
];

// PUBLIC ENDPOINT: Capture message from Chrome extension (no auth required)
router.post('/extension', captureMessageFromExtension);

// Analyze message
router.post('/analyze/:childId', authMiddleware, validateMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      });
    }

    const result = await messageService.analyzeMessage(
      req.body, 
      req.params.childId, 
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Message analysis route error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error analyzing message' 
    });
  }
});

// Get messages for a child
router.get('/child/:childId', authMiddleware, async (req, res) => {
  try {
    const messages = await messageService.getMessagesByChildId(
      req.params.childId, 
      req.user.id
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching messages' 
    });
  }
});

export default router;
