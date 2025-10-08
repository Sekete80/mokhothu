
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const PrincipalLecturerDashboard = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const loadPrincipalLecturerData = async () => {
        try {
            setLoading(true);
            
            // Load reports for principal lecturer
            const reportsResult = await ApiService.getReports();
            setReports(reportsResult.data || []);
            
            // Load courses (principal lecturers can view all courses)
            const coursesResult = await ApiService.getCourses();
            setCourses(coursesResult.data || []);
            
            // Load classes (principal lecturers can view all classes)
            const classesResult = await ApiService.getClasses();
            setClasses(classesResult.data || []);
            
        } catch (error) {
            setError('Failed to load data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrincipalLecturerData();
    }, [user]);

    // Calculate statistics for principal lecturer
    const calculateStats = () => {
        const totalReports = reports.length;
        const pendingReviews = reports.filter(report => report.status === 'pending').length;
        const forwardedReports = reports.filter(report => report.status === 'forwarded').length;
        const approvedReports = reports.filter(report => report.status === 'approved').length;
        
        // Calculate average attendance
        const attendanceData = reports.map(report => {
            if (report.total_registered_students > 0) {
                return (report.actual_students_present / report.total_registered_students) * 100;
            }
            return 0;
        });
        const averageAttendance = attendanceData.length > 0 
            ? attendanceData.reduce((sum, rate) => sum + rate, 0) / attendanceData.length
            : 0;

        // Calculate average rating
        const ratings = reports
            .filter(report => report.average_rating > 0)
            .map(report => report.average_rating);
        const averageRating = ratings.length > 0 
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;

        return {
            totalReports,
            pendingReviews,
            forwardedReports,
            approvedReports,
            averageAttendance: Math.round(averageAttendance),
            averageRating: averageRating.toFixed(1),
            totalCourses: courses.length,
            totalClasses: classes.length
        };
    };

    const stats = calculateStats();

    const clearError = () => setError('');

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="principal-lecturer-dashboard">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">Principal Lecturer Dashboard</h2>
                            <p className="text-muted mb-0">
                                Review reports, monitor courses, and provide feedback
                            </p>
                        </div>
                        <div className="text-end">
                            <div className="badge bg-info fs-6">
                                Principal Lecturer
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={clearError}></button>
                </div>
            )}

            {/* Principal Lecturer Tabs */}
            <div className="row mb-4">
                <div className="col-12">
                    <ul className="nav nav-pills">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <i className="bi bi-speedometer2 me-2"></i>
                                Overview
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                                onClick={() => setActiveTab('reports')}
                            >
                                <i className="bi bi-journal-text me-2"></i>
                                Reports
                                {stats.pendingReviews > 0 && (
                                    <span className="badge bg-danger ms-2">{stats.pendingReviews}</span>
                                )}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
                                onClick={() => setActiveTab('courses')}
                            >
                                <i className="bi bi-book me-2"></i>
                                Courses & Lectures
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'monitoring' ? 'active' : ''}`}
                                onClick={() => setActiveTab('monitoring')}
                            >
                                <i className="bi bi-graph-up me-2"></i>
                                Monitoring
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'classes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('classes')}
                            >
                                <i className="bi bi-people me-2"></i>
                                Classes
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="row">
                        {/* Quick Stats */}
                        <div className="col-md-3 mb-4">
                            <div className="card bg-primary text-white shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-journal-text display-4 mb-3"></i>
                                    <h3>{stats.totalReports}</h3>
                                    <p className="mb-0">Total Reports</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card bg-warning text-dark shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-clock display-4 mb-3"></i>
                                    <h3>{stats.pendingReviews}</h3>
                                    <p className="mb-0">Pending Review</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card bg-success text-white shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-check-circle display-4 mb-3"></i>
                                    <h3>{stats.forwardedReports}</h3>
                                    <p className="mb-0">Forwarded</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card bg-info text-white shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-people display-4 mb-3"></i>
                                    <h3>{stats.averageAttendance}%</h3>
                                    <p className="mb-0">Avg Attendance</p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Stats */}
                        <div className="col-md-4 mb-4">
                            <div className="card bg-secondary text-white shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-book display-4 mb-3"></i>
                                    <h3>{stats.totalCourses}</h3>
                                    <p className="mb-0">Courses</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="card bg-dark text-white shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-people display-4 mb-3"></i>
                                    <h3>{stats.totalClasses}</h3>
                                    <p className="mb-0">Active Classes</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="card bg-warning text-dark shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-star display-4 mb-3"></i>
                                    <h3>{stats.averageRating}</h3>
                                    <p className="mb-0">Avg Rating</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="col-12">
                            <div className="card shadow">
                                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Recent Reports Needing Attention</h5>
                                    <span className="badge bg-warning">{stats.pendingReviews} pending</span>
                                </div>
                                <div className="card-body">
                                    {reports
                                        .filter(report => report.status === 'pending')
                                        .slice(0, 5)
                                        .map(report => (
                                        <div key={report.id} className="border-bottom pb-2 mb-2">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="mb-1">{report.course_name}</h6>
                                                    <p className="text-muted mb-1 small">
                                                        {report.lecturer_name} • {new Date(report.date_of_lecture).toLocaleDateString()} • {report.class_name}
                                                    </p>
                                                    <span className="badge bg-warning">Pending Review</span>
                                                </div>
                                                <div>
                                                    <button 
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => {
                                                            // This would open the report edit form
                                                            window.dispatchEvent(new CustomEvent('editReport', { detail: report }));
                                                        }}
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.pendingReviews === 0 && (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-check-circle display-1 text-success"></i>
                                            <p className="mt-2">All reports are reviewed! Great work!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Reports Management</h5>
                                </div>
                                <div className="card-body">
                                    {/* Reports Statistics */}
                                    <div className="row mb-4">
                                        <div className="col-md-2 text-center">
                                            <div className="border rounded p-3">
                                                <h4 className="text-primary">{stats.totalReports}</h4>
                                                <small className="text-muted">Total</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2 text-center">
                                            <div className="border rounded p-3">
                                                <h4 className="text-warning">{stats.pendingReviews}</h4>
                                                <small className="text-muted">Pending</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2 text-center">
                                            <div className="border rounded p-3">
                                                <h4 className="text-success">{stats.forwardedReports}</h4>
                                                <small className="text-muted">Forwarded</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2 text-center">
                                            <div className="border rounded p-3">
                                                <h4 className="text-info">{stats.approvedReports}</h4>
                                                <small className="text-muted">Approved</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2 text-center">
                                            <div className="border rounded p-3">
                                                <h4 className="text-secondary">{stats.averageAttendance}%</h4>
                                                <small className="text-muted">Attendance</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2 text-center">
                                            <div className="border rounded p-3">
                                                <h4 className="text-warning">{stats.averageRating}</h4>
                                                <small className="text-muted">Avg Rating</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reports Table */}
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Course</th>
                                                    <th>Lecturer</th>
                                                    <th>Date</th>
                                                    <th>Class</th>
                                                    <th>Attendance</th>
                                                    <th>Status</th>
                                                    <th>Rating</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reports.map(report => (
                                                    <tr key={report.id}>
                                                        <td>
                                                            <strong>{report.course_name}</strong>
                                                            <br/>
                                                            <small className="text-muted">{report.course_code}</small>
                                                        </td>
                                                        <td>{report.lecturer_name}</td>
                                                        <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                                                        <td>{report.class_name}</td>
                                                        <td>
                                                            {report.actual_students_present}/{report.total_registered_students}
                                                            <br/>
                                                            <small className="text-muted">
                                                                {report.total_registered_students > 0 
                                                                    ? Math.round((report.actual_students_present / report.total_registered_students) * 100) + '%'
                                                                    : '0%'
                                                                }
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${
                                                                report.status === 'pending' ? 'bg-warning' :
                                                                report.status === 'approved' ? 'bg-success' :
                                                                report.status === 'forwarded' ? 'bg-info' : 'bg-danger'
                                                            }`}>
                                                                {report.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {report.average_rating > 0 ? (
                                                                <span className="text-warning">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <i 
                                                                            key={i}
                                                                            className={`bi bi-star${i < Math.floor(report.average_rating) ? '-fill' : ''} ${i < report.average_rating ? 'text-warning' : 'text-muted'}`}
                                                                        ></i>
                                                                    ))}
                                                                    <br/>
                                                                    <small>({report.average_rating})</small>
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">No ratings</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() => {
                                                                    window.dispatchEvent(new CustomEvent('editReport', { detail: report }));
                                                                }}
                                                            >
                                                                Review
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {reports.length === 0 && (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-journal-x display-1"></i>
                                            <h5 className="mt-3">No Reports Found</h5>
                                            <p>There are no reports to review yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* COURSES TAB */}
                {activeTab === 'courses' && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Courses & Lectures</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        {courses.map(course => (
                                            <div key={course.id} className="col-md-6 mb-4">
                                                <div className="card h-100">
                                                    <div className="card-header bg-info text-white">
                                                        <h6 className="mb-0">{course.course_code}</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <h5 className="card-title">{course.course_name}</h5>
                                                        <p className="card-text text-muted small">
                                                            {course.description || 'No description available'}
                                                        </p>
                                                        <div className="mb-2">
                                                            <small className="text-muted">
                                                                <strong>Faculty:</strong> {course.faculty}
                                                            </small>
                                                        </div>
                                                        <div className="mb-2">
                                                            <small className="text-muted">
                                                                <strong>Credits:</strong> {course.credits}
                                                            </small>
                                                        </div>
                                                        {course.stream && (
                                                            <div className="mb-2">
                                                                <small className="text-muted">
                                                                    <strong>Stream:</strong> {course.stream}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="card-footer">
                                                        <small className="text-muted">
                                                            {course.assigned_modules || 0} modules assigned
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {courses.length === 0 && (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-book display-1"></i>
                                            <h5 className="mt-3">No Courses Available</h5>
                                            <p>There are no courses in the system yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MONITORING TAB */}
                {activeTab === 'monitoring' && (
                    <div className="row">
                        <div className="col-md-8">
                            <div className="card shadow mb-4">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Performance Analytics</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row text-center">
                                        <div className="col-md-4 mb-4">
                                            <div className="border rounded p-3">
                                                <h3 className="text-primary">{stats.averageAttendance}%</h3>
                                                <p className="text-muted mb-0">Average Attendance</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-4">
                                            <div className="border rounded p-3">
                                                <h3 className="text-warning">{stats.averageRating}</h3>
                                                <p className="text-muted mb-0">Average Rating</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-4">
                                            <div className="border rounded p-3">
                                                <h3 className="text-success">{stats.forwardedReports}</h3>
                                                <p className="text-muted mb-0">Reports Forwarded</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Simple Analytics Visualization */}
                                    <div className="mt-4">
                                        <h6>Report Status Distribution</h6>
                                        <div className="progress mb-3" style={{height: '30px'}}>
                                            <div 
                                                className="progress-bar bg-warning" 
                                                style={{width: `${stats.totalReports > 0 ? (stats.pendingReviews / stats.totalReports) * 100 : 0}%`}}
                                                title={`Pending: ${stats.pendingReviews}`}
                                            >
                                                Pending ({stats.pendingReviews})
                                            </div>
                                            <div 
                                                className="progress-bar bg-success" 
                                                style={{width: `${stats.totalReports > 0 ? (stats.approvedReports / stats.totalReports) * 100 : 0}%`}}
                                                title={`Approved: ${stats.approvedReports}`}
                                            >
                                                Approved ({stats.approvedReports})
                                            </div>
                                            <div 
                                                className="progress-bar bg-info" 
                                                style={{width: `${stats.totalReports > 0 ? (stats.forwardedReports / stats.totalReports) * 100 : 0}%`}}
                                                title={`Forwarded: ${stats.forwardedReports}`}
                                            >
                                                Forwarded ({stats.forwardedReports})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Summary</h5>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <h6>Quick Stats</h6>
                                        <ul className="list-unstyled">
                                            <li className="mb-2">
                                                <i className="bi bi-journal-text text-primary me-2"></i>
                                                {stats.totalReports} Total Reports
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-book text-success me-2"></i>
                                                {stats.totalCourses} Courses
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-people text-info me-2"></i>
                                                {stats.totalClasses} Active Classes
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-star text-warning me-2"></i>
                                                {stats.averageRating} Avg Rating
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-people text-secondary me-2"></i>
                                                {stats.averageAttendance}% Avg Attendance
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="mb-3">
                                        <h6>Recent Activity</h6>
                                        <ul className="list-unstyled small">
                                            {reports.slice(0, 3).map(report => (
                                                <li key={report.id} className="mb-1 text-muted">
                                                    • {report.course_name} - {new Date(report.date_of_lecture).toLocaleDateString()}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CLASSES TAB */}
                {activeTab === 'classes' && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Classes Overview</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        {classes.map(classItem => (
                                            <div key={classItem.id} className="col-md-6 col-lg-4 mb-4">
                                                <div className="card h-100">
                                                    <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                                                        <h6 className="mb-0">{classItem.class_code}</h6>
                                                        <span className="badge bg-light text-dark">
                                                            {classItem.semester} {classItem.academic_year}
                                                        </span>
                                                    </div>
                                                    <div className="card-body">
                                                        <h5 className="card-title">{classItem.class_name}</h5>
                                                        <p className="card-text text-muted small mb-2">
                                                            <strong>Course:</strong> {classItem.course_code} - {classItem.course_name}
                                                        </p>
                                                        {classItem.lecturer_name && (
                                                            <p className="card-text text-muted small mb-2">
                                                                <strong>Lecturer:</strong> {classItem.lecturer_name}
                                                            </p>
                                                        )}
                                                        <div className="mb-2">
                                                            <small className="text-muted">
                                                                <strong>Enrollment:</strong> {classItem.enrolled_students || 0}/{classItem.max_students}
                                                            </small>
                                                        </div>
                                                        <div className="mb-2">
                                                            <small className="text-muted">
                                                                <strong>Scheduled Lectures:</strong> {classItem.scheduled_lectures || 0}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="card-footer">
                                                        <small className="text-muted">
                                                            {classItem.stream || 'General'} stream
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {classes.length === 0 && (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-people display-1"></i>
                                            <h5 className="mt-3">No Classes Available</h5>
                                            <p>There are no classes in the system yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrincipalLecturerDashboard;
