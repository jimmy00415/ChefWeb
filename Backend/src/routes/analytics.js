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

// ============================================
// BUSINESS DASHBOARD ENDPOINTS
// ============================================

// Executive Dashboard - Real-time KPIs
router.get('/dashboard', async (req, res) => {
  try {
    if (!isPostgres()) {
      return res.json({ 
        message: 'Dashboard requires PostgreSQL',
        todayRevenue: 0,
        pendingPayments: { count: 0, amount: 0 },
        alerts: []
      });
    }

    // Today's revenue
    const todayRevenue = await query(`
      SELECT COALESCE(SUM(amount)/100.0, 0) as revenue, COUNT(*) as count
      FROM payments 
      WHERE status = 'succeeded' AND DATE(created_at) = CURRENT_DATE
    `);

    // Pending payments
    const pending = await query(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount)/100.0, 0) as amount
      FROM payments WHERE status = 'requires_payment'
    `);

    // Failed payments in last 24h
    const failed = await query(`
      SELECT COUNT(*) as count FROM payments 
      WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'
    `);

    // Bookings today
    const bookingsToday = await query(`
      SELECT COUNT(*) as count FROM bookings WHERE event_date = CURRENT_DATE
    `);

    // Stale pending bookings (> 24h)
    const stale = await query(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE status = 'pending_payment' AND created_at < NOW() - INTERVAL '24 hours'
    `);

    return res.json({
      todayRevenue: todayRevenue.rows[0]?.revenue || 0,
      transactionCount: todayRevenue.rows[0]?.count || 0,
      pendingPayments: pending.rows[0],
      failedPayments24h: failed.rows[0]?.count || 0,
      eventsToday: bookingsToday.rows[0]?.count || 0,
      staleBookings: stale.rows[0]?.count || 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Customer Insights - CLV Analysis
router.get('/customers', async (req, res) => {
  try {
    if (!isPostgres()) {
      return res.json({ customers: [], message: 'Requires PostgreSQL' });
    }

    const result = await query(`
      SELECT 
        contact_email,
        contact_name,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status IN ('confirmed', 'fulfilled') THEN 1 ELSE 0 END) as completed,
        SUM(total) as lifetime_value,
        AVG(total) as avg_order,
        MAX(event_date) as last_booking
      FROM bookings
      WHERE payment_status IN ('paid', 'deposit_paid')
      GROUP BY contact_email, contact_name
      ORDER BY lifetime_value DESC
      LIMIT 100
    `);

    return res.json({ customers: result.rows });
  } catch (error) {
    console.error('Customer insights error:', error);
    return res.status(500).json({ error: 'Failed to load customers' });
  }
});

// Payment Reconciliation
router.get('/reconciliation', async (req, res) => {
  try {
    if (!isPostgres()) {
      return res.json({ payments: [], message: 'Requires PostgreSQL' });
    }

    const result = await query(`
      SELECT 
        p.payment_intent_id,
        p.status as payment_status,
        p.amount / 100.0 as amount_usd,
        b.confirmation_number,
        b.contact_email,
        b.status as booking_status,
        b.payment_status as booking_payment_status,
        p.created_at as payment_date,
        CASE 
          WHEN p.status = 'succeeded' AND b.payment_status != 'paid' THEN 'SYNC_NEEDED'
          WHEN p.status = 'failed' AND b.status = 'confirmed' THEN 'CRITICAL'
          WHEN p.booking_id IS NULL THEN 'ORPHANED'
          ELSE 'OK'
        END as status
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    const issues = result.rows.filter(r => r.status !== 'OK');
    return res.json({ 
      payments: result.rows,
      issueCount: issues.length,
      issues: issues
    });
  } catch (error) {
    console.error('Reconciliation error:', error);
    return res.status(500).json({ error: 'Failed to load reconciliation' });
  }
});

// Manual Payment Sync
router.post('/sync-payments', async (req, res) => {
  try {
    if (!isPostgres()) {
      return res.json({ success: false, message: 'Requires PostgreSQL' });
    }

    // Sync succeeded payments
    const syncResult = await query(`
      UPDATE bookings b
      SET 
        payment_status = 'paid',
        status = CASE WHEN status = 'pending_payment' THEN 'confirmed' ELSE status END,
        updated_at = NOW()
      FROM payments p
      WHERE p.booking_id = b.id
      AND p.status = 'succeeded'
      AND b.payment_status != 'paid'
      RETURNING b.confirmation_number
    `);

    // Sync refunds
    const refundResult = await query(`
      UPDATE bookings b
      SET payment_status = 'refunded', updated_at = NOW()
      FROM payments p
      WHERE p.booking_id = b.id
      AND p.status = 'refunded'
      AND b.payment_status != 'refunded'
      RETURNING b.confirmation_number
    `);

    return res.json({ 
      success: true, 
      syncedPayments: syncResult.rowCount,
      syncedRefunds: refundResult.rowCount
    });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Failed to sync payments' });
  }
});

// Revenue Report
router.get('/revenue', async (req, res) => {
  try {
    if (!isPostgres()) {
      return res.json({ daily: [], monthly: [], message: 'Requires PostgreSQL' });
    }

    // Last 30 days
    const daily = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100.0 as revenue,
        SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) / 100.0 as refunds
      FROM payments
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Monthly summary
    const monthly = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as transactions,
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100.0 as revenue,
        SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) / 100.0 as refunds
      FROM payments
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);

    return res.json({ 
      daily: daily.rows,
      monthly: monthly.rows
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    return res.status(500).json({ error: 'Failed to load revenue' });
  }
});

// Package Performance
router.get('/packages', async (req, res) => {
  try {
    if (!isPostgres()) {
      return res.json({ packages: [], message: 'Requires PostgreSQL' });
    }

    const result = await query(`
      SELECT 
        package,
        COUNT(*) as bookings,
        SUM(total) as revenue,
        AVG(total) as avg_order,
        AVG(num_adults + num_children) as avg_guests
      FROM bookings
      WHERE payment_status IN ('paid', 'deposit_paid')
      GROUP BY package
      ORDER BY revenue DESC
    `);

    return res.json({ packages: result.rows });
  } catch (error) {
    console.error('Package stats error:', error);
    return res.status(500).json({ error: 'Failed to load packages' });
  }
});

// Geographic Analysis
router.get('/geography', async (req, res) => {
  try {
    if (!isPostgres()) {
      return res.json({ regions: [], message: 'Requires PostgreSQL' });
    }

    const result = await query(`
      SELECT 
        service_state,
        city,
        COUNT(*) as bookings,
        SUM(total) as revenue,
        COUNT(DISTINCT contact_email) as unique_customers
      FROM bookings
      WHERE status != 'cancelled'
      GROUP BY service_state, city
      ORDER BY revenue DESC
      LIMIT 50
    `);

    return res.json({ regions: result.rows });
  } catch (error) {
    console.error('Geography error:', error);
    return res.status(500).json({ error: 'Failed to load geography' });
  }
});

export default router;
