
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const StudentDashboard = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const loadStudentData = async () => {
        try {
            setLoading(true);
            
            // Load reports that student can see and rate
            const reportsResult = await ApiService.getReports();
            setReports(reportsResult.data || []);
            
            // TODO: Load student enrollments when endpoint is available
            // const enrollmentsResult = await ApiService.getStudentEnrollments();
            // setEnrollments(enrollmentsResult.data || []);
            
        } catch (error) {
            setError('Failed to load student data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudentData();
    }, [user]);

    // Calculate student statistics
    const calculateStats = () => {
        const totalClasses = reports.length;
        const ratedClasses = reports.filter(report => 
            report.my_rating !== null && report.my_rating !== undefined
        ).length;
        
        const pendingRatings = totalClasses - ratedClasses;
        
        // Calculate average rating given by student
        const studentRatings = reports
            .filter(report => report.my_rating)
            .map(report => report.my_rating);
        const averageRating = studentRatings.length > 0 
            ? (studentRatings.reduce((a, b) => a + b, 0) / studentRatings.length).toFixed(1)
            : 0;

        // Calculate attendance statistics
        const attendanceData = reports.map(report => {
            if (report.total_registered_students > 0) {
                return {
                    attendanceRate: (report.actual_students_present / report.total_registered_students) * 100,
                    date: report.date_of_lecture,
                    course: report.course_name
                };
            }
            return null;
        }).filter(Boolean);

        const averageAttendance = attendanceData.length > 0 
            ? attendanceData.reduce((sum, data) => sum + data.attendanceRate, 0) / attendanceData.length
            : 0;

        return {
            totalClasses,
            ratedClasses,
            pendingRatings,
            averageRating,
            averageAttendance: Math.round(averageAttendance),
            attendanceData
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
        <div className="student-dashboard">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">Welcome back, {user.name}!</h2>
                            <p className="text-muted mb-0">
                                Track your classes, rate lectures, and monitor your progress
                            </p>
                        </div>
                        <div className="text-end">
                            <div className="badge bg-primary fs-6">
                                Student Portal
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

            {/* Student Tabs */}
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
                                className={`nav-link ${activeTab === 'classes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('classes')}
                            >
                                <i className="bi bi-journal-text me-2"></i>
                                Available Classes
                                {reports.length > 0 && (
                                    <span className="badge bg-primary ms-2">{reports.length}</span>
                                )}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'ratings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ratings')}
                            >
                                <i className="bi bi-star me-2"></i>
                                My Ratings
                                {stats.ratedClasses > 0 && (
                                    <span className="badge bg-warning ms-2">{stats.ratedClasses}</span>
                                )}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'progress' ? 'active' : ''}`}
                                onClick={() => setActiveTab('progress')}
                            >
                                <i className="bi bi-graph-up me-2"></i>
                                My Progress
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
                                    <h3>{stats.totalClasses}</h3>
                                    <p className="mb-0">Available Classes</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card bg-success text-white shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-star display-4 mb-3"></i>
                                    <h3>{stats.ratedClasses}</h3>
                                    <p className="mb-0">Classes Rated</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card bg-warning text-dark shadow">
                                <div className="card-body text-center">
                                    <i className="bi bi-clock display-4 mb-3"></i>
                                    <h3>{stats.pendingRatings}</h3>
                                    <p className="mb-0">Pending Ratings</p>
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

                        {/* Rating Progress */}
                        <div className="col-md-6 mb-4">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Rating Progress</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span>Classes Rated</span>
                                        <span>{stats.ratedClasses}/{stats.totalClasses}</span>
                                    </div>
                                    <div className="progress" style={{height: '20px'}}>
                                        <div 
                                            className="progress-bar bg-success" 
                                            style={{width: `${stats.totalClasses > 0 ? (stats.ratedClasses / stats.totalClasses) * 100 : 0}%`}}
                                        >
                                            {stats.totalClasses > 0 ? Math.round((stats.ratedClasses / stats.totalClasses) * 100) : 0}%
                                        </div>
                                    </div>
                                    <small className="text-muted mt-2 d-block">
                                        {stats.pendingRatings > 0 
                                            ? `You have ${stats.pendingRatings} classes waiting for your rating`
                                            : 'Great job! You have rated all available classes'
                                        }
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Average Rating */}
                        <div className="col-md-6 mb-4">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">My Average Rating</h5>
                                </div>
                                <div className="card-body text-center">
                                    {stats.averageRating > 0 ? (
                                        <>
                                            <div className="display-4 text-warning mb-2">
                                                {stats.averageRating}
                                            </div>
                                            <div className="mb-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <i 
                                                        key={i}
                                                        className={`bi bi-star${i < Math.floor(stats.averageRating) ? '-fill' : ''} ${i < stats.averageRating ? 'text-warning' : 'text-muted'}`}
                                                    ></i>
                                                ))}
                                            </div>
                                            <small className="text-muted">
                                                Based on {stats.ratedClasses} ratings
                                            </small>
                                        </>
                                    ) : (
                                        <div className="text-muted py-4">
                                            <i className="bi bi-star display-1"></i>
                                            <p className="mt-2">No ratings given yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="col-12">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Recent Available Classes</h5>
                                </div>
                                <div className="card-body">
                                    {reports.slice(0, 5).map(report => (
                                        <div key={report.id} className="border-bottom pb-2 mb-2">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="mb-1">{report.course_name}</h6>
                                                    <p className="text-muted mb-1 small">
                                                        {report.lecturer_name} • {new Date(report.date_of_lecture).toLocaleDateString()}
                                                    </p>
                                                    <span className={`badge ${report.status === 'approved' ? 'bg-success' : 'bg-info'}`}>
                                                        {report.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    {report.my_rating ? (
                                                        <span className="badge bg-warning">
                                                            Rated: {report.my_rating}/5
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-secondary">
                                                            Not Rated
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {reports.length === 0 && (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-journal-x display-1"></i>
                                            <p className="mt-2">No classes available for rating</p>
                                        </div>
                                    )}
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
                                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Available Classes for Rating</h5>
                                    <span className="badge bg-primary">{reports.length} classes</span>
                                </div>
                                <div className="card-body">
                                    {reports.length > 0 ? (
                                        <div className="row">
                                            {reports.map(report => (
                                                <div key={report.id} className="col-md-6 mb-3">
                                                    <div className="card h-100">
                                                        <div className="card-header d-flex justify-content-between align-items-center">
                                                            <strong>{report.course_name}</strong>
                                                            <span className={`badge ${report.status === 'approved' ? 'bg-success' : 'bg-info'}`}>
                                                                {report.status}
                                                            </span>
                                                        </div>
                                                        <div className="card-body">
                                                            <p className="card-text">
                                                                <strong>Lecturer:</strong> {report.lecturer_name}<br/>
                                                                <strong>Date:</strong> {new Date(report.date_of_lecture).toLocaleDateString()}<br/>
                                                                <strong>Time:</strong> {report.scheduled_time}<br/>
                                                                <strong>Venue:</strong> {report.venue}<br/>
                                                                <strong>Attendance:</strong> {report.actual_students_present}/{report.total_registered_students} students
                                                            </p>
                                                            <p className="card-text">
                                                                <strong>Topic:</strong> {report.topic_taught}
                                                            </p>
                                                        </div>
                                                        <div className="card-footer">
                                                            {report.my_rating ? (
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <span className="text-warning">
                                                                        <i className="bi bi-star-fill"></i> Rated: {report.my_rating}/5
                                                                    </span>
                                                                    <button className="btn btn-outline-warning btn-sm" disabled>
                                                                        Already Rated
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    className="btn btn-warning w-100"
                                                                    onClick={() => {
                                                                        // This would open the rating modal
                                                                        // We'll integrate this with the existing rating system
                                                                        window.dispatchEvent(new CustomEvent('rateReport', { detail: report }));
                                                                    }}
                                                                >
                                                                    <i className="bi bi-star me-2"></i>
                                                                    Rate This Class
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-journal-x display-1"></i>
                                            <h5 className="mt-3">No Classes Available</h5>
                                            <p>There are no classes available for rating at the moment.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RATINGS TAB */}
                {activeTab === 'ratings' && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">My Rating History</h5>
                                </div>
                                <div className="card-body">
                                    {stats.ratedClasses > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Course</th>
                                                        <th>Lecturer</th>
                                                        <th>Date</th>
                                                        <th>My Rating</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports
                                                        .filter(report => report.my_rating)
                                                        .map(report => (
                                                            <tr key={report.id}>
                                                                <td>
                                                                    <strong>{report.course_name}</strong>
                                                                    <br/>
                                                                    <small className="text-muted">{report.course_code}</small>
                                                                </td>
                                                                <td>{report.lecturer_name}</td>
                                                                <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                                                                <td>
                                                                    <span className="text-warning">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <i 
                                                                                key={i}
                                                                                className={`bi bi-star${i < report.my_rating ? '-fill' : ''} ${i < report.my_rating ? 'text-warning' : 'text-muted'}`}
                                                                            ></i>
                                                                        ))}
                                                                        <span className="ms-2">({report.my_rating}/5)</span>
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${report.status === 'approved' ? 'bg-success' : 'bg-info'}`}>
                                                                        {report.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-star display-1"></i>
                                            <h5 className="mt-3">No Ratings Yet</h5>
                                            <p>You haven't rated any classes yet. Start by rating available classes!</p>
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => setActiveTab('classes')}
                                            >
                                                View Available Classes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PROGRESS TAB */}
                {activeTab === 'progress' && (
                    <div className="row">
                        <div className="col-md-8">
                            <div className="card shadow mb-4">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Attendance Trend</h5>
                                </div>
                                <div className="card-body">
                                    {stats.attendanceData.length > 0 ? (
                                        <div className="text-center py-4">
                                            {/* Simple attendance visualization */}
                                            <div className="mb-4">
                                                <h3 className="text-primary">{stats.averageAttendance}%</h3>
                                                <p className="text-muted">Average Class Attendance</p>
                                            </div>
                                            <div className="row">
                                                {stats.attendanceData.slice(0, 6).map((data, index) => (
                                                    <div key={index} className="col-2 text-center">
                                                        <div className="mb-2">
                                                            <div 
                                                                className="bg-info rounded mx-auto"
                                                                style={{
                                                                    width: '20px',
                                                                    height: `${data.attendanceRate}px`,
                                                                    maxHeight: '100px'
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <small className="text-muted">
                                                            {new Date(data.date).toLocaleDateString('en-US', { month: 'short' })}
                                                        </small>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-graph-up display-1"></i>
                                            <h5 className="mt-3">No Progress Data</h5>
                                            <p>Attendance data will appear here as you attend more classes.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Learning Summary</h5>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <h6>Courses Covered</h6>
                                        <ul className="list-unstyled">
                                            {[...new Set(reports.map(r => r.course_name))].slice(0, 5).map(course => (
                                                <li key={course} className="mb-1">
                                                    <i className="bi bi-check-circle text-success me-2"></i>
                                                    {course}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mb-3">
                                        <h6>Recent Topics</h6>
                                        <ul className="list-unstyled">
                                            {reports.slice(0, 3).map(report => (
                                                <li key={report.id} className="mb-1 small text-muted">
                                                    • {report.topic_taught.substring(0, 50)}...
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
