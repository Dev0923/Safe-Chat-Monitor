import express from 'express';
import {
  createActivity,
  getActivitiesByChild,
  getActivitiesByParent,
  getChildActivityStats,
  toggleActivityFlag,
} from '../controllers/activityController.js';
// import { authenticate } from '../middleware/auth.js'; // Uncomment if you want to protect routes

const router = express.Router();

// Public route for extension to record activity (no auth required for simplicity)
// In production, you might want to add some form of authentication
router.post('/', createActivity);

// Get activities for a specific child
// router.get('/child/:childId', authenticate, getActivitiesByChild);
router.get('/child/:childId', getActivitiesByChild);

// Get activities for all children of a parent
// router.get('/parent/:parentId', authenticate, getActivitiesByParent);
router.get('/parent/:parentId', getActivitiesByParent);

// Get activity statistics for a child
// router.get('/child/:childId/stats', authenticate, getChildActivityStats);
router.get('/child/:childId/stats', getChildActivityStats);

// Flag/unflag an activity
// router.patch('/:activityId/flag', authenticate, toggleActivityFlag);
router.patch('/:activityId/flag', toggleActivityFlag);

export default router;
