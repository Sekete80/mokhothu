
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Only program leaders and principal lecturers can manage courses
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied. Only program leaders and principal lecturers can manage courses.' });
        }

        const [courses] = await pool.execute(`
            SELECT c.*, 
                   COUNT(DISTINCT ca.id) as assigned_modules,
                   COUNT(DISTINCT cl.id) as active_classes
            FROM courses c
            LEFT JOIN course_assignments ca ON c.id = ca.course_id
            LEFT JOIN classes cl ON c.id = cl.course_id AND cl.academic_year = YEAR(CURDATE())
            GROUP BY c.id
            ORDER BY c.course_code
        `);

        res.json({
            success: true,
            data: courses,
            count: courses.length
        });

    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch courses',
            details: error.message 
        });
    }
});

// Get course by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [courses] = await pool.execute(
            'SELECT * FROM courses WHERE id = ?',
            [req.params.id]
        );

        if (courses.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({
            success: true,
            data: courses[0]
        });

    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch course',
            details: error.message 
        });
    }
});

// Create new course
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Only program leaders can create courses
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can create courses.' });
        }

        const { course_code, course_name, description, credits, faculty } = req.body;

        // Validate required fields
        if (!course_code || !course_name || !faculty) {
            return res.status(400).json({ 
                error: 'Course code, course name, and faculty are required' 
            });
        }

        // Check if course code already exists
        const [existingCourses] = await pool.execute(
            'SELECT id FROM courses WHERE course_code = ?',
            [course_code]
        );

        if (existingCourses.length > 0) {
            return res.status(400).json({ error: 'Course code already exists' });
        }

        const [result] = await pool.execute(
            'INSERT INTO courses (course_code, course_name, description, credits, faculty) VALUES (?, ?, ?, ?, ?)',
            [course_code, course_name, description || '', credits || 3, faculty]
        );

        console.log(`Course created: ${course_code} - ${course_name} by ${req.user.name}`);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            courseId: result.insertId
        });

    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ 
            error: 'Failed to create course',
            details: error.message 
        });
    }
});

// Update course
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can update courses.' });
        }

        const { course_name, description, credits, faculty } = req.body;

        const [result] = await pool.execute(
            'UPDATE courses SET course_name = ?, description = ?, credits = ?, faculty = ? WHERE id = ?',
            [course_name, description, credits, faculty, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({
            success: true,
            message: 'Course updated successfully'
        });

    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ 
            error: 'Failed to update course',
            details: error.message 
        });
    }
});

// Delete course
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can delete courses.' });
        }

        // Check if course has active classes
        const [activeClasses] = await pool.execute(
            'SELECT id FROM classes WHERE course_id = ?',
            [req.params.id]
        );

        if (activeClasses.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete course with active classes. Please delete the classes first.' 
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM courses WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });

    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ 
            error: 'Failed to delete course',
            details: error.message 
        });
    }
});

// Get course assignments
router.get('/:id/assignments', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [assignments] = await pool.execute(`
            SELECT ca.*, u.name as lecturer_name, u.email as lecturer_email
            FROM course_assignments ca
            JOIN users u ON ca.lecturer_id = u.id
            WHERE ca.course_id = ?
            ORDER BY ca.module_name
        `, [req.params.id]);

        res.json({
            success: true,
            data: assignments,
            count: assignments.length
        });

    } catch (error) {
        console.error('Get course assignments error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch course assignments',
            details: error.message 
        });
    }
});

// Assign lecturer to course module
router.post('/:id/assign', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can assign lecturers.' });
        }

        const { lecturer_id, module_name } = req.body;

        if (!lecturer_id || !module_name) {
            return res.status(400).json({ 
                error: 'Lecturer ID and module name are required' 
            });
        }

        // Verify lecturer exists and is actually a lecturer
        const [lecturers] = await pool.execute(
            'SELECT id, role FROM users WHERE id = ? AND role IN ("lecturer", "principal_lecturer")',
            [lecturer_id]
        );

        if (lecturers.length === 0) {
            return res.status(400).json({ error: 'Lecturer not found or invalid role' });
        }

        // Check if assignment already exists
        const [existingAssignments] = await pool.execute(
            'SELECT id FROM course_assignments WHERE course_id = ? AND lecturer_id = ? AND module_name = ?',
            [req.params.id, lecturer_id, module_name]
        );

        if (existingAssignments.length > 0) {
            return res.status(400).json({ error: 'Lecturer is already assigned to this module' });
        }

        const [result] = await pool.execute(
            'INSERT INTO course_assignments (course_id, lecturer_id, module_name) VALUES (?, ?, ?)',
            [req.params.id, lecturer_id, module_name]
        );

        console.log(`Lecturer ${lecturer_id} assigned to module "${module_name}" for course ${req.params.id}`);

        res.status(201).json({
            success: true,
            message: 'Lecturer assigned successfully',
            assignmentId: result.insertId
        });

    } catch (error) {
        console.error('Assign lecturer error:', error);
        res.status(500).json({ 
            error: 'Failed to assign lecturer',
            details: error.message 
        });
    }
});

// Remove lecturer assignment
router.delete('/assignments/:assignmentId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can remove assignments.' });
        }

        const [result] = await pool.execute(
            'DELETE FROM course_assignments WHERE id = ?',
            [req.params.assignmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.json({
            success: true,
            message: 'Assignment removed successfully'
        });

    } catch (error) {
        console.error('Remove assignment error:', error);
        res.status(500).json({ 
            error: 'Failed to remove assignment',
            details: error.message 
        });
    }
});

// Get available lecturers for assignment
router.get('/:id/available-lecturers', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader' && req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [lecturers] = await pool.execute(`
            SELECT u.id, u.name, u.email, u.role,
                   COUNT(ca.id) as current_assignments
            FROM users u
            LEFT JOIN course_assignments ca ON u.id = ca.lecturer_id
            WHERE u.role IN ('lecturer', 'principal_lecturer')
            GROUP BY u.id
            ORDER BY u.name
        `);

        res.json({
            success: true,
            data: lecturers,
            count: lecturers.length
        });

    } catch (error) {
        console.error('Get available lecturers error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch lecturers',
            details: error.message 
        });
    }
});

module.exports = router;
