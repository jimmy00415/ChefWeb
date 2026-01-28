/**
 * Database Connection Pool
 * Provides PostgreSQL connection with fallback to in-memory storage
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// In-memory fallback storage
const memoryDb = {
  bookings: new Map(),
  payments: new Map(),
  analytics: [],
  chats: []
};

let pool = null;
let usePostgres = false;

/**
 * Initialize database connection
 */
export async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('⚠️  DATABASE_URL not set - using in-memory storage');
    console.log('   Data will be lost on restart. Set DATABASE_URL for persistence.');
    return { usePostgres: false };
  }

  try {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    usePostgres = true;
    console.log('✅ PostgreSQL connected');
    return { usePostgres: true };
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.log('⚠️  Falling back to in-memory storage');
    return { usePostgres: false };
  }
}

/**
 * Execute a database query
 */
export async function query(text, params = []) {
  if (!usePostgres || !pool) {
    throw new Error('PostgreSQL not available');
  }
  const result = await pool.query(text, params);
  return result;
}

/**
 * Get a client for transactions
 */
export async function getClient() {
  if (!usePostgres || !pool) {
    throw new Error('PostgreSQL not available');
  }
  return pool.connect();
}

/**
 * Check if using PostgreSQL
 */
export function isPostgres() {
  return usePostgres;
}

/**
 * Get in-memory storage (for fallback)
 */
export function getMemoryDb() {
  return memoryDb;
}

/**
 * Close database connections
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Helper to generate IDs
export function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createConfirmationNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `CHEF-${y}-${seq}`;
}

export default { initDb, query, getClient, isPostgres, getMemoryDb, closeDb, createId, createConfirmationNumber };
