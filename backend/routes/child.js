import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import * as childService from '../services/childService.js';
import bcrypt from 'bcrypt';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const router = express.Router();

// Validation middleware
const validateChild = [
  body('name').notEmpty().withMessage('Child name is required'),
  body('ageGroup').isInt({ min: 1, max: 18 }).withMessage('Age group must be between 1 and 18'),
];

// Get all children for logged-in parent
router.get('/', authMiddleware, async (req, res) => {
  try {
    const children = await childService.getChildrenByParentId(req.user.id);
    res.json(children);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching children' 
    });
  }
});

// Get specific child
router.get('/:id', authMiddleware, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(404).json({ success: false, message: 'Child not found' });
  }
  try {
    const child = await childService.getChildById(req.params.id, req.user.id);
    if (!child) {
      return res.status(404).json({ 
        success: false, 
        message: 'Child not found' 
      });
    }
    res.json(child);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching child' 
    });
  }
});

// Create new child
router.post('/', authMiddleware, validateChild, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      });
    }

    const child = await childService.createChild(req.body, req.user.id);
    res.status(201).json({ 
      success: true, 
      message: 'Child added successfully', 
      child 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating child' 
    });
  }
});

// Update child
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const child = await childService.updateChild(req.params.id, req.user.id, req.body);
    res.json({ 
      success: true, 
      message: 'Child updated successfully', 
      child 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating child' 
    });
  }
});

// Link child by email + password
router.post('/link', authMiddleware, async (req, res) => {
  try {
    const { email, password, ageGroup } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const child = await childService.linkChildByCredentials(email, password, req.user.id, ageGroup);
    res.status(201).json({ success: true, message: 'Child linked successfully', child });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Error linking child' });
  }
});

// Delete child
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(404).json({ success: false, message: 'Child not found' });
  }
  try {
    await childService.deleteChild(req.params.id, req.user.id);
    res.json({ 
      success: true, 
      message: 'Child deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error deleting child' 
    });
  }
});

export default router;
