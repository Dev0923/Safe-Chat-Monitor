import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  name:                 { type: String, required: true },
  ageGroup:             { type: Number, required: true },
  parentId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  active:               { type: Boolean, default: true },
  totalHighRiskAlerts:  { type: Number, default: 0 },
  totalMediumRiskAlerts:{ type: Number, default: 0 },
  lastActivityTime:     { type: Date, default: Date.now },
  googleAccessToken:    { type: String, default: null },
  googleRefreshToken:   { type: String, default: null },
  googleEmail:          { type: String, default: null },
  googleConnected:      { type: Boolean, default: false },
  lastLoginTime:        { type: Date, default: null },
}, { timestamps: true });

const Child = mongoose.model('Child', childSchema);
export default Child;
