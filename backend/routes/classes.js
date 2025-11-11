const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/classes - Get all classes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows: classes } = await db.query(`
            SELECT c.*, co.course_name, u.name AS lecturer_name
            FROM classes c
            LEFT JOIN courses co ON c.course_id = co.id
            LEFT JOIN users u ON c.lecturer_id = u.id
            ORDER BY c.created_at DESC
        `);

        res.json({ success: true, classes });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/classes/my-classes - Get lecturer's classes
router.get('/my-classes', authenticateToken, async (req, res) => {
    try {
        const { rows: classes } = await db.query(
            'SELECT * FROM classes WHERE lecturer_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json({ success: true, classes });
    } catch (error) {
        console.error('Get my-classes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/classes - Create new class
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students } = req.body;

        if (!class_code || !class_name || !course_id || !semester || !academic_year) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const { rows: existingClasses } = await db.query(
            'SELECT id FROM classes WHERE class_code = $1',
            [class_code]
        );

        if (existingClasses.length > 0) {
            return res.status(400).json({ success: false, error: 'Class code already exists' });
        }

        const { rows: inserted } = await db.query(
            `INSERT INTO classes (class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students || 30]
        );

        res.json({ success: true, message: 'Class created successfully', classId: inserted[0].id });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
