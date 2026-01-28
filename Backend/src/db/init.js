/**
 * Database Initialization Script
 * Run with: npm run db:init
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('\nExample: DATABASE_URL=postgresql://user:pass@localhost:5432/chefweb');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    console.log('📄 Reading schema file...');
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    console.log('🏗️  Creating tables...');
    await client.query(schema);
    
    console.log('✅ Database initialized successfully!');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables created:');
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
