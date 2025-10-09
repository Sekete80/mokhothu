const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const ExcelJS = require('exceljs');

const router = express.Router();

// Get all reports - FIXED THE ROUTE FROM '/exel' to '/'
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Get reports request from user:', req.user.role, req.user.name);
        
        let query, params;

        if (req.user.role === 'student') {
            // Students see ALL approved/forwarded reports for monitoring and rating
            query = `
                SELECT r.*, u.name as lecturer_full_name,
                (SELECT rating FROM report_ratings WHERE report_id = r.id AND student_id = ?) as my_rating
                FROM reports r 
                LEFT JOIN users u ON r.lecturer_id = u.id 
                WHERE r.status IN ('approved', 'forwarded')  -- Students only see approved or forwarded reports
                ORDER BY r.date_of_lecture DESC, r.scheduled_time DESC
            `;
            params = [req.user.id];  // Only need student ID for my_rating check
        } else {
            // Other roles see all reports
            query = `
                SELECT r.*, u.name as lecturer_full_name 
                FROM reports r 
                LEFT JOIN users u ON r.lecturer_id = u.id 
                ORDER BY r.created_at DESC
            `;
            params = [];
        }

        console.log('Executing query:', query);
        console.log('With params:', params);

        const [reports] = await pool.execute(query, params);
        
        console.log(`Found ${reports.length} reports for ${req.user.role}`);

        res.json({
            success: true,
            data: reports,
            count: reports.length
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch reports',
            details: error.message 
        });
    }
});

// NEW: Get forwarded reports for principal lecturer dashboard
router.get('/forwarded', authenticateToken, async (req, res) => {
    try {
        console.log('Get forwarded reports request from user:', req.user.role, req.user.name);
        
        // Only principal lecturers can access forwarded reports
        if (req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only principal lecturers can access forwarded reports.' 
            });
        }

        const query = `
            SELECT r.*, u.name as lecturer_full_name 
            FROM reports r 
            LEFT JOIN users u ON r.lecturer_id = u.id 
            WHERE r.status = 'forwarded'
            ORDER BY r.created_at DESC
        `;
        const params = [];

        console.log('Executing forwarded reports query:', query);

        const [reports] = await pool.execute(query, params);
        
        console.log(`Found ${reports.length} forwarded reports for principal lecturer ${req.user.name}`);

        res.json({
            success: true,
            data: reports,
            count: reports.length
        });

    } catch (error) {
        console.error('Get forwarded reports error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch forwarded reports',
            details: error.message 
        });
    }
});

// NEW: Get lecturer's own reports only
router.get('/my-reports', authenticateToken, async (req, res) => {
    try {
        console.log('Get my-reports request from user:', req.user.role, req.user.name);
        
        // Only lecturers can access their own reports
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only lecturers can access their own reports.' 
            });
        }

        const query = `
            SELECT r.*, u.name as lecturer_full_name 
            FROM reports r 
            LEFT JOIN users u ON r.lecturer_id = u.id 
            WHERE r.lecturer_id = ?
            ORDER BY r.created_at DESC
        `;
        const params = [req.user.id];

        console.log('Executing my-reports query:', query);
        console.log('With params:', params);

        const [reports] = await pool.execute(query, params);
        
        console.log(`Found ${reports.length} reports for lecturer ${req.user.name}`);

        res.json({
            success: true,
            data: reports,
            count: reports.length
        });

    } catch (error) {
        console.error('Get my-reports error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch your reports',
            details: error.message 
        });
    }
});

// NEW: Get reports for principal lecturer review
router.get('/for-review', authenticateToken, async (req, res) => {
    try {
        console.log('Get for-review request from user:', req.user.role, req.user.name);
        
        // Only principal lecturers can access reports for review
        if (req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only principal lecturers can access reports for review.' 
            });
        }

        const query = `
            SELECT r.*, u.name as lecturer_full_name 
            FROM reports r 
            LEFT JOIN users u ON r.lecturer_id = u.id 
            WHERE r.status = 'pending'  -- Only show pending reports for review
            ORDER BY r.created_at DESC
        `;
        const params = [];

        console.log('Executing for-review query:', query);

        const [reports] = await pool.execute(query, params);
        
        console.log(`Found ${reports.length} reports pending review for principal lecturer ${req.user.name}`);

        res.json({
            success: true,
            data: reports,
            count: reports.length
        });

    } catch (error) {
        console.error('Get for-review error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch reports for review',
            details: error.message 
        });
    }
});

// NEW: Get ratings for lecturer's reports
router.get('/my-ratings', authenticateToken, async (req, res) => {
    try {
        console.log('Get my-ratings request from user:', req.user.role, req.user.name);
        
        // Only lecturers can access their ratings
        if (req.user.role !== 'lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only lecturers can access their ratings.' 
            });
        }

        const query = `
            SELECT rr.*, r.course_name, r.class_name, r.date_of_lecture, u.name as student_name
            FROM report_ratings rr
            JOIN reports r ON rr.report_id = r.id
            JOIN users u ON rr.student_id = u.id
            WHERE r.lecturer_id = ?
            ORDER BY rr.created_at DESC
        `;
        const params = [req.user.id];

        console.log('Executing my-ratings query:', query);
        console.log('With params:', params);

        const [ratings] = await pool.execute(query, params);
        
        console.log(`Found ${ratings.length} ratings for lecturer ${req.user.name}`);

        res.json({
            success: true,
            data: ratings,
            count: ratings.length
        });

    } catch (error) {
        console.error('Get my-ratings error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch your ratings',
            details: error.message 
        });
    }
});

// NEW: Approve report (for principal lecturers)
router.post('/:id/approve', authenticateToken, async (req, res) => {
    try {
        console.log('Approve report request from user:', req.user.role, req.user.name);
        console.log('Report ID:', req.params.id);

        // Only principal lecturers can approve reports
        if (req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only principal lecturers can approve reports.' 
            });
        }

        const { principal_feedback, rating } = req.body;

        const [result] = await pool.execute(
            `UPDATE reports 
             SET status = 'approved', 
                 principal_feedback = ?, 
                 rating = ?,
                 reviewed_by = ?,
                 reviewed_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [
                principal_feedback || '',
                rating || null,
                req.user.id,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: 'Report not found or already processed' 
            });
        }

        console.log(`✅ Report ${req.params.id} approved by principal lecturer ${req.user.name}`);

        res.json({
            success: true,
            message: 'Report approved successfully'
        });

    } catch (error) {
        console.error('Approve report error:', error);
        res.status(500).json({ 
            error: 'Failed to approve report',
            details: error.message 
        });
    }
});

// NEW: Forward report to program leader (for principal lecturers)
router.post('/:id/forward', authenticateToken, async (req, res) => {
    try {
        console.log('Forward report request from user:', req.user.role, req.user.name);
        console.log('Report ID:', req.params.id);

        // Only principal lecturers can forward reports
        if (req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only principal lecturers can forward reports.' 
            });
        }

        const { principal_feedback, rating } = req.body;

        const [result] = await pool.execute(
            `UPDATE reports 
             SET status = 'forwarded', 
                 principal_feedback = ?, 
                 rating = ?,
                 reviewed_by = ?,
                 reviewed_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [
                principal_feedback || '',
                rating || null,
                req.user.id,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: 'Report not found or already processed' 
            });
        }

        console.log(`✅ Report ${req.params.id} forwarded to Program Leader by ${req.user.name}`);

        res.json({
            success: true,
            message: 'Report forwarded to program leader successfully'
        });

    } catch (error) {
        console.error('Forward report error:', error);
        res.status(500).json({ 
            error: 'Failed to forward report',
            details: error.message 
        });
    }
});

// NEW: Reject report (for principal lecturers)
router.post('/:id/reject', authenticateToken, async (req, res) => {
    try {
        console.log('Reject report request from user:', req.user.role, req.user.name);
        console.log('Report ID:', req.params.id);

        // Only principal lecturers can reject reports
        if (req.user.role !== 'principal_lecturer') {
            return res.status(403).json({ 
                error: 'Access denied. Only principal lecturers can reject reports.' 
            });
        }

        const { principal_feedback } = req.body;

        if (!principal_feedback) {
            return res.status(400).json({ 
                error: 'Feedback is required when rejecting a report' 
            });
        }

        const [result] = await pool.execute(
            `UPDATE reports 
             SET status = 'rejected', 
                 principal_feedback = ?,
                 reviewed_by = ?,
                 reviewed_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [
                principal_feedback,
                req.user.id,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: 'Report not found or already processed' 
            });
        }

        console.log(`❌ Report ${req.params.id} rejected by principal lecturer ${req.user.name}`);

        res.json({
            success: true,
            message: 'Report rejected successfully'
        });

    } catch (error) {
        console.error('Reject report error:', error);
        res.status(500).json({ 
            error: 'Failed to reject report',
            details: error.message 
        });
    }
});

// Create new report
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('Create report request from user:', req.user.role, req.user.id);
        console.log('Request body:', req.body);

        const {
            faculty_name,
            class_name,
            week_of_reporting,
            date_of_lecture,
            course_name,
            course_code,
            lecturer_name,
            actual_students_present,
            total_registered_students,
            venue,
            scheduled_time,
            topic_taught,
            learning_outcomes,
            recommendations
        } = req.body;

        // Validate required fields
        const requiredFields = [
            'faculty_name', 'class_name', 'week_of_reporting', 'date_of_lecture',
            'course_name', 'course_code', 'lecturer_name', 'actual_students_present',
            'total_registered_students', 'venue', 'scheduled_time', 'topic_taught',
            'learning_outcomes', 'recommendations'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                missingFields: missingFields.map(field => field.replace(/_/g, ' '))
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO reports (
                faculty_name, class_name, week_of_reporting, date_of_lecture,
                course_name, course_code, lecturer_name, actual_students_present,
                total_registered_students, venue, scheduled_time, topic_taught,
                learning_outcomes, recommendations, lecturer_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                faculty_name,
                class_name,
                week_of_reporting,
                date_of_lecture,
                course_name,
                course_code,
                lecturer_name,
                parseInt(actual_students_present),
                parseInt(total_registered_students),
                venue,
                scheduled_time,
                topic_taught,
                learning_outcomes,
                recommendations,
                req.user.id
            ]
        );

        console.log('Report created with ID:', result.insertId);

        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            reportId: result.insertId
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ 
            error: 'Failed to create report',
            details: error.message 
        });
    }
});

// Update report (for principal lecturer and program leader)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        console.log('=== UPDATE REPORT REQUEST ===');
        console.log('User:', req.user.role, req.user.id, req.user.name);
        console.log('Report ID:', req.params.id);
        console.log('Request body:', req.body);
        console.log('=============================');

        // Only principal lecturers and program leaders can edit reports
        if (req.user.role !== 'principal_lecturer' && req.user.role !== 'program_leader') {
            console.log('Access denied - user role:', req.user.role);
            return res.status(403).json({ 
                error: 'Access denied. Only principal lecturers and program leaders can edit reports.' 
            });
        }

        const {
            faculty_name,
            class_name,
            week_of_reporting,
            date_of_lecture,
            course_name,
            course_code,
            lecturer_name,
            actual_students_present,
            total_registered_students,
            venue,
            scheduled_time,
            topic_taught,
            learning_outcomes,
            recommendations,
            principal_feedback,
            rating,
            status
        } = req.body;

        // Build dynamic update query based on provided fields
        let updateFields = [];
        let updateValues = [];

        // Always include these fields if provided
        const fieldMappings = [
            { field: 'faculty_name', value: faculty_name },
            { field: 'class_name', value: class_name },
            { field: 'week_of_reporting', value: week_of_reporting },
            { field: 'date_of_lecture', value: date_of_lecture },
            { field: 'course_name', value: course_name },
            { field: 'course_code', value: course_code },
            { field: 'lecturer_name', value: lecturer_name },
            { field: 'actual_students_present', value: actual_students_present },
            { field: 'total_registered_students', value: total_registered_students },
            { field: 'venue', value: venue },
            { field: 'scheduled_time', value: scheduled_time },
            { field: 'topic_taught', value: topic_taught },
            { field: 'learning_outcomes', value: learning_outcomes },
            { field: 'recommendations', value: recommendations },
            { field: 'principal_feedback', value: principal_feedback },
            { field: 'rating', value: rating },
            { field: 'status', value: status }
        ];

        fieldMappings.forEach(({ field, value }) => {
            if (value !== undefined && value !== null) {
                updateFields.push(`${field} = ?`);
                updateValues.push(value);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Add report ID as the last parameter
        updateValues.push(req.params.id);

        const query = `UPDATE reports SET ${updateFields.join(', ')} WHERE id = ?`;
        
        console.log('Executing query:', query);
        console.log('With values:', updateValues);

        const [result] = await pool.execute(query, updateValues);

        console.log('Update result:', result);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // If status was changed to 'forwarded', log it
        if (status === 'forwarded') {
            console.log(`✅ Report ${req.params.id} successfully forwarded to Program Leader by ${req.user.name}`);
        }

        res.json({
            success: true,
            message: 'Report updated successfully',
            forwarded: status === 'forwarded'
        });

    } catch (error) {
        console.error('❌ Update report error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to update report',
            details: error.message,
            sqlMessage: error.sqlMessage 
        });
    }
});

// Add rating to report (for students)
router.post('/:id/rate', authenticateToken, async (req, res) => {
    try {
        console.log('Rate report request from user:', req.user.role, req.user.id);

        // Only students can rate reports
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Only students can rate reports.' });
        }

        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if student already rated this report
        const [existingRatings] = await pool.execute(
            'SELECT id FROM report_ratings WHERE report_id = ? AND student_id = ?',
            [req.params.id, req.user.id]
        );

        if (existingRatings.length > 0) {
            return res.status(400).json({ error: 'You have already rated this report' });
        }

        // Insert rating
        await pool.execute(
            'INSERT INTO report_ratings (report_id, student_id, rating, feedback) VALUES (?, ?, ?, ?)',
            [req.params.id, req.user.id, rating, feedback || '']
        );

        // Update report average rating
        const [ratings] = await pool.execute(
            'SELECT AVG(rating) as average_rating, COUNT(*) as rating_count FROM report_ratings WHERE report_id = ?',
            [req.params.id]
        );

        await pool.execute(
            'UPDATE reports SET average_rating = ? WHERE id = ?',
            [ratings[0].average_rating || 0, req.params.id]
        );

        console.log(`Rating added: ${rating}/5 by student ${req.user.id} for report ${req.params.id}`);

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            averageRating: ratings[0].average_rating,
            ratingCount: ratings[0].rating_count
        });

    } catch (error) {
        console.error('Rate report error:', error);
        res.status(500).json({ 
            error: 'Failed to submit rating',
            details: error.message 
        });
    }
});

// Get report ratings
router.get('/:id/ratings', authenticateToken, async (req, res) => {
    try {
        const [ratings] = await pool.execute(
            `SELECT rr.*, u.name as student_name 
             FROM report_ratings rr 
             JOIN users u ON rr.student_id = u.id 
             WHERE rr.report_id = ? 
             ORDER BY rr.created_at DESC`,
            [req.params.id]
        );

        res.json({
            success: true,
            data: ratings,
            count: ratings.length
        });

    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch ratings',
            details: error.message 
        });
    }
});

// Get report by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        console.log('Get report by ID:', req.params.id);

        const [reports] = await pool.execute(
            `SELECT r.*, u.name as lecturer_full_name 
             FROM reports r 
             LEFT JOIN users u ON r.lecturer_id = u.id 
             WHERE r.id = ?`,
            [req.params.id]
        );

        if (reports.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({
            success: true,
            data: reports[0]
        });

    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch report',
            details: error.message 
        });
    }
});

// Export reports to Excel - SIMPLIFIED VERSION
router.get('/export/excel', authenticateToken, async (req, res) => {
    try {
        console.log('Excel export request from user:', req.user.role, req.user.name);

        // Only program leaders can export
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied. Only program leaders can export reports.' });
        }

        const [reports] = await pool.execute(
            `SELECT r.*, u.name as lecturer_full_name 
             FROM reports r 
             LEFT JOIN users u ON r.lecturer_id = u.id 
             WHERE r.status = 'forwarded'
             ORDER BY r.date_of_lecture DESC`
        );

        console.log(`Exporting ${reports.length} forwarded reports to Excel`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Forwarded Reports');

        // Simplified headers - only include columns that definitely exist
        worksheet.columns = [
            { header: 'Report ID', key: 'id', width: 10 },
            { header: 'Faculty', key: 'faculty_name', width: 20 },
            { header: 'Class', key: 'class_name', width: 15 },
            { header: 'Course Name', key: 'course_name', width: 20 },
            { header: 'Course Code', key: 'course_code', width: 15 },
            { header: 'Lecturer', key: 'lecturer_name', width: 20 },
            { header: 'Date', key: 'date_of_lecture', width: 15 },
            { header: 'Students Present', key: 'actual_students_present', width: 15 },
            { header: 'Total Students', key: 'total_registered_students', width: 15 },
            { header: 'Attendance %', key: 'attendance_percentage', width: 15 },
            { header: 'Venue', key: 'venue', width: 15 },
            { header: 'Scheduled Time', key: 'scheduled_time', width: 15 },
            { header: 'Topic', key: 'topic_taught', width: 30 },
            { header: 'Learning Outcomes', key: 'learning_outcomes', width: 40 },
            { header: 'Recommendations', key: 'recommendations', width: 40 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Add data (only fields that definitely exist)
        reports.forEach(report => {
            const attendancePercentage = report.total_registered_students > 0 
                ? Math.round((report.actual_students_present / report.total_registered_students) * 100)
                : 0;

            worksheet.addRow({
                id: report.id,
                faculty_name: report.faculty_name,
                class_name: report.class_name,
                course_name: report.course_name,
                course_code: report.course_code,
                lecturer_name: report.lecturer_name,
                date_of_lecture: new Date(report.date_of_lecture).toLocaleDateString(),
                actual_students_present: report.actual_students_present,
                total_registered_students: report.total_registered_students,
                attendance_percentage: `${attendancePercentage}%`,
                venue: report.venue,
                scheduled_time: report.scheduled_time,
                topic_taught: report.topic_taught,
                learning_outcomes: report.learning_outcomes,
                recommendations: report.recommendations,
                status: report.status
            });
        });

        // Style headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF007BFF' }
        };

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        });

        // Set response headers
        const filename = `forwarded-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Send file
        await workbook.xlsx.write(res);
        res.end();

        console.log(`✅ Excel file "${filename}" exported successfully with ${reports.length} reports`);

    } catch (error) {
        console.error('❌ Excel export error:', error);
        res.status(500).json({ 
            error: 'Failed to export Excel file',
            details: error.message 
        });
    }
});

// Health check endpoint for reports
router.get('/health/check', authenticateToken, async (req, res) => {
    try {
        const [reports] = await pool.execute('SELECT COUNT(*) as total FROM reports');
        
        // Check if report_ratings table exists
        let ratingsCount = 0;
        try {
            const [ratings] = await pool.execute('SELECT COUNT(*) as total FROM report_ratings');
            ratingsCount = ratings[0].total;
        } catch (e) {
            console.log('report_ratings table does not exist yet');
        }
        
        res.json({
            success: true,
            data: {
                totalReports: reports[0].total,
                totalRatings: ratingsCount,
                database: 'Connected'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

module.exports = router;