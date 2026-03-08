import express from 'express';
import {
  createActivityLog,
  getActivityLogs,
  getActivityStats,
  deleteActivityLog,
} from '../controllers/activityLogController.js';

const router = express.Router();

// Create activity log (called by Chrome extension)
// POST /api/activity-log
router.post('/', createActivityLog);

// Get activity logs for a parent
// GET /api/activity-log?parentId=PARENT_ID&childId=CHILD_ID&limit=50&skip=0
// parentId is optional when childId is provided
router.get('/', getActivityLogs);

// Get activity statistics
// GET /api/activity-log/stats?parentId=PARENT_ID
// parentId is optional when childId is provided
router.get('/stats', getActivityStats);

// Delete activity log (optional)
// DELETE /api/activity-log/:logId
router.delete('/:logId', deleteActivityLog);

export default router;
