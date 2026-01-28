import { Router } from 'express';
import { query, isPostgres, getMemoryDb, createId } from '../db/index.js';

const router = Router();

// Track video event
router.post('/video', async (req, res) => {
  try {
    const payload = req.body || {};
    const eventType = payload.event || 'video_view';
    const videoId = payload.videoId || null;
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

    if (isPostgres()) {
      await query(`
        INSERT INTO analytics_events (event_type, video_id, page, user_agent, ip_address, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [eventType, videoId, payload.page || null, userAgent, ipAddress, JSON.stringify(payload)]);
    } else {
      getMemoryDb().analytics.push({ 
        id: createId('evt'), 
        ...payload, 
        createdAt: new Date().toISOString() 
      });
    }

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't fail the request for analytics errors
    return res.status(201).json({ ok: true });
  }
});

// Get analytics summary (admin endpoint)
router.get('/summary', async (req, res) => {
  try {
    if (isPostgres()) {
      const result = await query(`
        SELECT event_type, COUNT(*) as count 
        FROM analytics_events 
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY event_type
      `);
      return res.json({ events: result.rows });
    } else {
      const events = getMemoryDb().analytics;
      const summary = events.reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1;
        return acc;
      }, {});
      return res.json({ events: Object.entries(summary).map(([event_type, count]) => ({ event_type, count })) });
    }
  } catch (error) {
    console.error('Analytics summary error:', error);
    return res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;
