import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:    { type: String, required: true },
  entity:    { type: String, required: true },
  entityId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  details:   { type: String, default: null },
  ipAddress: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
