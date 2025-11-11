// backend/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required by Render
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Render PostgreSQL successfully');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`📋 Found ${res.rows.length} tables in database`);

    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
};

testConnection();

module.exports = pool;
