import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import { initDb, closeDb } from './db/index.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';
import videosRouter from './routes/videos.js';
import chatbotRouter from './routes/chatbot.js';
import analyticsRouter from './routes/analytics.js';
import configRouter from './routes/config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration - allow GitHub Pages and local development
const allowedOrigins = [
  'https://jimmy00415.github.io',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', configRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeDb();
  process.exit(0);
});

// Initialize database and start server
async function start() {
  await initDb();
  
  app.listen(PORT, () => {
    console.log(`ChefWeb backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
