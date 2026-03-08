# Child Safety Monitoring System - Backend Documentation

## Overview

The Spring Boot backend provides REST APIs for the child safety monitoring system with AI-powered message analysis using Google Gemini API.

## Tech Stack

- **Framework**: Spring Boot 3.0.6
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Authentication**: JWT + Spring Security
- **AI Integration**: Google Gemini API
- **Email**: Spring Mail (Gmail SMTP)
- **Real-time**: WebSocket
- **Build**: Maven

## Project Structure

```
backend/
├── src/main/java/com/childsafety/
│   ├── controller/          # REST Controllers
│   ├── service/             # Business Logic
│   ├── model/               # JPA Entities
│   ├── repository/          # Data Access Layer
│   ├── dto/                 # Data Transfer Objects
│   ├── security/            # JWT & Security
│   ├── config/              # Spring Configurations
│   ├── websocket/           # WebSocket Handlers
│   └── ChildSafetyApplication.java
├── src/main/resources/
│   └── application.properties
└── pom.xml
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `PUT /api/auth/password` - Change password
- `GET /api/auth/validate-token` - Validate JWT token

### Messages
- `POST /api/messages/analyze` - Analyze child message
- `GET /api/messages/child/{childId}` - Get child messages
- `GET /api/messages/child/{childId}/unresolved` - Get unresolved messages
- `PUT /api/messages/{messageId}/resolve` - Mark message as resolved
- `GET /api/messages/stats/high-risk/{childId}` - Get high-risk message count
- `GET /api/messages/stats/medium-risk/{childId}` - Get medium-risk message count

### Alerts
- `GET /api/alerts/parent/{parentId}` - Get parent alerts (paginated)
- `GET /api/alerts/parent/{parentId}/unresolved` - Get unresolved alerts
- `GET /api/alerts/parent/{parentId}/count` - Get unresolved alert count
- `PUT /api/alerts/{alertId}/resolve` - Resolve alert
- `PUT /api/alerts/{alertId}/acknowledge` - Acknowledge alert
- `GET /api/alerts/child/{childId}` - Get child alerts

### Users
- `GET /api/user/profile/{userId}` - Get user profile
- `PUT /api/user/profile/{userId}` - Update user profile
- `PUT /api/user/{userId}/settings/email-alerts` - Toggle email alerts
- `PUT /api/user/{userId}/settings/dark-mode` - Toggle dark mode

### Children
- `POST /api/children` - Add child
- `GET /api/children/parent/{parentId}` - Get parent's children
- `GET /api/children/{childId}` - Get child details
- `PUT /api/children/{childId}` - Update child
- `DELETE /api/children/{childId}` - Remove child

## Setup Instructions

### Prerequisites
- Java 17 JDK
- Maven 3.8+
- MySQL 8.0
- Google Cloud Account (for Gemini API)

### Environment Setup

1. **Database Setup**:
```bash
mysql -u root -p < database/schema.sql
```

2. **Configure Application Properties**:
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/child_safety_db
spring.datasource.username=root
spring.datasource.password=your_password

gemini.api.key=your_gemini_api_key

spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_specific_password
```

3. **Build Project**:
```bash
mvn clean install
```

4. **Run Application**:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## AI Message Analysis

The system uses Google Gemini API to analyze messages for:
- Bullying tone
- Threats or violent language
- Stranger interactions
- Requests to hide from parents
- Sexual/inappropriate content
- Manipulation phrases
- Suspicious links
- Self-harm indicators

**Risk Levels**:
- **SAFE (0-30)**: Normal conversation
- **MEDIUM (30-70)**: Suspicious activity requiring monitoring
- **HIGH (70-100)**: Dangerous content requiring immediate attention

## Authentication Flow

1. User registers/logs in
2. JWT token issued
3. Token included in `Authorization: Bearer {token}` header
4. JwtAuthenticationFilter validates token
5. Request authorized based on user role

## Database Schema

### Users Table
- Stores user account information
- Supports role-based access control (PARENT, CHILD, ADMIN)
- Settings for email alerts and dark mode

### Children Table
- Links children to parent accounts
- Tracks activity metrics and alert counts

### Messages Table
- Stores all child messages
- AI analysis results and risk assessment
- Resolution tracking

### Alerts Table
- Tracks safety alerts triggered
- Parent acknowledgment and resolution status
- Audit trail for parent actions

### Audit Logs
- System action logging
- User activity tracking

## WebSocket Real-time Notifications

Connect to WebSocket endpoint:
```
ws://localhost:8080/api/websocket/notifications?token={JWT_TOKEN}
```

Receives notifications for:
- New high-risk alerts
- Status updates
- System messages

## Email Notifications

Automated alerts sent to parents for:
- HIGH-risk messages (immediate)
- MEDIUM-risk messages (if enabled)
- Includes message content and analysis

## Security Best Practices

1. **Password Hashing**: BCrypt with 10 rounds
2. **JWT Expiration**: 24 hours
3. **CORS Configuration**: Whitelist frontend URLs
4. **Role-Based Access Control**: Method-level security
5. **Input Validation**: Jakarta Bean Validation annotations
6. **Audit Logging**: All critical actions logged

## Error Handling

Standard HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Testing

```bash
mvn test
```

## Deployment

### Production Checklist
- [ ] Change JWT secret to strong value
- [ ] Update database credentials
- [ ] Configure SSL/HTTPS
- [ ] Set Gemini API key securely
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring/logging
- [ ] Enable database backups
- [ ] Test email notifications
- [ ] Perform load testing

### Docker Deployment
```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/child-safety-monitor-1.0.0.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]
```

## Troubleshooting

### Gemini API Errors
- Verify API key is correct
- Check API quotas in Google Cloud Console
- Ensure message content is properly escaped

### Database Connection Issues
- Verify MySQL is running
- Check connection string credentials
- Ensure database and tables exist

### JWT Token Issues
- Validate token format
- Check token expiration
- Verify JWT secret matches

## Contact & Support

For issues or questions, contact the development team.
