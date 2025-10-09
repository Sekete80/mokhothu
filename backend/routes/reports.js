const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// GET /api/reports - Get all reports
router.get('/', auth, async (req, res) => {
    try {
        console.log('Getting all reports...');
        const [reports] = await db.execute(`
            SELECT r.*, u.name as user_name 
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `);
        console.log(`Found ${reports.length} reports`);
        
        res.json({ 
            success: true, 
            reports: reports 
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch reports: ' + error.message 
        });
    }
});

// GET /api/reports/my-reports - Get user's reports
router.get('/my-reports', auth, async (req, res) => {
    try {
        console.log('Getting my reports for user:', req.user.id);
        const [reports] = await db.execute(
            'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC', 
            [req.user.id]
        );
        console.log(`Found ${reports.length} reports for user`);
        
        res.json({ 
            success: true, 
            reports: reports 
        });
    } catch (error) {
        console.error('Get my-reports error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch your reports: ' + error.message 
        });
    }
});

// POST /api/reports - Create new report
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating report for user:', req.user.id);
        console.log('Report data:', req.body);
        
        const { faculty_name, class_name, lecture_date, topic_covered } = req.body;
        
        if (!faculty_name || !class_name || !lecture_date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: faculty_name, class_name, lecture_date'
            });
        }
        
        const [result] = await db.execute(
            `INSERT INTO reports (user_id, faculty_name, class_name, lecture_date, topic_covered, status) 
             VALUES (?, ?, ?, ?, ?, 'draft')`,
            [req.user.id, faculty_name, class_name, lecture_date, topic_covered || '']
        );
        
        console.log('Report created with ID:', result.insertId);
        
        res.json({ 
            success: true, 
            message: 'Report created successfully',
            reportId: result.insertId 
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create report: ' + error.message 
        });
    }
});

module.exports = router;