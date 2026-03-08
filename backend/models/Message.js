import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  childId:               { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  content:               { type: String, required: true },
  source:                { type: String, enum: ['CHAT', 'GMAIL', 'SMS'], default: 'CHAT' },
  metadata:              { type: Object, default: {} }, // For email subject, sender, etc.
  riskLevel:             { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  riskScore:             { type: Number, required: true },
  aiAnalysisExplanation: { type: String, default: null },
  alertTriggered:        { type: Boolean, default: false },
  resolved:              { type: Boolean, default: false },
  riskDetails:           { type: String, default: null },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
