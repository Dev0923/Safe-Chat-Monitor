import express from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/authenticationService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('role').optional().isIn(['PARENT', 'CHILD', 'ADMIN']).withMessage('Invalid role'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register endpoint
router.post('/register', validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      });
    }

    const response = await authService.register(req.body);
    const statusCode = response.success ? 201 : 400;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      });
    }

    const response = await authService.login(req.body);
    const statusCode = response.success ? 200 : 401;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Change password endpoint
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.query;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Old and new passwords are required' 
      });
    }

    const response = await authService.updatePassword(req.user.id, oldPassword, newPassword);
    const statusCode = response.success ? 200 : 400;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during password update' 
    });
  }
});

// Validate token endpoint
router.get('/validate-token', authMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Token is valid',
    id: req.user.id,
    email: req.user.email,
    role: 'ROLE_' + req.user.role, // Add ROLE_ prefix for frontend compatibility
  });
});

export default router;
