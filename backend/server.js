const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route files
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const classRoutes = require('./routes/classes');
const enrollmentRoutes = require('./routes/enrollment');

const app = express();
const PORT = process.env.PORT || 10000;

// =====================
// 🌍 CORS CONFIGURATION
// =====================
app.use(cors({
    origin: [
        'https://mokhothu-fe.onrender.com', // Frontend on Render
        'https://mokhothu.onrender.com',     // Backend domain (for SSR or testing)
        'http://localhost:3000',             // Local dev (React)
        'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// =====================
// 🧩 MIDDLEWARE
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// 🧭 ROUTES
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollment', enrollmentRoutes);

// =====================
// 💓 HEALTH CHECK
// =====================
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'LUCT Reporting System API is running',
        timestamp: new Date().toISOString()
    });
});

// =====================
// 🧠 TEST DATABASE CONNECTION (PostgreSQL)
// =====================
app.get('/api/test-db', async (req, res) => {
    try {
        const db = require('./config/database');

        // Query public schema tables
        const result = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        const tables = result.rows.map(row => row.table_name);

        res.json({ 
            success: true, 
            message: 'Database connection successful',
            tables,
            total_tables: tables.length
        });
    } catch (err) {
        console.error('Database connection test failed:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: err.message 
        });
    }
});



// =====================
// ⚠️ ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// =====================
// 🚫 404 HANDLER
// =====================
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// =====================
// 🚀 START SERVER
// =====================
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('📡 Available routes:');
    console.log('- /api/auth');
    console.log('- /api/reports');
    console.log('- /api/users');
    console.log('- /api/courses');
    console.log('- /api/classes');
    console.log('- /api/enrollment');
    console.log('- /api/health');
    console.log('- /api/test-db');
});
