import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  childId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Child', 
    required: true,
    index: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  domain: { 
    type: String, 
    required: true,
    index: true 
  },
  title: { 
    type: String, 
    default: '' 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  duration: { 
    type: Number, 
    default: 0 
  },
  category: { 
    type: String, 
    enum: ['Education', 'Entertainment', 'Social', 'Gaming', 'News', 'Shopping', 'Adult', 'Gambling', 'Violence', 'Unknown'], 
    default: 'Unknown' 
  },
  riskLevel: { 
    type: String, 
    enum: ['Safe', 'Warning', 'Dangerous'], 
    default: 'Safe' 
  },
  device: { 
    type: String, 
    default: 'Chrome' 
  }
}, { timestamps: true });

// Compound indexes for efficient queries
activityLogSchema.index({ parentId: 1, timestamp: -1 });
activityLogSchema.index({ childId: 1, timestamp: -1 });
activityLogSchema.index({ parentId: 1, childId: 1, timestamp: -1 });

// Pre-save middleware to extract domain if not provided
activityLogSchema.pre('save', function() {
  if (this.url && !this.domain) {
    try {
      const urlObj = new URL(this.url);
      this.domain = urlObj.hostname;
    } catch (err) {
      this.domain = 'unknown';
    }
  }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
