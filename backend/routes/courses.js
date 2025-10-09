const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// GET /api/courses - Get all courses
router.get('/', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
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

// PUT /api/courses/:id - Update course
router.put('/:id', auth, async (req, res) => {
    try {
        const { course_name, description, credits, faculty } = req.body;
        
        const [result] = await db.execute(
            'UPDATE courses SET course_name = ?, description = ?, credits = ?, faculty = ? WHERE id = ?',
            [course_name, description, credits, faculty, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Course updated successfully' 
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/courses/:id - Delete course
router.delete('/:id', auth, async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Course deleted successfully' 
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;