-- ChefWeb PostgreSQL Schema
-- Run with: psql -d chefweb -f schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
    
    -- Event details
    service_state VARCHAR(5) NOT NULL,
    city VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    venue_type VARCHAR(50),
    venue_address TEXT,
    
    -- Guest details
    num_adults INTEGER NOT NULL DEFAULT 0,
    num_children INTEGER NOT NULL DEFAULT 0,
    package VARCHAR(20) NOT NULL DEFAULT 'signature',
    dietary_notes TEXT,
    special_requests TEXT,
    
    -- Contact info
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    
    -- Pricing
    base_amount DECIMAL(10,2) DEFAULT 0,
    addons_total DECIMAL(10,2) DEFAULT 0,
    travel_fee DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    
    -- Payment option
    payment_option VARCHAR(20) DEFAULT 'later',
    
    -- Metadata
    agree_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id VARCHAR(100) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(30) NOT NULL DEFAULT 'requires_payment',
    payment_type VARCHAR(20), -- full, deposit
    stripe_customer_id VARCHAR(100),
    refund_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    video_id VARCHAR(100),
    page VARCHAR(255),
    user_agent TEXT,
    ip_address VARCHAR(45),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat history table (for AI chatbot context)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL, -- user, assistant
    message TEXT NOT NULL,
    intent VARCHAR(50),
    confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(contact_email);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation ON bookings(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_intent ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ANALYTICS VIEWS FOR BUSINESS INTELLIGENCE
-- ============================================

-- Daily Revenue Dashboard
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

-- Customer Lifetime Value Analysis
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
    MAX(b.num_adults + b.num_children) as max_party_size
FROM bookings b
WHERE b.payment_status IN ('paid', 'deposit_paid')
GROUP BY b.contact_email, b.contact_name
ORDER BY lifetime_value DESC;

-- Package Performance Analysis
CREATE OR REPLACE VIEW v_package_performance AS
SELECT 
    b.package,
    COUNT(*) as bookings_count,
    SUM(b.total) as total_revenue,
    AVG(b.total) as avg_revenue,
    AVG(b.num_adults) as avg_adults,
    AVG(b.num_children) as avg_children,
    ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) as percentage_share
FROM bookings b
WHERE b.payment_status IN ('paid', 'deposit_paid')
GROUP BY b.package
ORDER BY total_revenue DESC;

-- Geographic Demand Analysis
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

-- Payment Reconciliation Report
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
        WHEN p.status = 'succeeded' AND b.payment_status != 'paid' THEN 'SYNC_NEEDED'
        WHEN p.status = 'failed' AND b.status = 'confirmed' THEN 'CRITICAL'
        WHEN p.booking_id IS NULL THEN 'ORPHANED'
        ELSE 'OK'
    END as reconciliation_status
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.id
ORDER BY p.created_at DESC;

-- Booking Funnel Analysis
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

-- ============================================
-- BILLING MANAGEMENT PROCEDURE
-- ============================================

-- Sync Payment Status to Bookings (run daily)
CREATE OR REPLACE PROCEDURE sync_payment_status()
LANGUAGE plpgsql
AS $$
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
    
    -- Sync refunded payments
    UPDATE bookings b
    SET 
        payment_status = 'refunded',
        updated_at = NOW()
    FROM payments p
    WHERE p.booking_id = b.id
    AND p.status = 'refunded'
    AND b.payment_status != 'refunded';
END;
$$;

-- ============================================
-- CONTACT INQUIRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contact_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    reason VARCHAR(50),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',  -- new, in_progress, replied, closed
    admin_notes TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_inquiries(created_at);

DROP TRIGGER IF EXISTS update_contact_inquiries_updated_at ON contact_inquiries;
CREATE TRIGGER update_contact_inquiries_updated_at
    BEFORE UPDATE ON contact_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADMIN SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_expires ON admin_sessions(expires_at);
