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
