import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { chatWithAI } from '../services/aiService.js';

const router = express.Router();

// POST /api/chat/message
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const reply = await chatWithAI(message.trim(), history);
    res.json({ reply });
  } catch (error) {
    console.error('Chat route error:', error.message);
    res.status(500).json({ error: 'Failed to get a response from SafeBot.' });
  }
});

export default router;
