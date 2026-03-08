import Activity from '../models/Activity.js';
import Child from '../models/Child.js';
import mongoose from 'mongoose';
import { INTERNAL_TRACKING_DOMAINS } from '../utils/activityTrackingFilter.js';

/**
 * Record a new browsing activity
 */
export const recordActivity = async (activityData) => {
  try {
    const { childId, url, title, timestamp } = activityData;

    // The childId from the extension is the USER's ID, not the CHILD's document ID.
    // We need to find the child document via either its own _id or the associated userId.
    const searchId = mongoose.Types.ObjectId.isValid(childId) ? new mongoose.Types.ObjectId(childId) : childId;

    const child = await Child.findOne({
      $or: [{ _id: searchId }, { userId: searchId }],
    });

    if (!child) {
      throw new Error('Child not found');
    }

    // Create activity record
    const activity = new Activity({
      childId: child._id, // Use the actual child document ID
      url,
      title: title || '',
      timestamp: timestamp || new Date(),
      activityType: 'BROWSER',
    });

    await activity.save();

    // Update child's last activity time
    child.lastActivityTime = new Date();
    await child.save();

    return { success: true, activity };
  } catch (error) {
    console.error('Error recording activity:', error);
    throw error;
  }
};

/**
 * Get activities for a specific child
 */
export const getChildActivities = async (childId, options = {}) => {
  try {
    const {
      limit = 50,
      skip = 0,
      startDate,
      endDate,
      domain,
      flagged,
    } = options;

    const query = { childId };

    // Add date filters
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Add domain filter
    if (domain) {
      query.domain = domain;
    } else {
      query.domain = { $nin: INTERNAL_TRACKING_DOMAINS };
    }

    // Add flagged filter
    if (flagged !== undefined) {
      query.flagged = flagged;
    }

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Activity.countDocuments(query);

    return {
      activities,
      total,
      limit,
      skip,
    };
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Get activities for all children of a parent
 */
export const getActivitiesForParent = async (parentId, options = {}) => {
  try {
    // Get all children for this parent
    const children = await Child.find({ parentId, active: true });
    const childIds = children.map(c => c._id);

    const {
      limit = 50,
      skip = 0,
      startDate,
      endDate,
      childId,
    } = options;

    let query = {
      childId: { $in: childIds },
      domain: { $nin: INTERNAL_TRACKING_DOMAINS },
    };

    // Filter by specific child if provided
    if (childId) {
      query.childId = childId;
    }

    // Add date filters
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('childId', 'name ageGroup')
      .lean();

    const total = await Activity.countDocuments(query);

    return {
      activities,
      total,
      limit,
      skip,
    };
  } catch (error) {
    console.error('Error fetching parent activities:', error);
    throw error;
  }
};

/**
 * Get activity statistics for a child
 */
export const getActivityStats = async (childId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await Activity.find({
      childId,
      timestamp: { $gte: startDate },
      domain: { $nin: INTERNAL_TRACKING_DOMAINS },
    }).lean();

    // Calculate stats
    const totalActivities = activities.length;
    const uniqueDomains = [...new Set(activities.map(a => a.domain))].length;
    const flaggedCount = activities.filter(a => a.flagged).length;

    // Group by day
    const byDay = {};
    activities.forEach(activity => {
      const day = new Date(activity.timestamp).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    // Top domains
    const domainCounts = {};
    activities.forEach(activity => {
      domainCounts[activity.domain] = (domainCounts[activity.domain] || 0) + 1;
    });
    const topDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActivities,
      uniqueDomains,
      flaggedCount,
      byDay,
      topDomains,
      days,
    };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    throw error;
  }
};

/**
 * Flag an activity as concerning
 */
export const flagActivity = async (activityId, flagged = true, riskLevel = 'MEDIUM') => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      activityId,
      { flagged, riskLevel },
      { new: true }
    );

    if (!activity) {
      throw new Error('Activity not found');
    }

    return { success: true, activity };
  } catch (error) {
    console.error('Error flagging activity:', error);
    throw error;
  }
};

/**
 * Delete old activities (cleanup)
 */
export const deleteOldActivities = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await Activity.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error deleting old activities:', error);
    throw error;
  }
};
