const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET all reports
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows: reports } = await db.query(`
            SELECT r.*, u.name AS user_name
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, reports });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET my reports
router.get('/my-reports', authenticateToken, async (req, res) => {
    try {
        const { rows: reports } = await db.query(
            'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, reports });
    } catch (error) {
        console.error('Get my-reports error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create report
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { faculty_name, class_name, lecture_date, topic_covered } = req.body;

        if (!faculty_name || !class_name || !lecture_date) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const { rows: inserted } = await db.query(
            `INSERT INTO reports (user_id, faculty_name, class_name, lecture_date, topic_covered, status)
             VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING id`,
            [req.user.id, faculty_name, class_name, lecture_date, topic_covered || '']
        );

        res.json({ success: true, message: 'Report created', reportId: inserted[0].id });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
