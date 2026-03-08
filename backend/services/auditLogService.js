import { AuditLog } from '../models/index.js';

export const createAuditLog = async (userId, action, entity, entityId, details, ipAddress) => {
  try {
    await AuditLog.create({ userId, action, entity, entityId, details, ipAddress });
  } catch (error) {
    console.error('Create audit log error:', error);
  }
};

export const getAuditLogs = async (filters = {}) => {
  try {
    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.entity) query.entity = filters.entity;
    if (filters.action) query.action = filters.action;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);

    return logs;
  } catch (error) {
    console.error('Get audit logs error:', error);
    throw error;
  }
};
