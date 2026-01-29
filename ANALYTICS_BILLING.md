# ChefWeb Business Analytics & Billing Guide

## Based on ERD Schema Analysis

---

## Part 1: Consumer Analytics Strategy

### 1.1 Key Business Metrics (KPIs)

| Metric | SQL Query | Business Value |
|--------|-----------|----------------|
| **Revenue** | Sum of succeeded payments | Cash flow tracking |
| **Conversion Rate** | Confirmed / Total bookings | Booking funnel health |
| **Average Order Value** | Avg total per booking | Pricing optimization |
| **Customer Lifetime Value** | Revenue per unique email | VIP identification |
| **Package Popularity** | Count by package type | Menu optimization |

### 1.2 Essential Analytics Views

Add these views to your database for real-time dashboards:

```sql
-- ============================================
-- VIEW: Daily Revenue Dashboard
-- ============================================
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT 
    DATE(p.created_at) as date,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END) / 100.0 as revenue_usd,
    SUM(CASE WHEN p.status = 'refunded' THEN p.amount ELSE 0 END) / 100.0 as refunds_usd,
    SUM(CASE WHEN p.status = 'failed' THEN 1 ELSE 0 END) as failed_count
FROM payments p
GROUP BY DATE(p.created_at)
ORDER BY date DESC;

-- ============================================
-- VIEW: Customer Insights (CLV Analysis)
-- ============================================
CREATE OR REPLACE VIEW v_customer_insights AS
SELECT 
    b.contact_email,
    b.contact_name,
    COUNT(*) as total_bookings,
    SUM(CASE WHEN b.status = 'confirmed' OR b.status = 'fulfilled' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(b.total) as lifetime_value,
    AVG(b.total) as avg_order_value,
    MIN(b.event_date) as first_booking,
    MAX(b.event_date) as last_booking,
    MAX(b.num_adults + b.num_children) as max_party_size,
    MODE() WITHIN GROUP (ORDER BY b.package) as preferred_package
FROM bookings b
WHERE b.payment_status IN ('paid', 'deposit_paid')
GROUP BY b.contact_email, b.contact_name
ORDER BY lifetime_value DESC;

-- ============================================
-- VIEW: Package Performance Analysis
-- ============================================
CREATE OR REPLACE VIEW v_package_performance AS
SELECT 
    b.package,
    COUNT(*) as bookings_count,
    SUM(b.total) as total_revenue,
    AVG(b.total) as avg_revenue,
    AVG(b.num_adults) as avg_adults,
    AVG(b.num_children) as avg_children,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage_share
FROM bookings b
WHERE b.payment_status IN ('paid', 'deposit_paid')
GROUP BY b.package
ORDER BY total_revenue DESC;

-- ============================================
-- VIEW: Geographic Demand Heatmap
-- ============================================
CREATE OR REPLACE VIEW v_geographic_demand AS
SELECT 
    b.service_state,
    b.city,
    COUNT(*) as booking_count,
    SUM(b.total) as revenue,
    AVG(b.travel_fee) as avg_travel_fee,
    COUNT(DISTINCT b.contact_email) as unique_customers
FROM bookings b
WHERE b.status != 'cancelled'
GROUP BY b.service_state, b.city
ORDER BY revenue DESC;

-- ============================================
-- VIEW: Booking Funnel Analysis
-- ============================================
CREATE OR REPLACE VIEW v_booking_funnel AS
SELECT 
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as total_started,
    SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
    SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
    ROUND(
        SUM(CASE WHEN status IN ('confirmed', 'fulfilled') THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as conversion_rate
FROM bookings
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;
```

### 1.3 Real-Time Analytics Queries

**Top 10 VIP Customers (for loyalty program):**
```sql
SELECT * FROM v_customer_insights 
WHERE total_bookings >= 2 
ORDER BY lifetime_value DESC 
LIMIT 10;
```

**This Month's Revenue:**
```sql
SELECT SUM(revenue_usd) as mtd_revenue, SUM(transaction_count) as transactions
FROM v_daily_revenue 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
```

**Underperforming Cities (marketing target):**
```sql
SELECT city, service_state, booking_count 
FROM v_geographic_demand 
WHERE booking_count < 5
ORDER BY booking_count ASC;
```

---

## Part 2: Billing Management System

### 2.1 Payment Reconciliation View

```sql
-- ============================================
-- VIEW: Payment Reconciliation Report
-- ============================================
CREATE OR REPLACE VIEW v_payment_reconciliation AS
SELECT 
    p.payment_intent_id,
    p.status as payment_status,
    p.amount / 100.0 as amount_usd,
    p.payment_type,
    b.confirmation_number,
    b.contact_email,
    b.contact_name,
    b.total as booking_total,
    b.status as booking_status,
    b.payment_status as booking_payment_status,
    p.created_at as payment_date,
    b.event_date,
    CASE 
        WHEN p.status = 'succeeded' AND b.payment_status != 'paid' THEN '⚠️ SYNC NEEDED'
        WHEN p.status = 'failed' AND b.status = 'confirmed' THEN '🔴 CRITICAL'
        WHEN p.booking_id IS NULL THEN '❓ ORPHANED'
        ELSE '✅ OK'
    END as reconciliation_status
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.id
ORDER BY p.created_at DESC;
```

### 2.2 Critical Billing Alerts

```sql
-- ============================================
-- FUNCTION: Get Billing Alerts
-- ============================================
CREATE OR REPLACE FUNCTION get_billing_alerts()
RETURNS TABLE (
    alert_type VARCHAR,
    severity VARCHAR,
    count BIGINT,
    details TEXT
) AS $$
BEGIN
    -- Failed payments in last 24h
    RETURN QUERY
    SELECT 
        'Failed Payments'::VARCHAR,
        'HIGH'::VARCHAR,
        COUNT(*)::BIGINT,
        STRING_AGG(payment_intent_id, ', ')::TEXT
    FROM payments 
    WHERE status = 'failed' 
    AND created_at > NOW() - INTERVAL '24 hours';
    
    -- Orphaned payments (no booking linked)
    RETURN QUERY
    SELECT 
        'Orphaned Payments'::VARCHAR,
        'MEDIUM'::VARCHAR,
        COUNT(*)::BIGINT,
        STRING_AGG(payment_intent_id, ', ')::TEXT
    FROM payments 
    WHERE booking_id IS NULL 
    AND status = 'succeeded';
    
    -- Bookings confirmed but payment failed
    RETURN QUERY
    SELECT 
        'Payment Mismatch'::VARCHAR,
        'CRITICAL'::VARCHAR,
        COUNT(*)::BIGINT,
        STRING_AGG(b.confirmation_number, ', ')::TEXT
    FROM bookings b
    JOIN payments p ON p.booking_id = b.id
    WHERE b.status = 'confirmed' 
    AND p.status = 'failed';
    
    -- Pending payments older than 1 hour
    RETURN QUERY
    SELECT 
        'Stale Pending'::VARCHAR,
        'LOW'::VARCHAR,
        COUNT(*)::BIGINT,
        STRING_AGG(payment_intent_id, ', ')::TEXT
    FROM payments 
    WHERE status = 'requires_payment' 
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_billing_alerts();
```

### 2.3 Automated Billing Sync Procedure

```sql
-- ============================================
-- PROCEDURE: Sync Payment Status to Bookings
-- Run daily or after webhook issues
-- ============================================
CREATE OR REPLACE PROCEDURE sync_payment_status()
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Sync succeeded payments → confirmed bookings
    UPDATE bookings b
    SET 
        payment_status = 'paid',
        status = CASE 
            WHEN status = 'pending_payment' THEN 'confirmed'
            ELSE status
        END,
        updated_at = NOW()
    FROM payments p
    WHERE p.booking_id = b.id
    AND p.status = 'succeeded'
    AND b.payment_status != 'paid';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Synced % bookings to paid status', updated_count;
    
    -- Sync refunded payments
    UPDATE bookings b
    SET 
        payment_status = 'refunded',
        updated_at = NOW()
    FROM payments p
    WHERE p.booking_id = b.id
    AND p.status = 'refunded'
    AND b.payment_status != 'refunded';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Synced % bookings to refunded status', updated_count;
END;
$$;

-- Usage: CALL sync_payment_status();
```

---

## Part 3: Recommended Dashboard Structure

### 3.1 Executive Dashboard (Daily Review)

| Widget | Data Source | Refresh |
|--------|-------------|---------|
| **Today's Revenue** | `v_daily_revenue WHERE date = CURRENT_DATE` | 5 min |
| **Pending Payments** | `payments WHERE status = 'requires_payment'` | Real-time |
| **Billing Alerts** | `get_billing_alerts()` | 15 min |
| **Week-over-Week Growth** | `v_daily_revenue` comparison | Daily |

### 3.2 Operations Dashboard

| Widget | Data Source | Purpose |
|--------|-------------|---------|
| **Upcoming Events** | `bookings WHERE event_date >= CURRENT_DATE` | Scheduling |
| **Unconfirmed Bookings** | `bookings WHERE status = 'pending_payment'` | Follow-up |
| **Customer Lookup** | `v_customer_insights` | Support |
| **Payment Reconciliation** | `v_payment_reconciliation` | Finance |

### 3.3 Marketing Dashboard

| Widget | Data Source | Purpose |
|--------|-------------|---------|
| **Package Mix** | `v_package_performance` | Pricing strategy |
| **Geographic Heatmap** | `v_geographic_demand` | Market expansion |
| **Conversion Funnel** | `v_booking_funnel` | Drop-off analysis |
| **VIP List** | `v_customer_insights WHERE total_bookings > 1` | Loyalty program |

---

## Part 4: Implementation Checklist

### Immediate Actions (Week 1)

- [ ] Add analytics views to `schema.sql`
- [ ] Create `/api/analytics/dashboard` endpoint
- [ ] Set up daily billing reconciliation cron job
- [ ] Configure Stripe webhook retry alerts

### Short-term (Month 1)

- [ ] Build admin dashboard UI
- [ ] Implement email alerts for billing issues
- [ ] Add customer segmentation (VIP, Regular, New)
- [ ] Create monthly revenue reports

### Long-term (Quarter 1)

- [ ] Predictive analytics (demand forecasting)
- [ ] A/B testing for package pricing
- [ ] Customer churn prediction
- [ ] Automated marketing based on analytics

---

## Part 5: API Endpoints for Analytics

Add these to your backend:

```javascript
// Backend/src/routes/analytics.js - Add these endpoints

// GET /api/analytics/dashboard - Executive summary
router.get('/dashboard', async (req, res) => {
  const today = await query(`
    SELECT * FROM v_daily_revenue WHERE date = CURRENT_DATE
  `);
  
  const alerts = await query(`SELECT * FROM get_billing_alerts()`);
  
  const pending = await query(`
    SELECT COUNT(*) as count, SUM(amount)/100.0 as amount
    FROM payments WHERE status = 'requires_payment'
  `);
  
  res.json({
    todayRevenue: today.rows[0]?.revenue_usd || 0,
    pendingPayments: pending.rows[0],
    alerts: alerts.rows
  });
});

// GET /api/analytics/customers - Customer insights
router.get('/customers', async (req, res) => {
  const customers = await query(`
    SELECT * FROM v_customer_insights LIMIT 100
  `);
  res.json(customers.rows);
});

// GET /api/analytics/reconciliation - Payment reconciliation
router.get('/reconciliation', async (req, res) => {
  const data = await query(`
    SELECT * FROM v_payment_reconciliation 
    WHERE reconciliation_status != '✅ OK'
  `);
  res.json(data.rows);
});

// POST /api/analytics/sync-payments - Manual sync trigger
router.post('/sync-payments', async (req, res) => {
  await query(`CALL sync_payment_status()`);
  res.json({ success: true, message: 'Payment status synced' });
});
```

---

## Part 6: Key SQL Queries for Daily Operations

### Morning Checklist Query
```sql
-- Run this every morning
SELECT 
    (SELECT COUNT(*) FROM bookings WHERE event_date = CURRENT_DATE) as events_today,
    (SELECT COUNT(*) FROM bookings WHERE status = 'pending_payment' AND created_at < NOW() - INTERVAL '24 hours') as stale_bookings,
    (SELECT COUNT(*) FROM payments WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours') as failed_payments_24h,
    (SELECT SUM(amount)/100.0 FROM payments WHERE status = 'succeeded' AND DATE(created_at) = CURRENT_DATE - 1) as yesterday_revenue;
```

### End of Day Reconciliation
```sql
-- Run this every evening
SELECT 
    p.payment_intent_id,
    p.amount/100.0 as amount,
    b.confirmation_number,
    p.status as stripe_status,
    b.payment_status as db_status,
    CASE WHEN p.status = 'succeeded' AND b.payment_status != 'paid' THEN 'MISMATCH' ELSE 'OK' END as check
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.id
WHERE DATE(p.created_at) = CURRENT_DATE
ORDER BY p.created_at;
```

### Monthly Revenue Report
```sql
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    SUM(revenue_usd) as revenue,
    SUM(refunds_usd) as refunds,
    SUM(revenue_usd) - SUM(refunds_usd) as net_revenue,
    SUM(transaction_count) as transactions
FROM v_daily_revenue
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;
```

---

## Summary: Most Efficient Approach

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 **Critical** | Implement `v_payment_reconciliation` view | Catch payment mismatches |
| 🔴 **Critical** | Run `sync_payment_status()` daily | Ensure DB consistency |
| 🟠 **High** | Build `get_billing_alerts()` function | Proactive issue detection |
| 🟠 **High** | Create `v_customer_insights` view | Identify VIP customers |
| 🟡 **Medium** | Add `/api/analytics/dashboard` | Real-time visibility |
| 🟡 **Medium** | Implement geographic analysis | Market expansion |
| 🟢 **Low** | Predictive analytics | Future optimization |

---

*Document created: January 29, 2026*
