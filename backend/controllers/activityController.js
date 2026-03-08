import {
  recordActivity,
  getChildActivities,
  getActivitiesForParent,
  getActivityStats,
  flagActivity,
} from '../services/activityService.js';
import { shouldSkipActivityTracking } from '../utils/activityTrackingFilter.js';

/**
 * Record new browsing activity from extension
 * POST /api/activity
 */
export const createActivity = async (req, res) => {
  try {
    const { childId, url, title, timestamp } = req.body;

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

    const result = await recordActivity({ childId, url, title, timestamp });

    res.status(201).json({
      success: true,
      message: 'Activity recorded successfully',
      data: result.activity,
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record activity',
    });
  }
};

/**
 * Get activities for a specific child
 * GET /api/activity/child/:childId
 */
export const getActivitiesByChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit, skip, startDate, endDate, domain, flagged } = req.query;

    const options = {
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0,
      startDate,
      endDate,
      domain,
      flagged: flagged === 'true' ? true : flagged === 'false' ? false : undefined,
    };

    const result = await getChildActivities(childId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching child activities:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activities',
    });
  }
};

/**
 * Get activities for all children of a parent
 * GET /api/activity/parent/:parentId
 */
export const getActivitiesByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { limit, skip, startDate, endDate, childId } = req.query;

    const options = {
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0,
      startDate,
      endDate,
      childId,
    };

    const result = await getActivitiesForParent(parentId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching parent activities:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activities',
    });
  }
};

/**
 * Get activity statistics for a child
 * GET /api/activity/child/:childId/stats
 */
export const getChildActivityStats = async (req, res) => {
  try {
    const { childId } = req.params;
    const { days } = req.query;

    const stats = await getActivityStats(childId, parseInt(days) || 7);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activity stats',
    });
  }
};

/**
 * Flag/unflag an activity
 * PATCH /api/activity/:activityId/flag
 */
export const toggleActivityFlag = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { flagged, riskLevel } = req.body;

    const result = await flagActivity(activityId, flagged, riskLevel);

    res.json({
      success: true,
      message: `Activity ${flagged ? 'flagged' : 'unflagged'} successfully`,
      data: result.activity,
    });
  } catch (error) {
    console.error('Error flagging activity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to flag activity',
    });
  }
};
