import { Message, Child } from '../models/index.js';
import { analyzeMessageWithAI } from './aiService.js';
import { createMessageAlert } from './alertService.js';
import mongoose from 'mongoose';

export const analyzeMessage = async (messageRequest, childId, userId) => {
  try {
    const { content } = messageRequest;

    console.log('Analyzing message:', { childId, userId, contentLength: content?.length });

    // Convert IDs to ObjectId if they're strings
    const childObjectId = mongoose.Types.ObjectId.isValid(childId)
      ? new mongoose.Types.ObjectId(childId)
      : null;
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    let child = null;

    // Find the child record by childId (parent or child accessing)
    if (childObjectId) {
      child = await Child.findOne({
        $or: [
          { _id: childObjectId, parentId: userObjectId },  // Parent accessing child's data
          { _id: childObjectId, userId: userObjectId },    // Child accessing their own data (linked account)
          { _id: childObjectId, userId: null }             // Unlinked child record
        ]
      });
    }

    // Fallback: look up the child record by userId directly (child user with no stored childId)
    if (!child) {
      child = await Child.findOne({ userId: userObjectId });
    }

    if (!child) {
      console.error('Child not found with query:', { childId, userId });
      throw new Error('Child not found or access denied');
    }

    // Use resolved child._id (handles fallback case where childId param was null)
    const resolvedChildId = child._id;

    const analysis = await analyzeMessageWithAI(content, child.ageGroup);

    const message = await Message.create({
      childId: resolvedChildId,
      content,
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
      aiAnalysisExplanation: analysis.explanation,
      riskDetails: analysis.riskDetails,
      alertTriggered: analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'MEDIUM',
    });

    child.lastActivityTime = new Date();
    if (analysis.riskLevel === 'HIGH') child.totalHighRiskAlerts += 1;
    else if (analysis.riskLevel === 'MEDIUM') child.totalMediumRiskAlerts += 1;
    await child.save();

    if (message.alertTriggered) {
      await createMessageAlert(
        resolvedChildId,
        child.parentId,  // Use the actual parentId from child record
        message._id,
        analysis.riskLevel,
        analysis.riskScore,
        analysis.explanation,
        content,
        'CHAT'
      );
    }

    // Normalize LOW → SAFE for frontend display (DB stores the original LOW value)
    const displayRiskLevel = analysis.riskLevel === 'LOW' ? 'SAFE' : analysis.riskLevel;

    return {
      success: true,
      riskLevel: displayRiskLevel,
      riskScore: analysis.riskScore,
      explanation: analysis.explanation,
      messageId: message._id,
      alertTriggered: message.alertTriggered,
    };
  } catch (error) {
    console.error('Analyze message error:', error);
    throw error;
  }
};

export const getMessagesByChildId = async (childId, userId) => {
  try {
    // Convert IDs to ObjectId if they're strings
    const childObjectId = mongoose.Types.ObjectId.isValid(childId) 
      ? new mongoose.Types.ObjectId(childId) 
      : childId;
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    // Find the child record - userId could be either parent or the child's userId
    const child = await Child.findOne({ 
      $or: [
        { _id: childObjectId, parentId: userObjectId },  // Parent accessing child's data
        { _id: childObjectId, userId: userObjectId },    // Child accessing their own data (linked account)
        { _id: childObjectId, userId: null }             // Unlinked child record
      ]
    });
    if (!child) throw new Error('Child not found or access denied');

    const messages = await Message.find({ childId })
      .sort({ createdAt: -1 })
      .limit(100);

    return messages;
  } catch (error) {
    console.error('Get messages by child ID error:', error);
    throw error;
  }
};
