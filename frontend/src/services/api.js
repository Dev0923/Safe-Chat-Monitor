import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Authentication API
export const authAPI = {
  register: (name, email, password, role, parentId = null, ageGroup = null) =>
    api.post('/auth/register', { fullName: name, email, password, role, parentId, ageGroup }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  changePassword: (oldPassword, newPassword) =>
    api.put('/auth/password', null, { params: { oldPassword, newPassword } }),
  
  validateToken: () =>
    api.get('/auth/validate-token'),
}

// Message API
export const messageAPI = {
  analyzeMessage: (content, childId) =>
    api.post(`/messages/analyze/${childId}`, { content }),
  
  getChildMessages: (childId) =>
    api.get(`/messages/child/${childId}`),
  
  getUnresolvedMessages: (childId) =>
    api.get(`/messages/child/${childId}`).then(res => {
      // Filter unresolved messages on client side
      const messages = Array.isArray(res.data) ? res.data : res.data.messages || [];
      return { ...res, data: messages.filter(msg => !msg.resolved) };
    }),
  
  resolveMessage: (messageId) =>
    api.put(`/alerts/${messageId}/status`, { status: 'RESOLVED' }),
  
  getHighRiskCount: (childId) =>
    api.get(`/messages/child/${childId}`).then(res => {
      const messages = Array.isArray(res.data) ? res.data : res.data.messages || [];
      return { ...res, data: messages.filter(msg => msg.riskLevel === 'HIGH').length };
    }),
  
  getMediumRiskCount: (childId) =>
    api.get(`/messages/child/${childId}`).then(res => {
      const messages = Array.isArray(res.data) ? res.data : res.data.messages || [];
      return { ...res, data: messages.filter(msg => msg.riskLevel === 'MEDIUM').length };
    }),
}

// Alert API
export const alertAPI = {
  getParentAlerts: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters.alertType) params.append('alertType', filters.alertType);
    if (filters.status) params.append('status', filters.status);
    if (filters.page !== undefined) params.append('page', filters.page);
    if (filters.limit !== undefined) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    return api.get(`/alerts?${params.toString()}`);
  },
  
  getAlertStats: () =>
    api.get('/alerts/stats'),
  
  getUnresolvedAlerts: (filters = {}) => {
    const normalizedFilters =
      filters && typeof filters === 'object' && !Array.isArray(filters)
        ? { ...filters }
        : {};

    normalizedFilters.status = 'NEW';
    return alertAPI.getParentAlerts(normalizedFilters);
  },
  
  getUnresolvedCount: () =>
    api.get('/alerts?status=NEW&limit=1').then(res => {
      const result = res.data;
      return { ...res, data: result.pagination?.total || 0 };
    }),
  
  getChildAlerts: (childId, filters = {}) => {
    const params = new URLSearchParams();
    params.append('childId', childId);
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters.status) params.append('status', filters.status);
    return api.get(`/alerts/child/${childId}?${params.toString()}`);
  },
  
  createMessageAlert: (childId, messageId, riskLevel, riskScore, messageContent, source = 'CHAT', riskExplanation = '') =>
    api.post('/alerts/message', {
      childId,
      messageId,
      riskLevel,
      riskScore,
      messageContent,
      source,
      riskExplanation
    }),
  
  createWebsiteAlert: (childId, activityLogId, riskLevel, riskScore, websiteDomain, websiteTitle = 'Unknown') =>
    api.post('/alerts/website', {
      childId,
      activityLogId,
      riskLevel,
      riskScore,
      websiteDomain,
      websiteTitle
    }),
  
  createBehaviorAlert: (childId, riskLevel, riskScore, behaviorDescription, metadata = {}) =>
    api.post('/alerts/behavior', {
      childId,
      riskLevel,
      riskScore,
      behaviorDescription,
      metadata
    }),
  
  resolveAlert: (alertId, notes = '') =>
    api.put(`/alerts/${alertId}/status`, { status: 'RESOLVED', notes }),
  
  acknowledgeAlert: (alertId) =>
    api.put(`/alerts/${alertId}/status`, { status: 'ACKNOWLEDGED' }),
  
  blockWebsite: (alertId, domain) =>
    api.post(`/alerts/${alertId}/block-website`, { domain }),
  
  sendWarningNotification: (alertId, warningMessage) =>
    api.post(`/alerts/${alertId}/send-warning`, { warningMessage }),
}

// Gmail API
export const gmailAPI = {
  connect: (childId) => 
    api.post('/gmail/connect', { childId }),
  
  handleCallback: (code, state) =>
    api.post('/gmail/callback', { code, state }),
    
  sync: (childId) =>
    api.post(`/gmail/sync/${childId}`),
    
  disconnect: (childId) =>
    api.post(`/gmail/disconnect/${childId}`),

  getStatus: (childId) =>
    api.get(`/gmail/status/${childId}`),

  getChildEmails: (childId) =>
    api.get(`/gmail/emails/${childId}`)
}

// User API
export const userAPI = {
  getProfile: (userId) =>
    api.get('/users/profile'),
  
  updateProfile: (userId, data) =>
    api.put('/users/profile', data),
  
  toggleEmailAlerts: (userId) =>
    api.get('/users/settings').then(res => {
      const currentSettings = res.data;
      return api.put('/users/settings', { 
        ...currentSettings, 
        emailAlertsEnabled: !currentSettings.emailAlertsEnabled 
      });
    }),
  
  toggleDarkMode: (userId) =>
    api.get('/users/settings').then(res => {
      const currentSettings = res.data;
      return api.put('/users/settings', { 
        ...currentSettings, 
        darkModeEnabled: !currentSettings.darkModeEnabled 
      });
    }),
}

// Child API
export const childAPI = {
  addChild: (parentId, name, ageGroup) =>
    api.post('/children', { name, ageGroup }),

  linkChild: (email, password, ageGroup) =>
    api.post('/children/link', { email, password, ageGroup }),
  
  getParentChildren: (parentId) =>
    api.get('/children'),
  
  getChildDetails: (childId) =>
    api.get(`/children/${childId}`),
  
  updateChild: (childId, name = null, ageGroup = null) =>
    api.put(`/children/${childId}`, { name, ageGroup }),
  
  removeChild: (childId) =>
    api.delete(`/children/${childId}`),
}

// Activity API (Browser Extension Tracking)
export const activityAPI = {
  getChildActivities: (childId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.domain) params.append('domain', options.domain);
    if (options.flagged !== undefined) params.append('flagged', options.flagged);
    return api.get(`/activity/child/${childId}?${params.toString()}`);
  },
  
  getParentActivities: (parentId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.childId) params.append('childId', options.childId);
    return api.get(`/activity/parent/${parentId}?${params.toString()}`);
  },
  
  getActivityStats: (childId, days = 7) =>
    api.get(`/activity/child/${childId}/stats?days=${days}`),
  
  flagActivity: (activityId, flagged = true, riskLevel = 'MEDIUM') =>
    api.patch(`/activity/${activityId}/flag`, { flagged, riskLevel }),
}

// Activity Log API (Browsing History for Parent Dashboard)
export const activityLogAPI = {
  getActivityLogs: (parentId, options = {}) => {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    if (options.childId) params.append('childId', options.childId);
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    const query = params.toString();
    return api.get(`/activity-log${query ? `?${query}` : ''}`);
  },
  
  getActivityStats: (parentId, childId = null) => {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    if (childId) params.append('childId', childId);
    const query = params.toString();
    return api.get(`/activity-log/stats${query ? `?${query}` : ''}`);
  },
  
  deleteActivityLog: (logId) =>
    api.delete(`/activity-log/${logId}`),
}

// Notification API
export const notificationAPI = {
  getNotifications: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit !== undefined) params.append('limit', filters.limit);
    if (filters.skip !== undefined) params.append('skip', filters.skip);
    return api.get(`/notifications?${params.toString()}`);
  },

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/mark-read`),

  markAllAsRead: () =>
    api.put('/notifications/mark-all-read'),

  deleteNotification: (notificationId) =>
    api.delete(`/notifications/${notificationId}`),

  deleteAllRead: () =>
    api.delete('/notifications/read/all'),
}

// Cyber Safety Learning API
export const learningAPI = {
  getTopics: () =>
    api.get('/learning/topics'),

  generateLesson: (topic, ageGroup = '10-14') =>
    api.post('/learning/generate', { topic, ageGroup }),
}

// Ask Before You Click API
export const linkSafetyAPI = {
  checkLinkSafety: (childId, url) =>
    api.post('/check-link-safety', { childId, url }),

  reportSuspiciousLink: ({ childId, url, riskLevel, explanation }) =>
    api.post('/check-link-safety/report', {
      childId,
      url,
      riskLevel,
      explanation,
    }),
}

export const chatAPI = {
  sendMessage: (message, history = []) =>
    api.post('/chat/message', { message, history }),
}

export default api
