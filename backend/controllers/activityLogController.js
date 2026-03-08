import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog.js';
import Child from '../models/Child.js';
import * as notificationService from '../services/notificationService.js';
import {
  shouldSkipActivityTracking,
  INTERNAL_TRACKING_DOMAINS,
} from '../utils/activityTrackingFilter.js';
import { analyzeUrlWithAI } from '../services/aiService.js';

const parseObjectId = (value) => {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

/**
 * Record new browsing activity from extension
 * POST /api/activity-log
 */
export const createActivityLog = async (req, res) => {
  try {
    const { 
      childId, 
      parentId, 
      url, 
      domain, 
      title, 
      timestamp, 
      duration, 
      category, 
      riskLevel, 
      device 
    } = req.body;

    // Validate required fields
    if (!childId || !url) {
      return res.status(400).json({
        success: false,
        message: 'childId and url are required',
      });
    }

    if (shouldSkipActivityTracking(url)) {
      return res.status(200).json({
        success: true,
        ignored: true,
        message: 'Activity ignored for internal or unsupported URL',
      });
    }

    // Resolve child and parent relationship from childId.
    // The childId from the extension is the USER's ID, not the CHILD's document ID.
    const searchId = mongoose.Types.ObjectId.isValid(childId) ? new mongoose.Types.ObjectId(childId) : childId;
    const child = await Child.findOne({
      $or: [{ _id: searchId }, { userId: searchId }],
    })
      .select('name parentId lastActivityTime')
      .lean();

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found',
      });
    }

    const resolvedParentId = parentId || child.parentId;
    if (!resolvedParentId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to resolve parentId for this child',
      });
    }

    // Extract domain from URL if not provided
    let finalDomain = domain;
    if (!finalDomain && url) {
      try {
        const urlObj = new URL(url);
        finalDomain = urlObj.hostname;
      } catch (err) {
        finalDomain = 'unknown';
      }
    }

    // Use AI to classify the URL and assess risk level
    // This overrides any classification sent from the client for security
    const aiAnalysis = await analyzeUrlWithAI(url, finalDomain, title);
    const finalCategory = aiAnalysis.category || 'Unknown';
    const finalRiskLevel = aiAnalysis.riskLevel || 'Warning';

    // Create activity log entry
    // Always use child._id (the Child document's ObjectId), not the raw childId
    // sent by the extension (which may be the linked User's _id instead)
    const activityLog = new ActivityLog({
      childId: child._id,
      parentId: resolvedParentId,
      url,
      domain: finalDomain,
      title: title || '',
      timestamp: timestamp || new Date(),
      duration: duration || 0,
      category: finalCategory,
      riskLevel: finalRiskLevel,
      device: device || 'Chrome'
    });

    await activityLog.save();

    const childName = child?.name || 'Child';
    const lastActivityTime = child?.lastActivityTime;
    
    // Check if this is a new browsing session (no activity in last hour)
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = new Date();
    const isNewSession = !lastActivityTime || (now - new Date(lastActivityTime)) > ONE_HOUR;
    
    // Create activity update notification for new browsing sessions
    if (isNewSession && resolvedParentId) {
      const currentHour = now.getHours();
      let timeOfDay = 'morning';
      if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon';
      else if (currentHour >= 17 && currentHour < 21) timeOfDay = 'evening';
      else if (currentHour >= 21 || currentHour < 6) timeOfDay = 'night';
      
      notificationService.createActivityNotification(
        resolvedParentId,
        childId,
        childName,
        `${childName} started browsing online (${timeOfDay}).`,
        { action: 'session_start', timeOfDay, timestamp: now.toISOString() }
      ).catch(err => {
        console.error('Failed to create activity notification:', err);
      });
    }
    
    // Update child's last activity time
    await Child.findByIdAndUpdate(child._id, { lastActivityTime: now });
    
    // Create website access notification for specific categories or risk levels
    // Create notifications for:
    // 1. Risky websites (Warning or Dangerous)
    // 2. Educational websites (positive reinforcement)
    // 3. Social media websites (parent awareness)
    // 4. Gaming websites (time tracking awareness)
    const shouldNotify = 
      finalRiskLevel === 'Warning' ||
      finalRiskLevel === 'Dangerous' ||
      finalCategory === 'Education' ||
      finalCategory === 'Social' ||
      finalCategory === 'Gaming';

    if (shouldNotify && resolvedParentId) {
      notificationService.createWebsiteAccessNotification(
        resolvedParentId,
        childId,
        childName,
        finalDomain,
        finalCategory
      ).catch(err => {
        console.error('Failed to create website access notification:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Activity log recorded successfully',
      data: activityLog,
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record activity log',
    });
  }
};

/**
 * Get activity logs for a parent (all children)
 * GET /api/activity-log?parentId=PARENT_ID&childId=CHILD_ID&limit=50&skip=0
 */
export const getActivityLogs = async (req, res) => {
  try {
    const { parentId, childId, limit = 100, skip = 0, startDate, endDate } = req.query;

    if (!parentId && !childId) {
      return res.status(400).json({
        success: false,
        message: 'parentId or childId is required',
      });
    }

    // Build query
    const query = {};
    if (parentId) {
      const parsedParentId = parseObjectId(parentId);
      if (!parsedParentId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parentId format',
        });
      }
      query.parentId = parsedParentId;
    }

    if (childId) {
      const parsedChildId = parseObjectId(childId);
      if (!parsedChildId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid childId format',
        });
      }
      query.childId = parsedChildId;
    }

    query.domain = { $nin: INTERNAL_TRACKING_DOMAINS };

    // Optional date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Fetch logs with pagination
    const logs = await ActivityLog.find(query)
      .populate('childId', 'name email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Get total count for pagination
    const total = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + logs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activity logs',
    });
  }
};

/**
 * Get activity statistics for a parent
 * GET /api/activity-log/stats?parentId=PARENT_ID
 */
export const getActivityStats = async (req, res) => {
  try {
    const { parentId, childId } = req.query;

    if (!parentId && !childId) {
      return res.status(400).json({
        success: false,
        message: 'parentId or childId is required',
      });
    }

    const query = {};
    if (parentId) {
      const parsedParentId = parseObjectId(parentId);
      if (!parsedParentId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parentId format',
        });
      }
      query.parentId = parsedParentId;
    }

    if (childId) {
      const parsedChildId = parseObjectId(childId);
      if (!parsedChildId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid childId format',
        });
      }
      query.childId = parsedChildId;
    }

    query.domain = { $nin: INTERNAL_TRACKING_DOMAINS };

    // Get statistics
    const stats = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          safe: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'Safe'] }, 1, 0] }
          },
          warning: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'Warning'] }, 1, 0] }
          },
          dangerous: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'Dangerous'] }, 1, 0] }
          },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    // Category breakdown
    const categoryStats = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || { total: 0, safe: 0, warning: 0, dangerous: 0, totalDuration: 0 },
        byCategory: categoryStats,
      },
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activity statistics',
    });
  }
};

/**
 * Delete activity logs (optional - for data cleanup)
 * DELETE /api/activity-log/:logId
 */
export const deleteActivityLog = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await ActivityLog.findByIdAndDelete(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found',
      });
    }

    res.json({
      success: true,
      message: 'Activity log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete activity log',
    });
  }
};
