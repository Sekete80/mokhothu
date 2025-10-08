const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all classes - FIXED QUERY
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Only program leaders and principal lecturers can manage classes
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied. Only program leaders and principal lecturers can manage classes.' });
        }

        const [classes] = await pool.execute(`
            SELECT 
                cl.*, 
                c.course_code, 
                c.course_name,
                u.name as lecturer_name,
                u.email as lecturer_email,
                (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = cl.id) as enrolled_students,
                (SELECT COUNT(*) FROM lectures l WHERE l.class_id = cl.id) as scheduled_lectures
            FROM classes cl
            LEFT JOIN courses c ON cl.course_id = c.id
            LEFT JOIN users u ON cl.lecturer_id = u.id
            ORDER BY cl.academic_year DESC, cl.semester, cl.class_code
        `);

        console.log(`Found ${classes.length} classes with enrollment data`);

        res.json({
            success: true,
            data: classes,
            count: classes.length
        });

    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch classes',
            details: error.message 
        });
    }
});

// NEW: Get lecturer's assigned classes
router.get('/my-classes', authenticateToken, async (req, res) => {
    try {
        console.log('Get my-classes request from user:', req.user.role, req.user.name);
        
        // Only lecturers can access their assigned classes
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only lecturers can access their assigned classes.' 
            });
        }

        const [classes] = await pool.execute(`
            SELECT cl.*, 
                   c.course_code, 
                   c.course_name,
                   c.credits,
                   COUNT(DISTINCT e.id) as total_students
            FROM classes cl
            JOIN courses c ON cl.course_id = c.id
            LEFT JOIN enrollments e ON cl.id = e.class_id
            WHERE cl.lecturer_id = ?
            GROUP BY cl.id
            ORDER BY cl.academic_year DESC, cl.semester, cl.class_code
        `, [req.user.id]);

        console.log(`Found ${classes.length} classes for lecturer ${req.user.name}`);

        res.json({
            success: true,
            data: classes,
            count: classes.length
        });

    } catch (error) {
        console.error('Get my-classes error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch your classes',
            details: error.message 
        });
    }
});

// Get class by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [classes] = await pool.execute(`
            SELECT cl.*, 
                   c.course_code, 
                   c.course_name,
                   c.credits,
                   u.name as lecturer_name,
                   u.email as lecturer_email
            FROM classes cl
            LEFT JOIN courses c ON cl.course_id = c.id
            LEFT JOIN users u ON cl.lecturer_id = u.id
            WHERE cl.id = ?
        `, [req.params.id]);

        if (classes.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({
            success: true,
            data: classes[0]
        });

    } catch (error) {
        console.error('Get class error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch class',
            details: error.message 
        });
    }
});

// Create new class
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Only program leaders can create classes
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can create classes.' });
        }

        const { class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students } = req.body;

        // Validate required fields
        if (!class_code || !class_name || !course_id || !semester || !academic_year) {
            return res.status(400).json({ 
                error: 'Class code, class name, course, semester, and academic year are required' 
            });
        }

        // Check if class code already exists
        const [existingClasses] = await pool.execute(
            'SELECT id FROM classes WHERE class_code = ?',
            [class_code]
        );

        if (existingClasses.length > 0) {
            return res.status(400).json({ error: 'Class code already exists' });
        }

        // Verify course exists
        const [courses] = await pool.execute(
            'SELECT id FROM courses WHERE id = ?',
            [course_id]
        );

        if (courses.length === 0) {
            return res.status(400).json({ error: 'Course not found' });
        }

        // Verify lecturer exists (if provided)
        if (lecturer_id) {
            const [lecturers] = await pool.execute(
                'SELECT id FROM users WHERE id = ? AND role IN ("lecturer", "principal_lecturer")',
                [lecturer_id]
            );

            if (lecturers.length === 0) {
                return res.status(400).json({ error: 'Lecturer not found or invalid role' });
            }
        }

        const [result] = await pool.execute(
            'INSERT INTO classes (class_code, class_name, course_id, lecturer_id, semester, academic_year, max_students) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [class_code, class_name, course_id, lecturer_id || null, semester, academic_year, max_students || 30]
        );

        console.log(`Class created: ${class_code} - ${class_name} by ${req.user.name}`);

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            classId: result.insertId
        });

    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ 
            error: 'Failed to create class',
            details: error.message 
        });
    }
});

// Update class
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can update classes.' });
        }

        const { class_name, lecturer_id, semester, academic_year, max_students } = req.body;

        const [result] = await pool.execute(
            'UPDATE classes SET class_name = ?, lecturer_id = ?, semester = ?, academic_year = ?, max_students = ? WHERE id = ?',
            [class_name, lecturer_id || null, semester, academic_year, max_students, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({
            success: true,
            message: 'Class updated successfully'
        });

    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({ 
            error: 'Failed to update class',
            details: error.message 
        });
    }
});

// Delete class
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can delete classes.' });
        }

        // Check if class has enrollments
        const [enrollments] = await pool.execute(
            'SELECT id FROM enrollments WHERE class_id = ?',
            [req.params.id]
        );

        if (enrollments.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete class with enrolled students. Please remove students first.' 
            });
        }

        // Check if class has scheduled lectures
        const [lectures] = await pool.execute(
            'SELECT id FROM lectures WHERE class_id = ?',
            [req.params.id]
        );

        if (lectures.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete class with scheduled lectures. Please delete lectures first.' 
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM classes WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });

    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ 
            error: 'Failed to delete class',
            details: error.message 
        });
    }
});

// Get class enrollments
router.get('/:id/enrollments', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [enrollments] = await pool.execute(`
            SELECT e.*, u.name as student_name, u.email as student_email
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            WHERE e.class_id = ?
            ORDER BY u.name
        `, [req.params.id]);

        res.json({
            success: true,
            data: enrollments,
            count: enrollments.length
        });

    } catch (error) {
        console.error('Get class enrollments error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch enrollments',
            details: error.message 
        });
    }
});

// Enroll student in class
router.post('/:id/enroll', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can enroll students.' });
        }

        const { student_id } = req.body;

        if (!student_id) {
            return res.status(400).json({ 
                error: 'Student ID is required' 
            });
        }

        // Verify student exists
        const [students] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "student"',
            [student_id]
        );

        if (students.length === 0) {
            return res.status(400).json({ error: 'Student not found or invalid role' });
        }

        // Check if student is already enrolled
        const [existingEnrollments] = await pool.execute(
            'SELECT id FROM enrollments WHERE class_id = ? AND student_id = ?',
            [req.params.id, student_id]
        );

        if (existingEnrollments.length > 0) {
            return res.status(400).json({ error: 'Student is already enrolled in this class' });
        }

        // Check class capacity
        const [classInfo] = await pool.execute(`
            SELECT cl.max_students, COUNT(e.id) as current_enrollments
            FROM classes cl
            LEFT JOIN enrollments e ON cl.id = e.class_id
            WHERE cl.id = ?
            GROUP BY cl.id
        `, [req.params.id]);

        if (classInfo.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        if (classInfo[0].current_enrollments >= classInfo[0].max_students) {
            return res.status(400).json({ error: 'Class has reached maximum capacity' });
        }

        const [result] = await pool.execute(
            'INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)',
            [req.params.id, student_id]
        );

        console.log(`Student ${student_id} enrolled in class ${req.params.id}`);

        res.status(201).json({
            success: true,
            message: 'Student enrolled successfully',
            enrollmentId: result.insertId
        });

    } catch (error) {
        console.error('Enroll student error:', error);
        res.status(500).json({ 
            error: 'Failed to enroll student',
            details: error.message 
        });
    }
});

// Remove student from class
router.delete('/enrollments/:enrollmentId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can remove enrollments.' });
        }

        const [result] = await pool.execute(
            'DELETE FROM enrollments WHERE id = ?',
            [req.params.enrollmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        res.json({
            success: true,
            message: 'Student removed from class successfully'
        });

    } catch (error) {
        console.error('Remove enrollment error:', error);
        res.status(500).json({ 
            error: 'Failed to remove enrollment',
            details: error.message 
        });
    }
});

// Get available students for enrollment
router.get('/:id/available-students', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [students] = await pool.execute(`
            SELECT u.id, u.name, u.email,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = u.id) as current_enrollments
            FROM users u
            WHERE u.role = 'student'
            AND u.id NOT IN (SELECT student_id FROM enrollments WHERE class_id = ?)
            ORDER BY u.name
        `, [req.params.id]);

        res.json({
            success: true,
            data: students,
            count: students.length
        });

    } catch (error) {
        console.error('Get available students error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch students',
            details: error.message 
        });
    }
});

// Get class lectures
router.get('/:id/lectures', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [lectures] = await pool.execute(`
            SELECT l.*, u.name as lecturer_name
            FROM lectures l
            JOIN users u ON l.lecturer_id = u.id
            WHERE l.class_id = ?
            ORDER BY l.scheduled_date, l.scheduled_time
        `, [req.params.id]);

        res.json({
            success: true,
            data: lectures,
            count: lectures.length
        });

    } catch (error) {
        console.error('Get class lectures error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch lectures',
            details: error.message 
        });
    }
});

module.exports = router;