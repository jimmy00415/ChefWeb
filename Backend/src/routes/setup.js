import { Router } from 'express';
import { query, isPostgres } from '../db/index.js';

const router = Router();

// One-time schema initialization endpoint
// POST /api/setup/init-db?secret=your_secret
router.post('/init-db', async (req, res) => {
  const secret = req.query.secret || req.body.secret;
  const expectedSecret = process.env.SETUP_SECRET || 'chefweb-init-2026';
  
  if (secret !== expectedSecret) {
    return res.status(403).json({ error: 'Invalid secret' });
  }
  
  if (!isPostgres()) {
    return res.status(400).json({ error: 'PostgreSQL not connected' });
  }
  
  try {
    // Create tables
    await query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Bookings table
      CREATE TABLE IF NOT EXISTS bookings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          confirmation_number VARCHAR(20) UNIQUE NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
          payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
          service_state VARCHAR(5) NOT NULL,
          city VARCHAR(100) NOT NULL,
          event_date DATE NOT NULL,
          event_time TIME NOT NULL,
          venue_type VARCHAR(50),
          venue_address TEXT,
          num_adults INTEGER NOT NULL DEFAULT 0,
          num_children INTEGER NOT NULL DEFAULT 0,
          package VARCHAR(20) NOT NULL DEFAULT 'signature',
          dietary_notes TEXT,
          special_requests TEXT,
          contact_name VARCHAR(100) NOT NULL,
          contact_email VARCHAR(255) NOT NULL,
          contact_phone VARCHAR(30) NOT NULL,
          base_amount DECIMAL(10,2) DEFAULT 0,
          addons_total DECIMAL(10,2) DEFAULT 0,
          travel_fee DECIMAL(10,2) DEFAULT 0,
          subtotal DECIMAL(10,2) DEFAULT 0,
          total DECIMAL(10,2) DEFAULT 0,
          payment_option VARCHAR(20) DEFAULT 'later',
          agree_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    await query(`
      -- Payments table
      CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          payment_intent_id VARCHAR(100) UNIQUE NOT NULL,
          booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
          amount INTEGER NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'usd',
          status VARCHAR(30) NOT NULL DEFAULT 'requires_payment',
          payment_type VARCHAR(20),
          stripe_customer_id VARCHAR(100),
          refund_id VARCHAR(100),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    await query(`
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
    `);
    
    await query(`
      -- Chat messages table
      CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id VARCHAR(100) NOT NULL,
          role VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          intent VARCHAR(50),
          confidence DECIMAL(3,2),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(contact_email);
      CREATE INDEX IF NOT EXISTS idx_bookings_confirmation ON bookings(confirmation_number);
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);
      CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
    `);
    
    // Verify tables
    const result = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    return res.json({ 
      success: true, 
      message: 'Database initialized',
      tables: result.rows.map(r => r.table_name)
    });
  } catch (error) {
    console.error('Schema init error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Check database status
router.get('/status', async (req, res) => {
  return res.json({
    postgres: isPostgres(),
    timestamp: new Date().toISOString()
  });
});

export default router;
