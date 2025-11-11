const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Get available students
router.get('/available-students', async (req, res) => {
    try {
        const { rows: students } = await db.query(
            'SELECT id, name, email FROM users WHERE role = $1 ORDER BY name',
            ['student']
        );
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Fetch students error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Enroll a student
router.post('/enroll', async (req, res) => {
    try {
        const { student_id, class_id } = req.body;

        if (!student_id || !class_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields: student_id and class_id' });
        }

        if (!['program_leader', 'principal_lecturer'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { rows: students } = await db.query(
            'SELECT id, name FROM users WHERE id = $1 AND role = $2',
            [student_id, 'student']
        );
        if (students.length === 0) return res.status(400).json({ success: false, message: 'Student not found' });

        const { rows: classes } = await db.query(
            `SELECT cl.*, 
                    (SELECT COUNT(*) FROM enrollments WHERE class_id = cl.id) AS current_enrollments
             FROM classes cl WHERE cl.id = $1`,
            [class_id]
        );

        if (classes.length === 0) return res.status(400).json({ success: false, message: 'Class not found' });

        const classInfo = classes[0];
        if (classInfo.current_enrollments >= classInfo.max_students) {
            return res.status(400).json({ success: false, message: 'Class is full' });
        }

        const { rows: existing } = await db.query(
            'SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2',
            [student_id, class_id]
        );
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'Student already enrolled' });

        const { rows: inserted } = await db.query(
            'INSERT INTO enrollments (student_id, class_id) VALUES ($1, $2) RETURNING id',
            [student_id, class_id]
        );

        res.json({ success: true, message: 'Enrollment successful', enrollment_id: inserted[0].id });

    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
