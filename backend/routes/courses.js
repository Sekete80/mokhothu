const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/courses - Get all courses
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Getting all courses...');
        const [courses] = await db.execute('SELECT * FROM courses ORDER BY created_at DESC');
        console.log(`Found ${courses.length} courses`);
        
        res.json({ 
            success: true, 
            courses: courses 
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch courses: ' + error.message 
        });
    }
});

// POST /api/courses - Create new course
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('Creating course:', req.body);
        
        const { course_code, course_name, description, credits, faculty } = req.body;
        
        if (!course_code || !course_name || !faculty) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: course_code, course_name, faculty'
            });
        }
        
        // Check if course code already exists
        const [existingCourses] = await db.execute(
            'SELECT id FROM courses WHERE course_code = ?', 
            [course_code]
        );
        
        if (existingCourses.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Course code already exists'
            });
        }
        
        const [result] = await db.execute(
            `INSERT INTO courses (course_code, course_name, description, credits, faculty) 
             VALUES (?, ?, ?, ?, ?)`,
            [course_code, course_name, description || '', credits || 3, faculty]
        );
        
        console.log('Course created with ID:', result.insertId);
        
        res.json({ 
            success: true, 
            message: 'Course created successfully',
            courseId: result.insertId 
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create course: ' + error.message 
        });
    }
});

module.exports = router;