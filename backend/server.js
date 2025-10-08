const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const classRoutes = require('./routes/classes');
const enrollmentRoutes = require('./routes/enrollment');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
app.use(cors({
    origin: [
        'https://luct-frontend.onrender.com',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollment', enrollmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'LUCT Reporting System API is running',
        timestamp: new Date().toISOString()
    });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const db = require('./config/database');
        const connection = await db.getConnection();
        const [tables] = await connection.execute('SHOW TABLES');
        await connection.release();
        
        res.json({ 
            success: true, 
            message: 'Database connection successful',
            tables: tables.length
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: err.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Available routes:');
    console.log('- /api/auth');
    console.log('- /api/reports'); 
    console.log('- /api/users');
    console.log('- /api/courses');
    console.log('- /api/classes');
    console.log('- /api/enrollment');
    console.log('- /api/health');
    console.log('- /api/test-db');
});