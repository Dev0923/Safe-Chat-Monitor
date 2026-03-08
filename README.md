# Child Safety Monitoring System - Complete Setup Guide

## 🚀 Quick Start

This full-stack system monitors child online safety using AI-powered message analysis. It includes parent dashboards, child learning modules, and real-time alerts.

## 📋 Project Overview

- **Backend**: Spring Boot 3.0 (Java 17)
- **Frontend**: React 18 + Tailwind CSS
- **Database**: MySQL 8.0
- **AI**: Google Gemini API
- **Real-time**: WebSocket
- **Authentication**: JWT + BCrypt

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  Parent Dashboard | Child Simulator | Settings           │
└────────────────────────┬────────────────────────────────┘
                         │
                    REST API + WebSocket
                         │
┌────────────────────────▼────────────────────────────────┐
│                  BACKEND (Spring Boot)                   │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Controllers  │ Services     │ Repositories │          │
│  ├──────────────┼──────────────┼──────────────┤          │
│  │ AI Analysis  │ Alerts       │ Audit Logs   │          │
│  │ WebSocket    │ Email        │ Security     │          │
│  └──────────────┴──────────────┴──────────────┘          │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    ┌────────────┐  ┌─────────┐  ┌──────────┐
    │  MySQL DB  │  │ Gemini  │  │Gmail SMTP│
    │            │  │   API   │  │          │
    └────────────┘  └─────────┘  └──────────┘
```

## 📦 Project Structure

```
Hardik project/
├── backend/
│   ├── src/main/java/com/childsafety/
│   │   ├── controller/          # REST endpoints
│   │   ├── service/             # Business logic
│   │   ├── model/               # JPA entities
│   │   ├── repository/          # Data access
│   │   ├── dto/                 # Data transfer objects
│   │   ├── security/            # JWT & Auth
│   │   ├── config/              # Configurations
│   │   └── websocket/           # Real-time updates
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── pom.xml
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # React pages
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API & WebSocket
│   │   ├── store/              # Zustand stores
│   │   ├── utils/              # Helpers
│   │   ├── App.jsx             # Root component
│   │   └── index.css           # Tailwind styles
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
└── database/
    └── schema.sql              # MySQL schema
```

## 🔧 Installation Guide

### Prerequisites

- Java 17 JDK
- Node.js 16+
- MySQL 8.0
- Git
- Google Gemini API Key (free tier available)

### Step 1: Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Execute schema
source database/schema.sql

# Verify tables
USE child_safety_db;
SHOW TABLES;
```

**Demo Users**:
```sql
-- Parent account
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES ('John Parent', 'parent@example.com', '$2a$10$...', 'ROLE_PARENT', NOW(), NOW());

-- Child account  
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES ('Jane Child', 'child@example.com', '$2a$10$...', 'ROLE_CHILD', NOW(), NOW());
```

### Step 2: Backend Setup

```bash
cd backend

# Configure application.properties
# Edit src/main/resources/application.properties:
# - spring.datasource.password=your_mysql_password
# - gemini.api.key=your_gemini_api_key
# - spring.mail.username=your_email@gmail.com
# - spring.mail.password=your_app_specific_password

# Build
mvn clean install

# Run
mvn spring-boot:run
```

**Backend runs on**: `http://localhost:8080`

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "REACT_APP_API_URL=http://localhost:8080/api" > .env.local

# Run development server
npm run dev
```

**Frontend runs on**: `http://localhost:3000`

## 📱 Usage Guide

### For Parents

1. **Sign Up**: Register as ROLE_PARENT
2. **Add Child**: Go to dashboard and add child profile
3. **View Alerts**: See real-time risky message alerts
4. **Resolve**: Review and mark alerts as resolved
5. **Analytics**: Check weekly risk trends

### For Children

1. **Sign Up**: Register as ROLE_CHILD with age group
2. **Practice**: Use Safe Chat Simulator
3. **Learn**: Read cyber safety tips
4. **Test Messages**: See how AI analyses different messages
5. **Understand**: Learn what triggers alerts

## 🔐 Security Features

- ✅ JWT token-based authentication (24-hour expiration)
- ✅ BCrypt password hashing (10 rounds)
- ✅ Role-based access control (PARENT, CHILD, ADMIN)
- ✅ CORS configuration with whitelist
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React sanitization)
- ✅ HTTPS-ready configuration
- ✅ Secure WebSocket connections
- ✅ Audit logging on critical actions
- ✅ Input validation and sanitization

## 🤖 AI Message Analysis

### How It Works

1. **Message Input**: Child sends message
2. **Gemini Analysis**: AI checks for:
   - Bullying language
   - Threats or violence
   - Stranger interactions
   - Secret-keeping requests
   - Sexual/inappropriate content
   - Manipulation tactics
   - Suspicious links
   - Self-harm indicators
3. **Risk Score**: 0-100 scale
4. **Classification**: SAFE (0-30) | MEDIUM (30-70) | HIGH (70-100)
5. **Alert**: If not SAFE, parent gets notification

### Example Response

```json
{
  "riskLevel": "HIGH",
  "riskScore": 85,
  "explanation": "Message contains request for secrecy from parents (high-risk indicator) and suspicious request to meet in unfamiliar location",
  "confidence": 0.92,
  "isSafe": false,
  "requiresAlert": true
}
```

## 📊 API Endpoints

### Authentication

```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login user
PUT    /api/auth/password        Change password
GET    /api/auth/validate-token  Validate JWT
```

### Messages

```
POST   /api/messages/analyze                Analyze message
GET    /api/messages/child/{childId}        Get messages
GET    /api/messages/child/{childId}/unresolved
PUT    /api/messages/{id}/resolve           Mark resolved
GET    /api/messages/stats/high-risk/{id}   High risk count
```

### Alerts

```
GET    /api/alerts/parent/{parentId}        Get parent alerts
GET    /api/alerts/parent/{parentId}/unresolved
GET    /api/alerts/parent/{parentId}/count
PUT    /api/alerts/{id}/resolve             Resolve alert
PUT    /api/alerts/{id}/acknowledge         Acknowledge alert
GET    /api/alerts/child/{childId}          Get child alerts
```

### Users

```
GET    /api/user/profile/{userId}           Get profile
PUT    /api/user/profile/{userId}           Update profile
PUT    /api/user/{id}/settings/email-alerts Toggle emails
PUT    /api/user/{id}/settings/dark-mode    Toggle dark mode
```

### Children

```
POST   /api/children                        Add child
GET    /api/children/parent/{parentId}      List children
GET    /api/children/{id}                   Get child
PUT    /api/children/{id}                   Update child
DELETE /api/children/{id}                   Remove child
```

## 🔔 WebSocket Real-time Notifications

### Connection

```javascript
ws://localhost:8080/api/websocket/notifications?token={JWT_TOKEN}
```

### Message Types

```json
{
  "type": "NEW_ALERT",
  "data": { /* AlertDTO */ },
  "timestamp": 1234567890
}
```

## 📈 Database Queries

### High-Risk Alerts for Parent

```sql
SELECT * FROM alerts 
WHERE parent_id = ? 
AND status = 'UNRESOLVED'
AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;
```

### Child Activity Summary

```sql
SELECT 
    c.name,
    COUNT(m.id) as total_messages,
    SUM(CASE WHEN m.risk_level='HIGH' THEN 1 ELSE 0 END) as high_risk,
    SUM(CASE WHEN m.risk_level='MEDIUM' THEN 1 ELSE 0 END) as medium_risk
FROM children c
LEFT JOIN messages m ON c.id = m.child_id
WHERE c.parent_id = ? AND m.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY c.id;
```

## 📝 Testing

### Backend Unit Tests

```bash
cd backend
mvn test
```

### Frontend Component Tests

```bash
cd frontend
npm test
```

### Manual Integration Testing

1. **Register Flow**: Create parent → Add child → Login as child
2. **Message Analysis**: Send test messages in child dashboard
3. **Alert Flow**: Trigger HIGH risk alert → Receive notification
4. **WebSocket**: Open multiple browser windows → Send message → See real-time update
5. **Settings**: Change password → Toggle dark mode → Logout/login

## 🚨 Common Issues & Solutions

### Issue: "No qualifying bean of type 'JwtProvider'"

**Solution**: Ensure `@Component` annotations on all services

### Issue: API calls fail with 401

**Solution**: Check JWT token in localStorage, might be expired

### Issue: Gmail not sending emails

**Solution**: 
- Enable 2FA on Gmail
- Generate App Password (not regular password)
- Use app-specific password in `application.properties`

### Issue: Gemini API rate limit

**Solution**: 
- Use free tier limit (~60 requests/minute)
- Add request throttling in service

### Issue: WebSocket connection fails

**Solution**:
- Check token query parameter format
- Ensure backend is running
- Check browser console for errors

## 📚 Educational Features

### Safety Tips for Children

- Never share personal information
- Verify before meeting anyone from online
- Report suspicious activity
- Think before you post
- Understand online etiquette
- Recognize manipulation tactics
- Safe password practices
- Privacy settings on social media

### Parent Resources

- Understanding online risks
- How to talk to children about safety
- Recognizing warning signs
- Setting healthy boundaries
- When to seek help

## 🔄 Deployment

### Production Checklist

- [ ] Change JWT secret to 256+ character strong key
- [ ] Update database credentials
- [ ] Set Gemini API key from environment variable
- [ ] Enable HTTPS/SSL
- [ ] Configure production CORS
- [ ] Set up database backups
- [ ] Enable monitoring and logging
- [ ] Test email notifications
- [ ] Load testing
- [ ] Security audit

### Docker Deployment

See individual README files in backend/ and frontend/ directories.

## 📞 Support

For issues or questions:
1. Check README in backend/ and frontend/
2. Review error logs
3. Contact development team

## 📄 License

This project is confidential and for educational purposes only.

---

**Version**: 1.0.0  
**Last Updated**: March 2, 2026  
**Status**: Production Ready ✅
