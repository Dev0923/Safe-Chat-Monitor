import { Alert, Message, Child, User, ActivityLog } from '../models/index.js';
import { sendEmail } from './emailService.js';
import * as notificationService from './notificationService.js';

/**
 * Create an alert for suspicious message
 */
export const createMessageAlert = async (childId, parentId, messageId, riskLevel, riskScore, riskExplanation, messageContent, source = 'CHAT') => {
  try {
    const alert = await Alert.create({
      childId,
      parentId,
      messageId,
      alertType: 'SUSPICIOUS_MESSAGE',
      description: `Suspicious message detected: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`,
      messageContent,
      riskLevel,
      riskScore,
      riskExplanation,
      source,
      status: 'NEW',
    });

    // Populate references
    await alert.populate('childId', 'name');
    await alert.populate('parentId', 'email emailAlertEnabled');

    // Send email notification if enabled
    if (alert.parentId && alert.parentId.emailAlertEnabled) {
      try {
        const child = await Child.findById(childId);
        await sendEmail(
          alert.parentId.email,
          child.name,
          riskLevel,
          `Suspicious message: ${messageContent.substring(0, 100)}`
        );
        alert.emailSent = true;
        await alert.save();
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr);
      }
    }

    return alert;
  } catch (error) {
    console.error('Create message alert error:', error);
    throw error;
  }
};

/**
 * Create an alert for dangerous/suspicious website visit
 */
export const createWebsiteAlert = async (childId, parentId, activityLogId, riskLevel, riskScore, websiteDomain, websiteTitle = 'Unknown') => {
  try {
    const alert = await Alert.create({
      childId,
      parentId,
      activityLogId,
      alertType: 'DANGEROUS_WEBSITE',
      description: `Visited high-risk website: ${websiteDomain}`,
      websiteDomain,
      websiteTitle,
      riskLevel,
      riskScore,
      source: 'BROWSING',
      status: 'NEW',
    });

    // Populate references
    await alert.populate('childId', 'name');
    await alert.populate('parentId', 'email emailAlertEnabled');

    // Send email notification if enabled
    if (alert.parentId && alert.parentId.emailAlertEnabled) {
      try {
        const child = await Child.findById(childId);
        await sendEmail(
          alert.parentId.email,
          child.name,
          riskLevel,
          `High-risk website visit: ${websiteDomain}`
        );
        alert.emailSent = true;
        await alert.save();
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr);
      }
    }

    return alert;
  } catch (error) {
    console.error('Create website alert error:', error);
    throw error;
  }
};

/**
 * Create an alert for unusual browsing behavior
 */
export const createBehaviorAlert = async (childId, parentId, riskLevel, riskScore, behaviorDescription, metadata = {}) => {
  try {
    const alert = await Alert.create({
      childId,
      parentId,
      alertType: 'UNUSUAL_BEHAVIOR',
      description: behaviorDescription,
      riskLevel,
      riskScore,
      source: 'SYSTEM',
      metadata,
      status: 'NEW',
    });

    // Populate references
    await alert.populate('childId', 'name');
    await alert.populate('parentId', 'email emailAlertEnabled');

    // Send email notification if enabled
    if (alert.parentId && alert.parentId.emailAlertEnabled) {
      try {
        const child = await Child.findById(childId);
        await sendEmail(
          alert.parentId.email,
          child.name,
          riskLevel,
          behaviorDescription
        );
        alert.emailSent = true;
        await alert.save();
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr);
      }
    }

    return alert;
  } catch (error) {
    console.error('Create behavior alert error:', error);
    throw error;
  }
};

/**
 * Get all alerts for parent with filtering and pagination
 */
export const getAlertsByParentId = async (parentId, filters = {}) => {
  try {
    const { riskLevel, alertType, status = 'NEW', page = 0, limit = 20, search = '' } = filters;

    const query = { parentId };

    // Add optional filters
    if (riskLevel) query.riskLevel = riskLevel;
    if (alertType) query.alertType = alertType;
    if (status) query.status = status;

    // Search by child name or description
    if (search) {
      const children = await Child.find({
        name: { $regex: search, $options: 'i' },
        _id: { $in: await Alert.find({ parentId }).distinct('childId') }
      });
      const childIds = children.map(c => c._id);
      query.$or = [
        { childId: { $in: childIds } },
        { description: { $regex: search, $options: 'i' } },
        { messageContent: { $regex: search, $options: 'i' } },
        { websiteDomain: { $regex: search, $options: 'i' } }
      ];
    }

    const alerts = await Alert.find(query)
      .populate('childId', 'name ageGroup')
      .populate('messageId', 'content source')
      .populate('activityLogId', 'url domain title')
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    const total = await Alert.countDocuments(query);

    return {
      alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.error('Get alerts by parent ID error:', error);
    throw error;
  }
};

/**
 * Get alerts by child ID
 */
export const getAlertsByChildId = async (childId) => {
  try {
    const alerts = await Alert.find({ childId })
      .populate('childId', 'name')
      .sort({ createdAt: -1 });
    return alerts;
  } catch (error) {
    console.error('Get alerts by child ID error:', error);
    throw error;
  }
};

/**
 * Get alert statistics for parent dashboard
 */
export const getAlertStats = async (parentId) => {
  try {
    const totalAlerts = await Alert.countDocuments({ parentId });
    const highRisk = await Alert.countDocuments({ parentId, riskLevel: 'HIGH' });
    const mediumRisk = await Alert.countDocuments({ parentId, riskLevel: 'MEDIUM' });
    const lowRisk = await Alert.countDocuments({ parentId, riskLevel: 'LOW' });
    const resolved = await Alert.countDocuments({ parentId, status: 'RESOLVED' });
    const unresolved = await Alert.countDocuments({ parentId, status: { $ne: 'RESOLVED' } });
    const messageAlerts = await Alert.countDocuments({ parentId, alertType: 'SUSPICIOUS_MESSAGE' });
    const websiteAlerts = await Alert.countDocuments({ parentId, alertType: 'DANGEROUS_WEBSITE' });
    const behaviorAlerts = await Alert.countDocuments({ parentId, alertType: 'UNUSUAL_BEHAVIOR' });

    return {
      totalAlerts,
      highRisk,
      mediumRisk,
      lowRisk,
      resolved,
      unresolved,
      byType: {
        suspiciousMessage: messageAlerts,
        dangerousWebsite: websiteAlerts,
        unusualBehavior: behaviorAlerts
      }
    };
  } catch (error) {
    console.error('Get alert stats error:', error);
    throw error;
  }
};

/**
 * Update alert status with optional notes
 */
export const updateAlertStatus = async (alertId, parentId, status, notes) => {
  try {
    const alert = await Alert.findOne({ _id: alertId, parentId });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = status;
    if (notes) alert.parentNotes = notes;
    if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') {
      alert.resolvedAt = new Date();
    }

    await alert.save();
    await alert.populate('childId', 'name');

    // Create parent action notification for resolved alerts
    if (status === 'RESOLVED') {
      const childName = alert.childId?.name || 'Unknown';
      const alertType = alert.alertType === 'SUSPICIOUS_MESSAGE' ? 'message alert' :
        alert.alertType === 'DANGEROUS_WEBSITE' ? 'website alert' :
          'behavior alert';
      await notificationService.createParentActionNotification(
        parentId,
        `Alert marked as resolved for ${childName} (${alertType}).`,
        { action: 'alert_resolved', childName, alertType: alert.alertType }
      ).catch(err => console.error('Error creating notification:', err));
    }

    return alert;
  } catch (error) {
    console.error('Update alert status error:', error);
    throw error;
  }
};

/**
 * Block a website for a child
 */
export const blockWebsite = async (alertId, parentId, domain) => {
  try {
    const alert = await Alert.findOne({ _id: alertId, parentId })
      .populate('childId', 'name');

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.websiteBlocked = true;
    alert.metadata = alert.metadata || {};
    alert.metadata.blockedAt = new Date();
    alert.metadata.blockedDomain = domain;

    await alert.save();

    // Create parent action notification
    const childName = alert.childId?.name || 'Unknown';
    await notificationService.createParentActionNotification(
      parentId,
      `Website ${domain} blocked successfully for ${childName}.`,
      { action: 'website_blocked', domain, childName }
    ).catch(err => console.error('Error creating notification:', err));

    // TODO: Send blocking instruction to child's browser extension
    // This would involve updating a blocklist in the database that the extension checks

    return alert;
  } catch (error) {
    console.error('Block website error:', error);
    throw error;
  }
};

/**
 * Send warning notification to child
 */
export const sendWarningNotification = async (alertId, parentId, warningMessage) => {
  try {
    const alert = await Alert.findOne({ _id: alertId, parentId })
      .populate('childId', 'name');

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.warningNotificationSent = true;
    alert.metadata = alert.metadata || {};
    alert.metadata.warningMessage = warningMessage;
    alert.metadata.warningSentAt = new Date();

    await alert.save();

    // Create parent action notification
    const childName = alert.childId?.name || 'Unknown';
    await notificationService.createParentActionNotification(
      parentId,
      `Warning sent to ${childName}: "${warningMessage.substring(0, 50)}${warningMessage.length > 50 ? '...' : ''}".`,
      { action: 'warning_sent', childName, warningMessage }
    ).catch(err => console.error('Error creating notification:', err));

    // TODO: Send warning message to child's device via WebSocket or notification service
    // This would alert the child that a warning message was received

    return alert;
  } catch (error) {
    console.error('Send warning notification error:', error);
    throw error;
  }
};

/**
 * Get alerts for parent (legacy function for backward compatibility)
 */
export const getAlertsByParentIdLegacy = async (parentId) => {
  try {
    const alerts = await Alert.find({ parentId })
      .populate('messageId', 'content riskLevel riskScore aiAnalysisExplanation source metadata createdAt')
      .populate('childId', 'name ageGroup')
      .sort({ createdAt: -1 });
    return alerts;
  } catch (error) {
    console.error('Get alerts by parent ID error:', error);
    throw error;
  }
};
