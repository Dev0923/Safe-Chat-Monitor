import mongoose from 'mongoose';
import Child from '../models/Child.js';
import Notification from '../models/Notification.js';
import { checkLinkSafetyWithAI } from '../services/checkLinkSafetyService.js';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildAgeBand = (ageGroup) => {
  const age = Number(ageGroup);
  if (!Number.isFinite(age) || age <= 0) return '10-14';

  const min = Math.max(6, age - 2);
  const max = Math.min(18, age + 2);
  return `${min}-${max}`;
};

const resolveChildContext = async (user, childId, options = {}) => {
  const { requireChild = false } = options;
  const role = user?.role;

  let child = null;

  if (childId) {
    if (!isValidObjectId(childId)) {
      return { error: 'Invalid childId format', status: 400 };
    }

    child = await Child.findById(childId)
      .select('name parentId userId ageGroup')
      .lean();

    if (!child) {
      return { error: 'Child not found', status: 404 };
    }
  }

  if (role === 'CHILD') {
    if (!child) {
      child = await Child.findOne({ userId: user.id })
        .select('name parentId userId ageGroup')
        .lean();

      if (!child && requireChild) {
        return { error: 'No linked child profile found', status: 404 };
      }
    }

    if (child?.userId && child.userId.toString() !== user.id) {
      return { error: 'Unauthorized child access', status: 403 };
    }
  }

  if (role === 'PARENT' && child && child.parentId?.toString() !== user.id) {
    return { error: 'Unauthorized child access', status: 403 };
  }

  if (requireChild && !child) {
    return { error: 'childId is required for this action', status: 400 };
  }

  return { child };
};

export const checkLinkSafety = async (req, res) => {
  try {
    const { childId, url } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'url is required',
      });
    }

    const contextResult = await resolveChildContext(req.user, childId, {
      requireChild: false,
    });

    if (contextResult.error) {
      return res.status(contextResult.status).json({
        success: false,
        message: contextResult.error,
      });
    }

    const ageBand = buildAgeBand(contextResult.child?.ageGroup);
    const analysis = await checkLinkSafetyWithAI({
      url,
      ageGroup: ageBand,
    });

    res.json({
      success: true,
      data: {
        ...analysis,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Check link safety error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check link safety',
    });
  }
};

export const reportSuspiciousLink = async (req, res) => {
  try {
    const { childId, url, riskLevel, explanation } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'url is required',
      });
    }

    const contextResult = await resolveChildContext(req.user, childId, {
      requireChild: true,
    });

    if (contextResult.error) {
      return res.status(contextResult.status).json({
        success: false,
        message: contextResult.error,
      });
    }

    const child = contextResult.child;

    if (!child?.parentId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to notify parent for this child profile',
      });
    }

    const finalRiskLevel =
      typeof riskLevel === 'string' && riskLevel.trim()
        ? riskLevel.trim()
        : 'Warning';

    const message = `${child.name || 'Your child'} reported a suspicious link (${finalRiskLevel}): ${url}`;

    await Notification.create({
      parentId: child.parentId,
      childId: child._id,
      childName: child.name,
      type: 'SYSTEM_MESSAGE',
      message,
      metadata: {
        type: 'CHILD_REPORTED_LINK',
        childId: child._id,
        childName: child.name,
        url,
        riskLevel: finalRiskLevel,
        explanation: explanation || '',
        reportedAt: new Date().toISOString(),
      },
      status: 'UNREAD',
    });

    res.json({
      success: true,
      message: 'Suspicious link reported to parent',
    });
  } catch (error) {
    console.error('Report suspicious link error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to report suspicious link',
    });
  }
};
