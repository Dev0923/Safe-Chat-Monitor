import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as alertService from '../services/alertService.js';

const router = express.Router();

// Get all alerts for logged-in parent with filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { riskLevel, alertType, status, page = 0, limit = 20, search } = req.query;
    const filters = {
      riskLevel,
      alertType,
      status: status || 'NEW',
      page: parseInt(page),
      limit: parseInt(limit),
      search
    };

    const result = await alertService.getAlertsByParentId(req.user.id, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching alerts' 
    });
  }
});

// Get alert statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await alertService.getAlertStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching alert statistics'
    });
  }
});

// Get alerts by child ID
router.get('/child/:childId', authMiddleware, async (req, res) => {
  try {
    const alerts = await alertService.getAlertsByChildId(req.params.childId);
    
    const { Child } = await import('../models/index.js');
    const child = await Child.findById(req.params.childId);
    
    // Allow parent who owns this child, OR the child user themselves
    const isParent = child && child.parentId.toString() === req.user.id;
    const isChild  = child && child.userId?.toString() === req.user.id;
    if (!child || (!isParent && !isChild)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching child alerts' 
    });
  }
});

// Create message alert
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { childId, messageId, riskLevel, riskScore, riskExplanation, messageContent, source } = req.body;

    // Validate required fields
    if (!childId || !messageId || !riskLevel || typeof riskScore !== 'number' || !messageContent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const alert = await alertService.createMessageAlert(
      childId,
      req.user.id,
      messageId,
      riskLevel,
      riskScore,
      riskExplanation,
      messageContent,
      source || 'CHAT'
    );

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create website alert
router.post('/website', authMiddleware, async (req, res) => {
  try {
    const { childId, activityLogId, riskLevel, riskScore, websiteDomain, websiteTitle } = req.body;

    if (!childId || !activityLogId || !riskLevel || typeof riskScore !== 'number' || !websiteDomain) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const alert = await alertService.createWebsiteAlert(
      childId,
      req.user.id,
      activityLogId,
      riskLevel,
      riskScore,
      websiteDomain,
      websiteTitle || 'Unknown'
    );

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create behavior alert
router.post('/behavior', authMiddleware, async (req, res) => {
  try {
    const { childId, riskLevel, riskScore, behaviorDescription, metadata } = req.body;

    if (!childId || !riskLevel || typeof riskScore !== 'number' || !behaviorDescription) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const alert = await alertService.createBehaviorAlert(
      childId,
      req.user.id,
      riskLevel,
      riskScore,
      behaviorDescription,
      metadata
    );

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update alert status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }

    const alert = await alertService.updateAlertStatus(
      req.params.id, 
      req.user.id, 
      status, 
      notes
    );
    
    res.json({ 
      success: true, 
      message: 'Alert status updated successfully', 
      alert 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating alert status' 
    });
  }
});

// Block website
router.post('/:id/block-website', authMiddleware, async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const alert = await alertService.blockWebsite(req.params.id, req.user.id, domain);

    res.json({
      success: true,
      message: 'Website blocked successfully',
      alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Send warning notification
router.post('/:id/send-warning', authMiddleware, async (req, res) => {
  try {
    const { warningMessage } = req.body;

    if (!warningMessage) {
      return res.status(400).json({
        success: false,
        message: 'Warning message is required'
      });
    }

    const alert = await alertService.sendWarningNotification(
      req.params.id,
      req.user.id,
      warningMessage
    );

    res.json({
      success: true,
      message: 'Warning notification sent',
      alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
