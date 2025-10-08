const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Enrollment API is working!' });
});

// Get courses for enrollment
router.get('/courses', async (req, res) => {
    try {
        console.log('Fetching courses...');
        const [courses] = await db.execute('SELECT * FROM courses');
        console.log(`Found ${courses.length} courses`);
        
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses' });
    }
});

// Get classes for enrollment - FIXED WITH PROPER DATA
router.get('/classes', async (req, res) => {
    try {
        console.log('Fetching classes with enrollment data...');
        const [classes] = await db.execute(`
            SELECT 
                cl.*, 
                c.course_code, 
                c.course_name,
                u.name as lecturer_name,
                (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = cl.id) as enrolled_count
            FROM classes cl
            LEFT JOIN courses c ON cl.course_id = c.id
            LEFT JOIN users u ON cl.lecturer_id = u.id
            ORDER BY cl.class_name
        `);
        console.log(`Found ${classes.length} classes`);
        
        res.json({ success: true, data: classes });
    } catch (error) {
        console.error('Fetch classes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch classes' });
    }
});

// Enroll a student - IMPROVED WITH BETTER VALIDATION
router.post('/enroll', async (req, res) => {
    try {
        console.log('=== ENROLLMENT REQUEST START ===');
        console.log('Request body:', req.body);
        console.log('User making request:', req.user);
        
        const { student_id, class_id } = req.body;
        
        // Validate required fields
        if (!student_id || !class_id) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: student_id and class_id' 
            });
        }

        // Check user permissions
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only program leaders and principal lecturers can enroll students.'
            });
        }

        console.log('Step 1: Validating student...');
        // Check if student exists
        const [students] = await db.execute(
            'SELECT id, name, email FROM users WHERE id = ? AND role = "student"', 
            [student_id]
        );
        console.log('Student validation result:', students);
        if (students.length === 0) {
            console.log('❌ Student not found');
            return res.status(400).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }
        console.log('✅ Student validated:', students[0].name);

        console.log('Step 2: Validating class and checking capacity...');
        // Check if class exists and has capacity
        const [classes] = await db.execute(`
            SELECT cl.*, 
                   c.course_name,
                   (SELECT COUNT(*) FROM enrollments WHERE class_id = cl.id) as current_enrollments
            FROM classes cl
            LEFT JOIN courses c ON cl.course_id = c.id
            WHERE cl.id = ?
        `, [class_id]);
        
        console.log('Class validation result:', classes);
        if (classes.length === 0) {
            console.log('❌ Class not found');
            return res.status(400).json({ 
                success: false, 
                message: 'Class not found' 
            });
        }

        const classInfo = classes[0];
        console.log('✅ Class validated:', classInfo.class_name);
        console.log(`Current enrollments: ${classInfo.current_enrollments}, Max: ${classInfo.max_students}`);

        // Check capacity
        if (classInfo.current_enrollments >= classInfo.max_students) {
            console.log('❌ Class at full capacity');
            return res.status(400).json({
                success: false,
                message: `Class "${classInfo.class_name}" has reached maximum capacity (${classInfo.max_students} students)`
            });
        }

        console.log('Step 3: Checking for existing enrollment...');
        // Check if enrollment already exists
        const [existing] = await db.execute(
            'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?',
            [student_id, class_id]
        );
        console.log('Existing enrollment check result:', existing);
        
        if (existing.length > 0) {
            console.log('❌ Enrollment already exists');
            return res.status(400).json({ 
                success: false, 
                message: 'Student is already enrolled in this class' 
            });
        }
        console.log('✅ No existing enrollment found');

        console.log('Step 4: Creating new enrollment...');
        // Create enrollment
        const [result] = await db.execute(
            'INSERT INTO enrollments (student_id, class_id) VALUES (?, ?)',
            [student_id, class_id]
        );
        console.log('✅ Insert result:', result);

        console.log('✅ Enrollment created successfully, ID:', result.insertId);
        console.log('=== ENROLLMENT REQUEST COMPLETED SUCCESSFULLY ===');
        
        res.json({ 
            success: true, 
            message: `Student enrolled successfully in ${classInfo.class_name}!`,
            enrollment_id: result.insertId,
            class_name: classInfo.class_name,
            course_name: classInfo.course_name
        });
        
    } catch (error) {
        console.error('❌ ENROLLMENT ERROR:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            success: false, 
            message: 'Enrollment failed: ' + error.message 
        });
    }
});

// Get all enrollments - ENHANCED WITH BETTER DATA
router.get('/enrollments', async (req, res) => {
    try {
        console.log('Fetching enriched enrollments...');
        
        const [enrollments] = await db.execute(`
            SELECT 
                e.*,
                u.name as student_name,
                u.email as student_email,
                cl.class_code,
                cl.class_name,
                c.course_code,
                c.course_name,
                lect.name as lecturer_name
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN classes cl ON e.class_id = cl.id
            LEFT JOIN courses c ON cl.course_id = c.id
            LEFT JOIN users lect ON cl.lecturer_id = lect.id
            ORDER BY e.enrolled_at DESC
        `);
        
        console.log(`Found ${enrollments.length} enrollments`);

        const enrichedEnrollments = enrollments.map(enrollment => ({
            id: enrollment.id,
            student_id: enrollment.student_id,
            class_id: enrollment.class_id,
            student_name: enrollment.student_name,
            student_email: enrollment.student_email,
            class_name: enrollment.class_name,
            class_code: enrollment.class_code,
            course_name: enrollment.course_name,
            course_code: enrollment.course_code,
            lecturer_name: enrollment.lecturer_name,
            enrollment_date: enrollment.enrolled_at,
            status: 'active'
        }));

        console.log('✅ Returning', enrichedEnrollments.length, 'enriched enrollments');
        res.json({ success: true, data: enrichedEnrollments });
    } catch (error) {
        console.error('Fetch enrollments error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch enrollments: ' + error.message 
        });
    }
});

// Get available students for enrollment
router.get('/available-students', async (req, res) => {
    try {
        console.log('Fetching available students...');
        const [students] = await db.execute(
            'SELECT id, name, email FROM users WHERE role = "student" ORDER BY name'
        );
        console.log(`Found ${students.length} students`);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Fetch students error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch students: ' + error.message 
        });
    }
});

// Delete enrollment
router.delete('/:id', async (req, res) => {
    try {
        console.log('=== DELETE ENROLLMENT REQUEST ===');
        console.log('Deleting enrollment ID:', req.params.id);
        console.log('User:', req.user);
        
        // Check permissions
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only program leaders and principal lecturers can remove enrollments.'
            });
        }
        
        const [result] = await db.execute(
            'DELETE FROM enrollments WHERE id = ?',
            [req.params.id]
        );
        
        console.log('Delete result:', result);
        
        if (result.affectedRows === 0) {
            console.log('❌ Enrollment not found for deletion');
            return res.status(404).json({ 
                success: false, 
                message: 'Enrollment not found' 
            });
        }
        
        console.log('✅ Enrollment deleted successfully');
        res.json({ 
            success: true, 
            message: 'Student removed from class successfully' 
        });
    } catch (error) {
        console.error('❌ Delete enrollment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete enrollment: ' + error.message 
        });
    }
});

// Get enrollment statistics
router.get('/stats', async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_enrollments,
                COUNT(DISTINCT student_id) as unique_students,
                COUNT(DISTINCT class_id) as active_classes
            FROM enrollments
        `);
        
        const [popularClasses] = await db.execute(`
            SELECT 
                cl.class_name,
                cl.class_code,
                COUNT(e.id) as enrollment_count
            FROM classes cl
            LEFT JOIN enrollments e ON cl.id = e.class_id
            GROUP BY cl.id
            ORDER BY enrollment_count DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                total_enrollments: stats[0].total_enrollments,
                unique_students: stats[0].unique_students,
                active_classes: stats[0].active_classes,
                popular_classes: popularClasses
            }
        });
    } catch (error) {
        console.error('Get enrollment stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch enrollment statistics' 
        });
    }
});

module.exports = router;