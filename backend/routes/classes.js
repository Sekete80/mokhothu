const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// GET /api/classes - Get all classes
router.get('/', auth, async (req, res) => {
    try {
        console.log('Getting all classes...');
        const [classes] = await db.execute(`
            SELECT c.*, co.course_name, u.name as lecturer_name 
            FROM classes c 
            LEFT JOIN courses co ON c.course_id = co.id 
            LEFT JOIN users u ON c.lecturer_id = u.id 
            ORDER BY c.created_at DESC
        `);
        console.log(`Found ${classes.length} classes`);
        
        res.json({ 
            success: true, 
            classes: classes 
        });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch classes: ' + error.message 
        });
    }
});

// GET /api/classes/my-classes - Get lecturer's classes
router.get('/my-classes', auth, async (req, res) => {
    try {
        console.log('Getting my classes for user:', req.user.id);
        const [classes] = await db.execute(
            'SELECT * FROM classes WHERE lecturer_id = ? ORDER BY created_at DESC', 
            [req.user.id]
        );
        console.log(`Found ${classes.length} classes for lecturer`);
        
        res.json({ 
            success: true, 
            classes: classes 
        });
    } catch (error) {
        console.error('Get my-classes error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch your classes: ' + error.message 
        });
    }
});

// POST /api/classes - Create new class
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating class:', req.body);
        
        const { class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students } = req.body;
        
        if (!class_code || !class_name || !course_id || !semester || !academic_year) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        // Check if class code already exists
        const [existingClasses] = await db.execute(
            'SELECT id FROM classes WHERE class_code = ?', 
            [class_code]
        );
        
        if (existingClasses.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Class code already exists'
            });
        }
        
        const [result] = await db.execute(
            `INSERT INTO classes (class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students || 30]
        );
        
        console.log('Class created with ID:', result.insertId);
        
        res.json({ 
            success: true, 
            message: 'Class created successfully',
            classId: result.insertId 
        });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create class: ' + error.message 
        });
    }
});

module.exports = router;