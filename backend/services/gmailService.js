import { google } from 'googleapis';
import mongoose from 'mongoose';
import Child from '../models/Child.js';
import Message from '../models/Message.js';
import Alert from '../models/Alert.js';
import { analyzeMessageWithAI } from './aiService.js';
import { createMessageAlert } from './alertService.js';
import { sendNotificationToUser } from '../server.js';
import dotenv from 'dotenv';

dotenv.config();

// Google OAuth configuration from environment variables.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret_here';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

if (
  GOOGLE_CLIENT_ID === 'your_google_client_id_here.apps.googleusercontent.com' ||
  GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here'
) {
  console.warn('⚠️ Google OAuth credentials are not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export const getAuthUrl = (childId) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Crucial for receiving refresh token
    scope: scopes,
    prompt: 'consent', // Force consent to ensure refresh token is returned
    state: childId // Pass childId to maintain state through callback
  });
};

export const handleAuthCallback = async (code, childId) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user profile to check email (optional verification)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Save tokens to Child model — try by Child _id first, then by linked userId
    let child = await Child.findById(childId);
    if (!child && mongoose.Types.ObjectId.isValid(childId)) {
      // Fallback: state might be a User _id rather than a Child _id
      child = await Child.findOne({ userId: new mongoose.Types.ObjectId(childId) });
    }
    if (!child) throw new Error('Child not found');

    child.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) {
      child.googleRefreshToken = tokens.refresh_token;
    }
    child.googleEmail = userInfo.data.email;
    child.googleConnected = true;
    await child.save();

    return { success: true, email: userInfo.data.email, childId: child._id.toString() };
  } catch (error) {
    console.error('Error in Google Auth Callback:', error);
    throw error;
  }
};

export const fetchAndAnalyzeEmails = async (childId) => {
  try {
    const child = await Child.findById(childId).populate('parentId');
    if (!child || !child.googleConnected) {
      console.log('Child not connected to Google:', childId);
      return;
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: child.googleAccessToken,
      refresh_token: child.googleRefreshToken
    });
    
    // Refresh token if needed handled by library automatically usually, but we might need to handle specific errors
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get list of recent messages (last 10 for demo purposes, can handle pagination/history later)
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: 'is:unread' // Only check unread messages to avoid reprocessing? Or check robustly via historyId
    });

    const messages = res.data.messages || [];
    let analyzedCount = 0;

    for (const messageMeta of messages) {
      // Check if message already processed (avoid duplicates)
      const existingMessage = await Message.findOne({ 'metadata.gmailId': messageMeta.id });
      if (existingMessage) continue;

      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: messageMeta.id
      });
      
      const email = msgRes.data;
      const headers = email.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
      const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';
      const date = headers.find(h => h.name === 'Date')?.value;
      
      let body = getEmailBody(email.payload);
      
      // Analyze content
      const analysis = await analyzeMessageWithAI(subject + "\n\n" + body, child.ageGroup);

      // Normalize SAFE → LOW (Message schema only accepts LOW/MEDIUM/HIGH)
      const riskLevel = analysis.riskLevel === 'SAFE' ? 'LOW' : (analysis.riskLevel || 'LOW');
      // Ensure riskDetails is stored as a string
      const riskDetails = analysis.riskDetails
        ? (typeof analysis.riskDetails === 'string' ? analysis.riskDetails : JSON.stringify(analysis.riskDetails))
        : null;

      // Create Message in DB
      const newMessage = new Message({
        childId: child._id,
        content: body.substring(0, 1000) + (body.length > 1000 ? '...' : ''), // Truncate for storage
        source: 'GMAIL',
        metadata: {
          gmailId: messageMeta.id,
          subject: subject,
          sender: from,
          date: date
        },
        riskLevel: riskLevel,
        riskScore: analysis.riskScore || 0,
        aiAnalysisExplanation: analysis.explanation || null,
        riskDetails: riskDetails,
        alertTriggered: riskLevel === 'HIGH' || riskLevel === 'MEDIUM',
        resolved: riskLevel === 'LOW'
      });
      
      await newMessage.save();
      analyzedCount++;

      // Create Alert if risky
      if (newMessage.alertTriggered) {
        await createMessageAlert(
          child._id,
          child.parentId._id || child.parentId,
          newMessage._id,
          riskLevel,
          analysis.riskScore || 0,
          analysis.explanation || '',
          body.substring(0, 5000),
          'GMAIL'
        );
        
        // Notify Parent (Real-time in a real app)
        if (child.parentId) {
             // We'd emit socket event here if we had direct access to socket instance or use a helper
             // Using the exported helper from server.js (assumed available or imported)
             sendNotificationToUser(child.parentId.toString(), {
               type: 'ALERT_NEW',
               message: `New Email Alert: ${subject}`,
               data: { type: 'SUSPICIOUS_MESSAGE', source: 'GMAIL' }
             });
        }
      }
    }

    return { analyzed: analyzedCount };
  } catch (error) {
    console.error('Error fetching emails:', error);
    // Handle token expiry if necessary, though googleapis handles refresh if refresh_token is present
    throw error;
  }
};

// Helper: Extract body from Gmail payload
function getEmailBody(payload) {
  let body = '';
  if (payload.body && payload.body.data) {
    body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain') {
        if (part.body && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break; // Prefer plain text
        }
      } else if (part.mimeType === 'text/html') {
          // If only HTML, we could strip tags, but let's skip for simple demo or take it if no plain text
          if (!body && part.body && part.body.data) {
             body = Buffer.from(part.body.data, 'base64').toString('utf-8').replace(/<[^>]*>/g, ' '); 
          }
      } else if (part.parts) {
          // Recursive for nested parts
          body = getEmailBody(part);
          if (body) break;
      }
    }
  }
  return body || '(No content)';
}
