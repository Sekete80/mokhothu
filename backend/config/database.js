const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'sql7.freesqldatabase.com',
    user: process.env.DB_USER || 'sql7801212',
    password: process.env.DB_PASSWORD || '273T7MScHs',
    database: process.env.DB_NAME || 'sql7801212',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    ssl: false  // DISABLE SSL for FreeSQLDatabase
};

const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to FreeSQLDatabase successfully');
        
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 Found ${tables.length} tables in database`);
        
        await connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Error code:', err.code);
    }
};

testConnection();

module.exports = pool;