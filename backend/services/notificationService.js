import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../server.js';

/**
 * Create a child activity notification
 */
export const createActivityNotification = async (parentId, childId, childName, message, metadata = {}) => {
  try {
    const notification = await Notification.create({
      parentId,
      childId,
      childName,
      type: 'ACTIVITY_UPDATE',
      message,
      metadata,
      status: 'UNREAD'
    });

    // Send real-time notification via WebSocket
    sendNotificationToUser(parentId.toString(), {
      type: 'NEW_NOTIFICATION',
      data: notification
    });

    return notification;
  } catch (error) {
    console.error('Error creating activity notification:', error);
    throw error;
  }
};

/**
 * Create a website access notification
 */
export const createWebsiteAccessNotification = async (parentId, childId, childName, websiteDomain, category = 'General') => {
  try {
    const message = `${childName} visited ${category.toLowerCase() === 'general' ? 'a website' : `a ${category.toLowerCase()} website`}: ${websiteDomain}`;
    
    const notification = await Notification.create({
      parentId,
      childId,
      childName,
      type: 'WEBSITE_ACCESS',
      message,
      metadata: {
        websiteDomain,
        category
      },
      status: 'UNREAD'
    });

    // Send real-time notification via WebSocket
    sendNotificationToUser(parentId.toString(), {
      type: 'NEW_NOTIFICATION',
      data: notification
    });

    return notification;
  } catch (error) {
    console.error('Error creating website access notification:', error);
    throw error;
  }
};

/**
 * Create a system message notification
 */
export const createSystemNotification = async (parentId, message, metadata = {}) => {
  try {
    const notification = await Notification.create({
      parentId,
      type: 'SYSTEM_MESSAGE',
      message,
      metadata,
      status: 'UNREAD'
    });

    // Send real-time notification via WebSocket
    sendNotificationToUser(parentId.toString(), {
      type: 'NEW_NOTIFICATION',
      data: notification
    });

    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Create an account change notification
 */
export const createAccountNotification = async (parentId, childId, childName, message, metadata = {}) => {
  try {
    const notification = await Notification.create({
      parentId,
      childId,
      childName,
      type: 'ACCOUNT_CHANGE',
      message,
      metadata,
      status: 'UNREAD'
    });

    // Send real-time notification via WebSocket
    sendNotificationToUser(parentId.toString(), {
      type: 'NEW_NOTIFICATION',
      data: notification
    });

    return notification;
  } catch (error) {
    console.error('Error creating account notification:', error);
    throw error;
  }
};

/**
 * Create a parent action confirmation notification
 */
export const createParentActionNotification = async (parentId, message, metadata = {}) => {
  try {
    const notification = await Notification.create({
      parentId,
      type: 'PARENT_ACTION',
      message,
      metadata,
      status: 'UNREAD'
    });

    // Send real-time notification via WebSocket
    sendNotificationToUser(parentId.toString(), {
      type: 'NEW_NOTIFICATION',
      data: notification
    });

    return notification;
  } catch (error) {
    console.error('Error creating parent action notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a parent with filtering
 */
export const getNotificationsByParentId = async (parentId, filters = {}) => {
  try {
    const query = { parentId };

    // Apply type filter
    if (filters.type && filters.type !== 'ALL') {
      query.type = filters.type;
    }

    // Apply status filter
    if (filters.status) {
      query.status = filters.status;
    }

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const limit = parseInt(filters.limit) || 50;
    const skip = parseInt(filters.skip) || 0;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a parent
 */
export const getUnreadCount = async (parentId) => {
  try {
    const count = await Notification.countDocuments({
      parentId,
      status: 'UNREAD'
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId, parentId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, parentId },
      { 
        status: 'READ',
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a parent
 */
export const markAllNotificationsAsRead = async (parentId) => {
  try {
    const result = await Notification.updateMany(
      { parentId, status: 'UNREAD' },
      { 
        status: 'READ',
        readAt: new Date()
      }
    );

    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, parentId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      parentId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all read notifications for a parent
 */
export const deleteReadNotifications = async (parentId) => {
  try {
    const result = await Notification.deleteMany({
      parentId,
      status: 'READ'
    });

    return result;
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    throw error;
  }
};
