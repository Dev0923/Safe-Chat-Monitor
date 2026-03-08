import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';
import { connectDB } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import childRoutes from './routes/child.js';
import messageRoutes from './routes/message.js';
import alertRoutes from './routes/alert.js';
import gmailRoutes from './routes/gmail.js';
import activityRoutes from './routes/activity.js';
import activityLogRoutes from './routes/activityLog.js';
import extensionRoutes from './routes/extension.js';
import notificationRoutes from './routes/notification.js';
import learningRoutes from './routes/learning.js';
import checkLinkSafetyRoutes from './routes/checkLinkSafety.js';
import chatRoutes from './routes/chat.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like the extension)
    // Allow localhost and whitelisted origins
    // Allow all chrome-extension:// origins
    if (!origin || allowedOrigins.includes(origin) || origin?.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/children', childRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/check-link-safety', checkLinkSafetyRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Child Safety Monitor API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Child Safety Monitor API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      children: '/api/children',
      messages: '/api/messages',
      alerts: '/api/alerts',
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Map(); // Map userId to WebSocket connection

// Heartbeat to keep connections alive (prevents idle timeout)
const heartbeat = () => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
};

// Send heartbeat every 30 seconds
const heartbeatInterval = setInterval(heartbeat, 30000);

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  ws.isAlive = true;

  // Handle pong responses
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle authentication
      if (data.type === 'authenticate' && data.userId) {
        clients.set(data.userId, ws);
        console.log(`User ${data.userId} authenticated via WebSocket`);
        ws.send(JSON.stringify({ 
          type: 'authenticated', 
          message: 'Successfully authenticated' 
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    // Remove client from map
    for (const [userId, clientWs] of clients.entries()) {
      if (clientWs === ws) {
        clients.delete(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
        break;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Clean up heartbeat on server shutdown
process.on('exit', () => {
  clearInterval(heartbeatInterval);
});

// Function to send notifications to specific users
export const sendNotificationToUser = (userId, notification) => {
  const client = clients.get(userId);
  if (client && client.readyState === 1) { // 1 = OPEN
    client.send(JSON.stringify(notification));
  }
};

// Function to broadcast to all connected clients
export const broadcastNotification = (notification) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(JSON.stringify(notification));
    }
  });
};

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    const dbConnected = await connectDB();

    if (!dbConnected) {
      console.error('❌ Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Start server
    server.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║   🚀 Child Safety Monitor Backend (Node.js)          ║');
      console.log('║                                                       ║');
      console.log(`║   Server running on: http://localhost:${PORT}         ║`);
      console.log(`║   WebSocket running on: ws://localhost:${PORT}/ws     ║`);
      console.log('║                                                       ║');
      console.log(`║   Environment: ${process.env.NODE_ENV || 'development'}                              ║`);
      console.log('║                                                       ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Start the server
startServer();
