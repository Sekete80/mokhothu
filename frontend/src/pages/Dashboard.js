import React, { useState, useEffect } from 'react';
import ReportForm from '../components/ReportForm';
import ReportList from '../components/ReportList';
import ReportEditForm from '../components/ReportEditForm';
import RatingModal from '../components/RatingModal';
import CourseManagement from '../components/CourseManagement';
import ClassManagement from '../components/ClassManagement';
import EnrollmentManagement from '../components/EnrollmentManagement';
import StudentDashboard from './StudentDashboard';
import PrincipalLectureDashboard from './PrincipalLectureDashboard';
import ApiService from '../services/api';

const Dashboard = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [showReportForm, setShowReportForm] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [ratingReport, setRatingReport] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [activeTab, setActiveTab] = useState('reports');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [myClasses, setMyClasses] = useState([]);
    const [reportRatings, setReportRatings] = useState([]);

    const loadReports = async () => {
        try {
            setLoading(true);
            let result;
            
            // Load reports based on user role
            if (user.role === 'lecturer') {
                // Lecturer: Only load their own reports
                result = await ApiService.getMyReports();
            } else if (user.role === 'program_leader') {
                // Program leader: Load all reports (for review and management)
                result = await ApiService.getReports();
            } else if (user.role === 'principal_lecturer') {
                // Principal lecturer: Load reports they need to review
                result = await ApiService.getReportsForReview();
            } else {
                result = await ApiService.getReports();
            }
            
            setReports(result.data || []);
        } catch (error) {
            setError('Failed to load reports: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadMyClasses = async () => {
        try {
            const result = await ApiService.getMyClasses();
            setMyClasses(result.data || []);
        } catch (error) {
            console.error('Failed to load classes:', error);
            setMyClasses([]);
        }
    };

    const loadReportRatings = async () => {
        try {
            const result = await ApiService.getMyReportRatings();
            setReportRatings(result.data || []);
        } catch (error) {
            console.error('Failed to load report ratings:', error);
            setReportRatings([]);
        }
    };

    useEffect(() => {
        if (activeTab === 'reports' && user.role !== 'student' && user.role !== 'principal_lecturer') {
            loadReports();
        }
        
        if (activeTab === 'classes' && user.role === 'lecturer') {
            loadMyClasses();
        }
        
        if (activeTab === 'rating' && user.role === 'lecturer') {
            loadReportRatings();
        }
    }, [user, activeTab]);

    // Add event listener for student rating from enhanced dashboard
    useEffect(() => {
        const handleRateReport = (event) => {
            setRatingReport(event.detail);
            setShowRatingModal(true);
        };

        const handleEditReport = (event) => {
            setEditingReport(event.detail);
        };

        window.addEventListener('rateReport', handleRateReport);
        window.addEventListener('editReport', handleEditReport);
        
        return () => {
            window.removeEventListener('rateReport', handleRateReport);
            window.removeEventListener('editReport', handleEditReport);
        };
    }, []);

    const handleReportCreated = () => {
        setShowReportForm(false);
        loadReports();
    };

    const handleReportUpdated = () => {
        setEditingReport(null);
        loadReports();
    };

    const handleRatingSubmitted = () => {
        setShowRatingModal(false);
        setRatingReport(null);
        if (user.role === 'student') {
            // Reload student data if they're on student dashboard
            window.location.reload(); // Simple refresh for now
        } else {
            loadReports();
        }
    };

    // Download Excel function for program leader
    const downloadExcel = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/reports/export/excel', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to download Excel');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lecture-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            setError('Failed to download Excel: ' + error.message);
        }
    };

    // Statistics for program leader
    const getProgramLeaderStats = () => {
        const forwardedReports = reports.filter(report => report.status === 'forwarded');
        return { 
            totalForwarded: forwardedReports.length,
            pendingReview: forwardedReports.length
        };
    };

    // Lecturer-specific statistics
    const getLecturerStats = () => {
        const myReports = reports.filter(report => report.lecturer_id === user.id);
        const pendingReports = myReports.filter(report => report.status === 'pending');
        const approvedReports = myReports.filter(report => report.status === 'approved');
        const forwardedReports = myReports.filter(report => report.status === 'forwarded');
        const rejectedReports = myReports.filter(report => report.status === 'rejected');
        
        // Calculate average rating for lecturer's reports
        const ratedReports = myReports.filter(report => report.average_rating > 0);
        const averageRating = ratedReports.length > 0 
            ? ratedReports.reduce((sum, report) => sum + report.average_rating, 0) / ratedReports.length 
            : 0;

        // Calculate attendance statistics
        const totalAttendance = myReports.reduce((sum, report) => {
            if (report.total_registered_students > 0) {
                return sum + (report.actual_students_present / report.total_registered_students);
            }
            return sum;
        }, 0);
        const averageAttendance = myReports.length > 0 ? (totalAttendance / myReports.length) * 100 : 0;

        return {
            totalReports: myReports.length,
            pendingReview: pendingReports.length,
            approved: approvedReports.length,
            forwarded: forwardedReports.length,
            rejected: rejectedReports.length,
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings: ratedReports.length,
            averageAttendance: Math.round(averageAttendance),
            totalClasses: myClasses.length
        };
    };

    // Student-specific statistics (for basic view)
    const getStudentStats = () => {
        const totalClasses = reports.length;
        const ratedClasses = reports.filter(report => 
            report.my_rating !== null && report.my_rating !== undefined
        ).length;
        
        const attendanceRate = reports.length > 0 ? 
            reports.reduce((sum, report) => {
                if (report.total_registered_students > 0) {
                    return sum + (report.actual_students_present / report.total_registered_students);
                }
                return sum;
            }, 0) / reports.length * 100 : 0;
        
        return { 
            totalClasses, 
            ratedClasses, 
            attendanceRate: Math.round(attendanceRate) 
        };
    };

    const programLeaderStats = user.role === 'program_leader' ? getProgramLeaderStats() : {};
    const lecturerStats = user.role === 'lecturer' ? getLecturerStats() : {};
    const studentStats = user.role === 'student' ? getStudentStats() : {};

    // Student can only rate approved/forwarded reports
    const canRateReport = (report) => {
        return user.role === 'student' && 
               report.status && 
               (report.status === 'approved' || report.status === 'forwarded');
    };

    // Only lecturers can create reports
    const canCreateReport = user.role === 'lecturer';

    // Only principal lecturers and program leaders can edit
    const canEditReport = (report) => {
        return user.role === 'principal_lecturer' || user.role === 'program_leader';
    };

    // Check if lecturer can edit their own report (only if it's pending)
    const canLecturerEditReport = (report) => {
        return user.role === 'lecturer' && 
               report.lecturer_id === user.id && 
               report.status === 'pending';
    };

    // Render Classes tab content for lecturers
    const renderLecturerClasses = () => {
        if (myClasses.length === 0) {
            return (
                <div className="text-center py-5">
                    <i className="bi bi-people display-1 text-muted"></i>
                    <h4 className="mt-3 text-muted">No Classes Assigned</h4>
                    <p className="text-muted">You are not currently assigned to any classes.</p>
                </div>
            );
        }

        return (
            <div className="row">
                <div className="col-12">
                    <h4 className="mb-4">My Classes</h4>
                    <div className="row">
                        {myClasses.map(classItem => (
                            <div key={classItem.id} className="col-md-6 col-lg-4 mb-4">
                                <div className="card h-100">
                                    <div className="card-header bg-primary text-white">
                                        <h5 className="card-title mb-0">{classItem.class_name}</h5>
                                    </div>
                                    <div className="card-body">
                                        <p className="card-text">
                                            <strong>Course:</strong> {classItem.course_name}<br/>
                                            <strong>Code:</strong> {classItem.course_code}<br/>
                                            <strong>Students:</strong> {classItem.total_students || 0}<br/>
                                            <strong>Semester:</strong> {classItem.semester}<br/>
                                            <strong>Academic Year:</strong> {classItem.academic_year}
                                        </p>
                                    </div>
                                    <div className="card-footer">
                                        <small className="text-muted">
                                            Class Code: {classItem.class_code}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Render Monitoring tab content for lecturers
    const renderLecturerMonitoring = () => {
        return (
            <div className="row">
                <div className="col-12">
                    <h4 className="mb-4">Teaching Performance Overview</h4>
                    
                    {/* Quick Stats */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <div className="card bg-primary text-white">
                                <div className="card-body text-center">
                                    <h3>{lecturerStats.totalReports}</h3>
                                    <p>Total Reports</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-success text-white">
                                <div className="card-body text-center">
                                    <h3>{lecturerStats.averageRating}/5</h3>
                                    <p>Average Rating</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-info text-white">
                                <div className="card-body text-center">
                                    <h3>{lecturerStats.averageAttendance}%</h3>
                                    <p>Avg Attendance</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-warning text-dark">
                                <div className="card-body text-center">
                                    <h3>{lecturerStats.totalClasses}</h3>
                                    <p>Classes Teaching</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Status Overview */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Report Status Distribution</h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col">
                                    <div className="border rounded p-3">
                                        <h4 className="text-warning">{lecturerStats.pendingReview}</h4>
                                        <p>Pending Review</p>
                                    </div>
                                </div>
                                <div className="col">
                                    <div className="border rounded p-3">
                                        <h4 className="text-success">{lecturerStats.approved}</h4>
                                        <p>Approved</p>
                                    </div>
                                </div>
                                <div className="col">
                                    <div className="border rounded p-3">
                                        <h4 className="text-info">{lecturerStats.forwarded}</h4>
                                        <p>Forwarded</p>
                                    </div>
                                </div>
                                <div className="col">
                                    <div className="border rounded p-3">
                                        <h4 className="text-danger">{lecturerStats.rejected}</h4>
                                        <p>Rejected</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Recent Report Activity</h5>
                        </div>
                        <div className="card-body">
                            {reports.filter(r => r.lecturer_id === user.id).slice(0, 5).map(report => (
                                <div key={report.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                                    <div>
                                        <strong>{report.course_name}</strong> - {report.class_name}
                                        <br/>
                                        <small className="text-muted">
                                            {new Date(report.date_of_lecture).toLocaleDateString()} • 
                                            Status: <span className={`badge bg-${
                                                report.status === 'approved' ? 'success' :
                                                report.status === 'pending' ? 'warning' :
                                                report.status === 'forwarded' ? 'info' : 'danger'
                                            }`}>{report.status}</span>
                                        </small>
                                    </div>
                                    <div className="text-end">
                                        {report.average_rating > 0 && (
                                            <div>
                                                <small className="text-warning">
                                                    <i className="bi bi-star-fill"></i> {report.average_rating}/5
                                                </small>
                                            </div>
                                        )}
                                        <small className="text-muted">
                                            {report.actual_students_present}/{report.total_registered_students} students
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render Rating tab content for lecturers
    const renderLecturerRatings = () => {
        if (reportRatings.length === 0) {
            return (
                <div className="text-center py-5">
                    <i className="bi bi-star display-1 text-muted"></i>
                    <h4 className="mt-3 text-muted">No Ratings Yet</h4>
                    <p className="text-muted">Student ratings for your reports will appear here.</p>
                </div>
            );
        }

        return (
            <div className="row">
                <div className="col-12">
                    <h4 className="mb-4">Student Ratings & Feedback</h4>
                    
                    {reportRatings.map(rating => (
                        <div key={rating.id} className="card mb-3">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-8">
                                        <h6 className="card-title">{rating.course_name} - {rating.class_name}</h6>
                                        <p className="card-text mb-1">
                                            <strong>Date:</strong> {new Date(rating.date_of_lecture).toLocaleDateString()}
                                        </p>
                                        {rating.feedback && (
                                            <p className="card-text">
                                                <strong>Feedback:</strong> "{rating.feedback}"
                                            </p>
                                        )}
                                        <small className="text-muted">
                                            Rated by: {rating.student_name}
                                        </small>
                                    </div>
                                    <div className="col-md-4 text-end">
                                        <div className="display-4 text-warning">
                                            {rating.rating}.0
                                        </div>
                                        <div className="text-muted">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <i 
                                                    key={i} 
                                                    className={`bi bi-star${i < rating.rating ? '-fill' : ''} ${i < rating.rating ? 'text-warning' : 'text-muted'}`}
                                                ></i>
                                            ))}
                                        </div>
                                        <small className="text-muted">
                                            {new Date(rating.created_at).toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render Reports tab content for lecturers
    const renderLecturerReports = () => {
        return (
            <>
                {showReportForm && canCreateReport ? (
                    <ReportForm 
                        user={user}
                        onReportCreated={handleReportCreated}
                        onCancel={() => setShowReportForm(false)}
                    />
                ) : editingReport && canLecturerEditReport(editingReport) ? (
                    <ReportEditForm 
                        report={editingReport}
                        user={user}
                        onUpdate={handleReportUpdated}
                        onCancel={() => setEditingReport(null)}
                    />
                ) : (
                    <ReportList 
                        reports={reports.filter(report => report.lecturer_id === user.id)} 
                        user={user}
                        onEditReport={canLecturerEditReport ? setEditingReport : null}
                        onRateReport={null}
                        canEditReport={canLecturerEditReport}
                        canRateReport={false}
                    />
                )}
            </>
        );
    };

    // Render appropriate content based on active tab and user role
    const renderContent = () => {
        // STUDENT VIEW - Enhanced Dashboard
        if (user.role === 'student') {
            return <StudentDashboard user={user} />;
        }

        // PRINCIPAL LECTURER VIEW - Enhanced Dashboard
        if (user.role === 'principal_lecturer') {
            return <PrincipalLectureDashboard user={user} />;
        }

        // LECTURER VIEW - Enhanced with Tabs
        if (user.role === 'lecturer') {
            switch (activeTab) {
                case 'classes':
                    return renderLecturerClasses();
                case 'monitoring':
                    return renderLecturerMonitoring();
                case 'rating':
                    return renderLecturerRatings();
                case 'reports':
                default:
                    return renderLecturerReports();
            }
        }

        // PROGRAM LEADER VIEW - Only show management tabs, NO report creation
        if (user.role === 'program_leader') {
            switch (activeTab) {
                case 'courses':
                    return <CourseManagement user={user} />;
                case 'classes':
                    return <ClassManagement user={user} />;
                case 'enrollment':
                    return <EnrollmentManagement user={user} />;
                case 'reports':
                default:
                    // Program Leaders only view and manage reports, cannot create them
                    return (
                        <ReportList 
                            reports={reports} 
                            user={user}
                            onEditReport={canEditReport ? setEditingReport : null}
                            onRateReport={null}
                            canEditReport={canEditReport}
                            canRateReport={false}
                        />
                    );
            }
        }

        // Default view (should not reach here)
        return (
            <div className="alert alert-warning">
                No content available for your role.
            </div>
        );
    };

    return (
        <div className="container">
            {/* Dashboard Header - Hide for students and principal lecturers (they have their own header) */}
            {!['student', 'principal_lecturer'].includes(user.role) && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">Welcome, {user.name}</h2>
                                <p className="text-muted mb-0">
                                    {user.role === 'lecturer' && 'Manage your classes, reports, and track your teaching performance'}
                                    {user.role === 'program_leader' && 'Manage courses, classes, enrollments, and review forwarded reports'}
                                </p>
                            </div>
                            <div className="d-flex gap-2">
                                {user.role === 'program_leader' && activeTab === 'reports' && (
                                    <button 
                                        className="btn btn-success"
                                        onClick={downloadExcel}
                                        disabled={reports.filter(r => r.status === 'forwarded').length === 0}
                                    >
                                        <i className="bi bi-download me-2"></i>
                                        Download Excel
                                    </button>
                                )}
                                {/* Only show New Report button for LECTURERS on reports tab */}
                                {canCreateReport && user.role === 'lecturer' && activeTab === 'reports' && (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => setShowReportForm(true)}
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        New Report
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lecturer Tabs - Only show for lecturers */}
            {user.role === 'lecturer' && (
                <div className="row mb-4">
                    <div className="col-12">
                        <ul className="nav nav-tabs">
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('reports')}
                                >
                                    <i className="bi bi-journal-text me-2"></i>
                                    Reports
                                    {lecturerStats.pendingReview > 0 && (
                                        <span className="badge bg-warning ms-2">
                                            {lecturerStats.pendingReview}
                                        </span>
                                    )}
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'classes' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('classes')}
                                >
                                    <i className="bi bi-people me-2"></i>
                                    My Classes
                                    {lecturerStats.totalClasses > 0 && (
                                        <span className="badge bg-primary ms-2">
                                            {lecturerStats.totalClasses}
                                        </span>
                                    )}
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
                                    className={`nav-link ${activeTab === 'rating' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('rating')}
                                >
                                    <i className="bi bi-star me-2"></i>
                                    Ratings
                                    {lecturerStats.totalRatings > 0 && (
                                        <span className="badge bg-warning ms-2">
                                            {lecturerStats.totalRatings}
                                        </span>
                                    )}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Program Leader Tabs - Only show for program leaders */}
            {user.role === 'program_leader' && (
                <div className="row mb-4">
                    <div className="col-12">
                        <ul className="nav nav-tabs">
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('reports')}
                                >
                                    <i className="bi bi-journal-text me-2"></i>
                                    Reports
                                    {programLeaderStats.totalForwarded > 0 && (
                                        <span className="badge bg-danger ms-2">
                                            {programLeaderStats.totalForwarded}
                                        </span>
                                    )}
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('courses')}
                                >
                                    <i className="bi bi-book me-2"></i>
                                    Courses
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
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'enrollment' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('enrollment')}
                                >
                                    <i className="bi bi-person-plus me-2"></i>
                                    Enroll Students
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Statistics Cards - Show for lecturers on monitoring tab, others on reports tab */}
            {(activeTab === 'reports' && !['student', 'principal_lecturer'].includes(user.role)) || 
             (user.role === 'lecturer' && activeTab === 'monitoring') ? (
                <>
                    {/* Program Leader Stats */}
                    {user.role === 'program_leader' && (
                        <div className="row mb-4">
                            <div className="col-md-4">
                                <div className="card bg-primary text-white shadow">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h4 className="card-title">{programLeaderStats.totalForwarded || 0}</h4>
                                                <p className="card-text mb-0">Forwarded Reports</p>
                                            </div>
                                            <i className="bi bi-send display-6 opacity-50"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card bg-warning text-dark shadow">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h4 className="card-title">{programLeaderStats.pendingReview || 0}</h4>
                                                <p className="card-text mb-0">Pending Review</p>
                                            </div>
                                            <i className="bi bi-clock display-6 opacity-50"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card bg-success text-white shadow">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h4 className="card-title">{programLeaderStats.totalForwarded || 0}</h4>
                                                <p className="card-text mb-0">Total Forwarded</p>
                                            </div>
                                            <i className="bi bi-check-circle display-6 opacity-50"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lecturer Stats */}
                    {user.role === 'lecturer' && activeTab === 'reports' && (
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card bg-primary text-white shadow">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h4 className="card-title">{lecturerStats.totalReports || 0}</h4>
                                                <p className="card-text mb-0">Total Reports</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-3">
                                <div className="card bg-warning text-dark shadow">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h4 className="card-title">{lecturerStats.pendingReview || 0}</h4>
                                                <p className="card-text mb-0">Pending Review</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-3">
                                <div className="card bg-success text-white shadow">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h4 className="card-title">{lecturerStats.approved || 0}</h4>
                                                <p className="card-text mb-0">Approved</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-info text-white shadow">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h4 className="card-title">{lecturerStats.forwarded || 0}</h4>
                                                <p className="card-text mb-0">Forwarded</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : null}

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setError('')}
                    ></button>
                </div>
            )}

            {/* Loading Spinner - Only for reports tab and specific roles */}
            {loading && activeTab === 'reports' && !['student', 'principal_lecturer'].includes(user.role) && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">
                        Loading reports...
                    </p>
                </div>
            )}

            {/* Main Content */}
            {!loading || activeTab !== 'reports' || ['student', 'principal_lecturer'].includes(user.role) ? renderContent() : null}

            {/* Rating Modal - For all users who can rate */}
            {(user.role === 'student' || canRateReport(ratingReport)) && (
                <RatingModal
                    report={ratingReport}
                    show={showRatingModal}
                    onClose={() => setShowRatingModal(false)}
                    onRatingSubmitted={handleRatingSubmitted}
                />
            )}

            {/* Report Edit Form - For principal lecturers and program leaders */}
            {editingReport && (canEditReport(editingReport) || canLecturerEditReport(editingReport)) && (
                <ReportEditForm 
                    report={editingReport}
                    user={user}
                    onUpdate={handleReportUpdated}
                    onCancel={() => setEditingReport(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;