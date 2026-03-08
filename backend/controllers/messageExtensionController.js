import { Message, Child } from '../models/index.js';
import { analyzeMessageWithAI } from '../services/aiService.js';
import { createMessageAlert } from '../services/alertService.js';

/**
 * Capture message from Chrome extension
 * POST /api/messages/extension
 * Public endpoint (no auth required)
 */
export const captureMessageFromExtension = async (req, res) => {
  try {
    const { childId, message, source, timestamp } = req.body;

    // Validate required fields
    if (!childId || !message) {
      return res.status(400).json({
        success: false,
        message: 'childId and message are required',
      });
    }

    // Validate message length (must be > 5 characters as per requirements)
    if (message.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Message too short (minimum 5 characters)',
      });
    }

    // Find child to get ageGroup and parentId
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found',
      });
    }

    // Analyze message with AI
    const analysis = await analyzeMessageWithAI(message.trim(), child.ageGroup);

    // Save message to database
    const messageDoc = await Message.create({
      childId,
      content: message.trim(),
      source: 'CHAT', // Message source type
      metadata: { 
        website: source || 'unknown',
        capturedVia: 'extension',
        capturedAt: timestamp || new Date().toISOString()
      }, // Store website domain in metadata
      riskLevel: analysis.riskLevel || 'LOW',
      riskScore: analysis.riskScore || 0,
      aiAnalysisExplanation: analysis.explanation || '',
      riskDetails: analysis.riskDetails || '',
      alertTriggered: analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'MEDIUM',
    });

    // Update child's activity
    child.lastActivityTime = new Date();
    if (analysis.riskLevel === 'HIGH') {
      child.totalHighRiskAlerts = (child.totalHighRiskAlerts || 0) + 1;
    } else if (analysis.riskLevel === 'MEDIUM') {
      child.totalMediumRiskAlerts = (child.totalMediumRiskAlerts || 0) + 1;
    }
    await child.save();

    // Create alert if message is risky
    if (messageDoc.alertTriggered) {
      await createMessageAlert(
        childId,
        child.parentId,
        messageDoc._id,
        analysis.riskLevel,
        analysis.riskScore,
        analysis.explanation,
        message.trim(),
        'CHAT'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Message captured and analyzed successfully',
      data: {
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        explanation: analysis.explanation,
        messageId: messageDoc._id,
        alertTriggered: messageDoc.alertTriggered,
      },
    });
  } catch (error) {
    console.error('Error capturing message from extension:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to capture message',
    });
  }
};
