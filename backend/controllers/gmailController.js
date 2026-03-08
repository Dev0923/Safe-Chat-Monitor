import { getAuthUrl, handleAuthCallback, fetchAndAnalyzeEmails } from '../services/gmailService.js';
import Child from '../models/Child.js';
import Message from '../models/Message.js';

export const connectGmail = async (req, res) => {
  try {
    const { childId } = req.body;
    const url = await getAuthUrl(childId); // Pass childId to state if needed, or handle differently
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const oauthCallback = async (req, res) => {
  try {
    const { code, state } = req.body; // Expecting frontend to send code and state (childId)
    // In a real app, validate state to prevent CSRF
    const result = await handleAuthCallback(code, state);
    res.json({ success: true, email: result.email });
    // Trigger an initial email scan in the background (don't await — response already sent)
    if (result.childId) {
      fetchAndAnalyzeEmails(result.childId).catch(err =>
        console.error('Auto-sync after Gmail connect failed:', err)
      );
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const syncGmail = async (req, res) => {
  try {
    const { childId } = req.params;
    const result = await fetchAndAnalyzeEmails(childId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const disconnectGmail = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });
    
    child.googleAccessToken = null;
    child.googleRefreshToken = null;
    child.googleEmail = null;
    child.googleConnected = false;
    await child.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getGmailStatus = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId).select('googleConnected googleEmail');
    if (!child) return res.status(404).json({ error: 'Child not found' });
    res.json({ connected: child.googleConnected, email: child.googleEmail || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getChildEmailMessages = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId).select('userId parentId');
    if (!child) return res.status(404).json({ error: 'Child not found' });

    // Allow the child themselves OR their parent
    const requesterId = req.user.id;
    const isChild  = child.userId?.toString()  === requesterId;
    const isParent = child.parentId?.toString() === requesterId;
    if (!isChild && !isParent) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = await Message.find({ childId: child._id, source: 'GMAIL' })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
