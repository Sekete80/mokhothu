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
    // Remove these invalid options:
    // reconnect: true,
    // acquireTimeout: 60000,
    // timeout: 60000,
    
    // Try different SSL approaches:
    ssl: process.env.NODE_ENV === 'production' ? 'Amazon RDS' : false
};

const pool = mysql.createPool(dbConfig);

// Test database connection with better error handling
const testConnection = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Connected to FreeSQLDatabase successfully');
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🏠 Host: ${dbConfig.host}`);
        
        // Test by querying some tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 Found ${tables.length} tables in database`);
        
        await connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Error code:', err.code);
        
        if (connection) {
            await connection.release();
        }
        
        // Try alternative connection without SSL
        await tryAlternativeConnection();
    }
};

// Alternative connection method
const tryAlternativeConnection = async () => {
    console.log('🔄 Trying alternative connection without SSL...');
    
    const altConfig = {
        host: process.env.DB_HOST || 'sql7.freesqldatabase.com',
        user: process.env.DB_USER || 'sql7801212',
        password: process.env.DB_PASSWORD || '273T7MScHs',
        database: process.env.DB_NAME || 'sql7801212',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 10000,
        ssl: false  // Disable SSL completely
    };
    
    try {
        const altPool = mysql.createPool(altConfig);
        const connection = await altPool.getConnection();
        console.log('✅ Connected to FreeSQLDatabase without SSL');
        console.log(`📊 Database: ${altConfig.database}`);
        
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 Found ${tables.length} tables in database`);
        
        await connection.release();
        await altPool.end();
        
        // Update the main pool to use this config
        Object.assign(dbConfig, altConfig);
        console.log('🔄 Updated database configuration to use no SSL');
        
    } catch (altErr) {
        console.error('❌ Alternative connection also failed:', altErr.message);
        console.error('💡 Please check:');
        console.error('   1. Database credentials are correct');
        console.error('   2. Database "sql7801212" exists in FreeSQLDatabase');
        console.error('   3. Your IP is allowed in FreeSQLDatabase (if required)');
        console.error('   4. FreeSQLDatabase server is operational');
    }
};

testConnection();

// Handle pool errors
pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection was closed.');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
        console.log('Database has too many connections.');
    } else if (err.code === 'ECONNREFUSED') {
        console.log('Database connection was refused.');
    }
});

module.exports = pool;