import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  // References
  childId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
  parentId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messageId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  activityLogId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityLog', default: null },
  
  // Alert Details
  alertType:       { type: String, enum: ['SUSPICIOUS_MESSAGE', 'DANGEROUS_WEBSITE', 'UNUSUAL_BEHAVIOR'], required: true },
  description:     { type: String, required: true },
  messageContent:  { type: String, default: null },
  websiteDomain:   { type: String, default: null },
  websiteTitle:    { type: String, default: null },
  
  // Risk Assessment
  riskLevel:       { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  riskScore:       { type: Number, min: 0, max: 100, required: true },
  riskExplanation: { type: String, default: null },
  
  // Metadata
  source:          { type: String, enum: ['CHAT', 'GMAIL', 'BROWSING', 'SYSTEM'], default: 'SYSTEM' },
  metadata:        { type: Object, default: {} },
  
  // Status Management
  status:          { type: String, enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE'], default: 'NEW' },
  parentNotes:     { type: String, default: null },
  resolvedAt:      { type: Date, default: null },
  
  // Notifications
  emailSent:       { type: Boolean, default: false },
  pushSent:        { type: Boolean, default: false },
  
  // Actions
  websiteBlocked:  { type: Boolean, default: false },
  warningNotificationSent: { type: Boolean, default: false },
}, { timestamps: true, indexes: [{ parentId: 1, createdAt: -1 }, { childId: 1, createdAt: -1 }] });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
