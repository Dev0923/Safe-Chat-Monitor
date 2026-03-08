import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    default: null
  },
  childName: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: [
      'ACTIVITY_UPDATE',
      'WEBSITE_ACCESS',
      'SYSTEM_MESSAGE',
      'ACCOUNT_CHANGE',
      'PARENT_ACTION'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['READ', 'UNREAD'],
    default: 'UNREAD'
  },
  readAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
notificationSchema.index({ parentId: 1, createdAt: -1 });
notificationSchema.index({ parentId: 1, status: 1 });
notificationSchema.index({ parentId: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
