const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/courses - Get all courses
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows: courses } = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
        res.json({ success: true, courses });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/courses - Create new course
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { course_code, course_name, description, credits, faculty } = req.body;

        if (!course_code || !course_name || !faculty) {
            return res.status(400).json({ success: false, error: 'Missing required fields: course_code, course_name, faculty' });
        }

        const { rows: existingCourses } = await db.query(
            'SELECT id FROM courses WHERE course_code = $1',
            [course_code]
        );

        if (existingCourses.length > 0) {
            return res.status(400).json({ success: false, error: 'Course code already exists' });
        }

        const { rows: inserted } = await db.query(
            `INSERT INTO courses (course_code, course_name, description, credits, faculty)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [course_code, course_name, description || '', credits || 3, faculty]
        );

        res.json({ success: true, message: 'Course created successfully', courseId: inserted[0].id });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
