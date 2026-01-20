import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';
import videosRouter from './routes/videos.js';
import chatbotRouter from './routes/chatbot.js';
import analyticsRouter from './routes/analytics.js';
import configRouter from './routes/config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: false }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', configRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`ChefWeb backend running on port ${PORT}`);
});
