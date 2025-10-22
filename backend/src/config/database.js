import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hospital_billing',
  password: process.env.DB_PASSWORD || '12345',
  port: process.env.DB_PORT || 5433,
  // Add connection timeout and retry settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export const query = (text, params) => {
  console.log('📝 Executing query:', text.substring(0, 100) + '...');
  return pool.query(text, params);
};

export default pool;