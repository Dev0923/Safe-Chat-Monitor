import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as notificationService from '../services/notificationService.js';

const router = express.Router();

// Get all notifications for logged-in parent
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit,
      skip: req.query.skip
    };

    const result = await notificationService.getNotificationsByParentId(req.user.id, filters);
    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
});

// Mark notification as read
router.put('/:id/mark-read', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user.id);
    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting notification'
    });
  }
});

// Delete all read notifications
router.delete('/read/all', authMiddleware, async (req, res) => {
  try {
    const result = await notificationService.deleteReadNotifications(req.user.id);
    res.json({
      success: true,
      message: 'Read notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting read notifications'
    });
  }
});

export default router;
