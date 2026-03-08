import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as userService from '../services/userService.js';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user profile' 
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json({ 
      success: true, 
      message: 'Profile updated successfully', 
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating profile' 
    });
  }
});

// Get user settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await userService.getUserSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user settings' 
    });
  }
});

// Update user settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json({ 
      success: true, 
      message: 'Settings updated successfully', 
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating settings' 
    });
  }
});

export default router;
