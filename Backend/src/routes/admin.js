/**
 * Admin API Routes
 * Dashboard, booking management, and admin functions
 */
import { Router } from 'express';
import { query, isPostgres, getMemoryDb } from '../db/index.js';
import { 
    validateAdminKey, 
    invalidateSession, 
    requireAdmin,
    cleanupSessions 
} from '../middleware/auth.js';

const router = Router();

// ============================================
// AUTHENTICATION ENDPOINTS (No auth required)
// ============================================

/**
 * POST /api/admin/login - Authenticate with API key
 */
router.post('/login', async (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        const session = await validateAdminKey(apiKey);

        if (!session) {
            // Add delay to prevent brute force
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.status(401).json({ error: 'Invalid API key' });
        }

        return res.json({
            success: true,
            token: session.token,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/admin/logout - End admin session
 */
router.post('/logout', requireAdmin, async (req, res) => {
    try {
        await invalidateSession(req.adminToken);
        return res.json({ success: true });
    } catch (error) {
        console.error('Admin logout error:', error);
        return res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * GET /api/admin/verify - Verify current session is valid
 */
router.get('/verify', requireAdmin, (req, res) => {
    return res.json({ valid: true });
});

// ============================================
// DASHBOARD ENDPOINTS (Auth required)
// ============================================

/**
 * GET /api/admin/stats - Dashboard summary statistics
 */
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        if (isPostgres()) {
            // Get multiple stats in parallel
            const [
                bookingsToday,
                pendingPayments,
                monthlyRevenue,
                newContacts,
                recentBookings,
                upcomingEvents
            ] = await Promise.all([
                // Today's confirmed bookings
                query(`
                    SELECT COUNT(*) as count FROM bookings 
                    WHERE event_date = CURRENT_DATE 
                    AND status IN ('confirmed', 'fulfilled')
                `),
                // Pending payment bookings
                query(`
                    SELECT COUNT(*) as count FROM bookings 
                    WHERE payment_status = 'unpaid' 
                    AND status = 'pending_payment'
                    AND created_at > NOW() - INTERVAL '7 days'
                `),
                // This month's revenue
                query(`
                    SELECT COALESCE(SUM(amount), 0) / 100.0 as revenue 
                    FROM payments 
                    WHERE status = 'succeeded' 
                    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
                `),
                // New contact inquiries
                query(`
                    SELECT COUNT(*) as count FROM contact_inquiries 
                    WHERE status = 'new'
                `),
                // Recent bookings (last 10)
                query(`
                    SELECT id, confirmation_number, contact_name, contact_email,
                           event_date, status, payment_status, total, package,
                           created_at
                    FROM bookings 
                    ORDER BY created_at DESC 
                    LIMIT 10
                `),
                // Upcoming events (next 7 days)
                query(`
                    SELECT id, confirmation_number, contact_name, contact_phone,
                           event_date, event_time, city, service_state, 
                           num_adults, num_children, package, status
                    FROM bookings 
                    WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                    AND status IN ('confirmed', 'fulfilled')
                    ORDER BY event_date, event_time
                `)
            ]);

            return res.json({
                summary: {
                    todaysEvents: parseInt(bookingsToday.rows[0].count),
                    pendingPayments: parseInt(pendingPayments.rows[0].count),
                    monthlyRevenue: parseFloat(monthlyRevenue.rows[0].revenue) || 0,
                    newContacts: parseInt(newContacts.rows[0].count)
                },
                recentBookings: recentBookings.rows,
                upcomingEvents: upcomingEvents.rows
            });
        } else {
            // In-memory fallback with basic stats
            const bookings = Array.from(getMemoryDb().bookings?.values() || []);
            const contacts = Array.from(getMemoryDb().contacts?.values() || []);
            
            return res.json({
                summary: {
                    todaysEvents: 0,
                    pendingPayments: bookings.filter(b => b.paymentStatus === 'unpaid').length,
                    monthlyRevenue: 0,
                    newContacts: contacts.filter(c => c.status === 'new').length
                },
                recentBookings: bookings.slice(-10).reverse(),
                upcomingEvents: []
            });
        }
    } catch (error) {
        console.error('Admin stats error:', error);
        return res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
});

// ============================================
// BOOKINGS MANAGEMENT (Auth required)
// ============================================

/**
 * GET /api/admin/bookings - List all bookings with filters
 */
router.get('/bookings', requireAdmin, async (req, res) => {
    try {
        const { 
            status, 
            paymentStatus, 
            dateFrom, 
            dateTo,
            search,
            limit = 50, 
            offset = 0 
        } = req.query;

        if (isPostgres()) {
            let sql = 'SELECT * FROM bookings WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (status) {
                sql += ` AND status = $${paramIndex++}`;
                params.push(status);
            }
            if (paymentStatus) {
                sql += ` AND payment_status = $${paramIndex++}`;
                params.push(paymentStatus);
            }
            if (dateFrom) {
                sql += ` AND event_date >= $${paramIndex++}`;
                params.push(dateFrom);
            }
            if (dateTo) {
                sql += ` AND event_date <= $${paramIndex++}`;
                params.push(dateTo);
            }
            if (search) {
                sql += ` AND (
                    confirmation_number ILIKE $${paramIndex} OR
                    contact_name ILIKE $${paramIndex} OR
                    contact_email ILIKE $${paramIndex}
                )`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            // Get total count
            const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
            const countResult = await query(countSql, params);
            const total = parseInt(countResult.rows[0].count);

            // Add pagination
            sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(parseInt(limit), parseInt(offset));

            const result = await query(sql, params);

            return res.json({
                bookings: result.rows,
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        } else {
            const bookings = Array.from(getMemoryDb().bookings?.values() || []);
            return res.json({
                bookings: bookings.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
                total: bookings.length
            });
        }
    } catch (error) {
        console.error('Admin bookings error:', error);
        return res.status(500).json({ error: 'Failed to list bookings' });
    }
});

/**
 * GET /api/admin/bookings/:id - Get booking details
 */
router.get('/bookings/:id', requireAdmin, async (req, res) => {
    try {
        if (isPostgres()) {
            // Get booking with payments
            const [bookingResult, paymentsResult] = await Promise.all([
                query('SELECT * FROM bookings WHERE id = $1', [req.params.id]),
                query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC', [req.params.id])
            ]);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            return res.json({
                booking: bookingResult.rows[0],
                payments: paymentsResult.rows
            });
        } else {
            const booking = getMemoryDb().bookings?.get(req.params.id);
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            return res.json({ booking, payments: [] });
        }
    } catch (error) {
        console.error('Admin get booking error:', error);
        return res.status(500).json({ error: 'Failed to get booking' });
    }
});

/**
 * PATCH /api/admin/bookings/:id - Update booking status
 */
router.patch('/bookings/:id', requireAdmin, async (req, res) => {
    try {
        const { status, paymentStatus, adminNotes } = req.body;
        const validStatuses = ['pending_payment', 'confirmed', 'fulfilled', 'cancelled'];
        const validPaymentStatuses = ['unpaid', 'deposit_paid', 'paid', 'refunded'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status', validStatuses });
        }
        if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status', validPaymentStatuses });
        }

        if (isPostgres()) {
            const updates = [];
            const params = [];
            let paramIndex = 1;

            if (status) {
                updates.push(`status = $${paramIndex++}`);
                params.push(status);
            }
            if (paymentStatus) {
                updates.push(`payment_status = $${paramIndex++}`);
                params.push(paymentStatus);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            params.push(req.params.id);
            const result = await query(
                `UPDATE bookings SET ${updates.join(', ')}, updated_at = NOW() 
                 WHERE id = $${paramIndex} RETURNING *`,
                params
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            return res.json(result.rows[0]);
        } else {
            const booking = getMemoryDb().bookings?.get(req.params.id);
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            if (status) booking.status = status;
            if (paymentStatus) booking.paymentStatus = paymentStatus;
            booking.updatedAt = new Date().toISOString();
            
            return res.json(booking);
        }
    } catch (error) {
        console.error('Admin update booking error:', error);
        return res.status(500).json({ error: 'Failed to update booking' });
    }
});

// ============================================
// PAYMENTS MANAGEMENT (Auth required)
// ============================================

/**
 * GET /api/admin/payments - List all payments
 */
router.get('/payments', requireAdmin, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        if (isPostgres()) {
            let sql = `
                SELECT p.*, b.confirmation_number, b.contact_name, b.contact_email
                FROM payments p
                LEFT JOIN bookings b ON p.booking_id = b.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (status) {
                sql += ` AND p.status = $${paramIndex++}`;
                params.push(status);
            }

            sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(parseInt(limit), parseInt(offset));

            const result = await query(sql, params);

            // Get total
            const countSql = status 
                ? 'SELECT COUNT(*) FROM payments WHERE status = $1'
                : 'SELECT COUNT(*) FROM payments';
            const countResult = await query(countSql, status ? [status] : []);

            return res.json({
                payments: result.rows,
                total: parseInt(countResult.rows[0].count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        } else {
            const payments = Array.from(getMemoryDb().payments?.values() || []);
            return res.json({
                payments,
                total: payments.length
            });
        }
    } catch (error) {
        console.error('Admin payments error:', error);
        return res.status(500).json({ error: 'Failed to list payments' });
    }
});

// ============================================
// CONTACTS MANAGEMENT (Auth required)
// ============================================

/**
 * GET /api/admin/contacts - List contact inquiries
 */
router.get('/contacts', requireAdmin, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        if (isPostgres()) {
            let sql = 'SELECT * FROM contact_inquiries WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (status) {
                sql += ` AND status = $${paramIndex++}`;
                params.push(status);
            }

            sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(parseInt(limit), parseInt(offset));

            const result = await query(sql, params);

            const countSql = status 
                ? 'SELECT COUNT(*) FROM contact_inquiries WHERE status = $1'
                : 'SELECT COUNT(*) FROM contact_inquiries';
            const countResult = await query(countSql, status ? [status] : []);

            return res.json({
                contacts: result.rows,
                total: parseInt(countResult.rows[0].count)
            });
        } else {
            const contacts = Array.from(getMemoryDb().contacts?.values() || []);
            return res.json({
                contacts,
                total: contacts.length
            });
        }
    } catch (error) {
        console.error('Admin contacts error:', error);
        return res.status(500).json({ error: 'Failed to list contacts' });
    }
});

// ============================================
// SYSTEM MAINTENANCE (Auth required)
// ============================================

/**
 * POST /api/admin/cleanup - Run cleanup tasks
 */
router.post('/cleanup', requireAdmin, async (req, res) => {
    try {
        await cleanupSessions();
        
        // Clean up old analytics events (older than 90 days)
        if (isPostgres()) {
            const result = await query(`
                DELETE FROM analytics_events 
                WHERE created_at < NOW() - INTERVAL '90 days'
            `);
            
            return res.json({
                success: true,
                cleanedAnalytics: result.rowCount
            });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Admin cleanup error:', error);
        return res.status(500).json({ error: 'Cleanup failed' });
    }
});

/**
 * POST /api/admin/migrate - Run database migrations
 */
router.post('/migrate', requireAdmin, async (req, res) => {
    try {
        if (!isPostgres()) {
            return res.json({ success: true, message: 'In-memory mode, no migration needed' });
        }

        const migrations = [];

        // Phase 2: Add cancellation columns
        try {
            await query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'bookings' AND column_name = 'cancelled_at'
                    ) THEN
                        ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMPTZ;
                    END IF;
                END $$;
            `);
            migrations.push('cancelled_at column');
        } catch (e) { console.log('cancelled_at already exists or error:', e.message); }

        try {
            await query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'bookings' AND column_name = 'cancellation_reason'
                    ) THEN
                        ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT;
                    END IF;
                END $$;
            `);
            migrations.push('cancellation_reason column');
        } catch (e) { console.log('cancellation_reason already exists or error:', e.message); }

        try {
            await query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'bookings' AND column_name = 'refund_amount'
                    ) THEN
                        ALTER TABLE bookings ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0;
                    END IF;
                END $$;
            `);
            migrations.push('refund_amount column');
        } catch (e) { console.log('refund_amount already exists or error:', e.message); }

        // Create index for cancelled bookings
        try {
            await query(`
                CREATE INDEX IF NOT EXISTS idx_bookings_cancelled 
                ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL
            `);
            migrations.push('idx_bookings_cancelled index');
        } catch (e) { console.log('Index creation skipped:', e.message); }

        return res.json({
            success: true,
            message: 'Migrations completed',
            migrations
        });
    } catch (error) {
        console.error('Migration error:', error);
        return res.status(500).json({ error: 'Migration failed: ' + error.message });
    }
});

export default router;
