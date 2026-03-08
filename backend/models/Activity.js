import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
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
  title: { 
    type: String, 
    default: '' 
  },
  domain: { 
    type: String, 
    index: true 
  },
  activityType: { 
    type: String, 
    enum: ['BROWSER', 'APP', 'GAME', 'OTHER'], 
    default: 'BROWSER' 
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
  flagged: { 
    type: Boolean, 
    default: false 
  },
  riskLevel: { 
    type: String, 
    enum: ['SAFE', 'LOW', 'MEDIUM', 'HIGH'], 
    default: 'SAFE' 
  },
}, { timestamps: true });

activitySchema.index({ childId: 1, timestamp: -1 });
activitySchema.index({ childId: 1, domain: 1 });

activitySchema.pre('save', function() {
  if (this.url) {
    try {
      const urlObj = new URL(this.url);
      this.domain = urlObj.hostname;
    } catch (err) {
      this.domain = 'unknown';
    }
  }
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
