import React from 'react';

const ReportList = ({ reports, user, onEditReport, onRateReport, canEditReport, canRateReport }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { class: 'bg-warning', text: 'Pending' },
            approved: { class: 'bg-success', text: 'Approved' },
            rejected: { class: 'bg-danger', text: 'Rejected' },
            forwarded: { class: 'bg-info', text: 'Forwarded' }
        };
        
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const getRatingStars = (rating) => {
        if (!rating) return 'Not rated';
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const getAttendanceStatus = (present, total) => {
        const percentage = (present / total) * 100;
        if (percentage >= 80) return 'bg-success';
        if (percentage >= 60) return 'bg-warning';
        return 'bg-danger';
    };

    // Safe function to format average rating
    const formatAverageRating = (rating) => {
        if (!rating || isNaN(rating) || rating === 0) {
            return 'No ratings';
        }
        return typeof rating === 'number' ? rating.toFixed(1) : 'No ratings';
    };

    if (!reports || reports.length === 0) {
        return (
            <div className="card shadow">
                <div className="card-body text-center py-5">
                    <h5 className="mt-3 text-muted">
                        {user.role === 'student' ? 'No Class Reports Available' : 'No Reports Found'}
                    </h5>
                    <p className="text-muted">
                        {user.role === 'student' 
                            ? 'No approved class reports available for rating yet. Check back later.'
                            : 'No reports available for viewing.'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow">
            <div className="card-header bg-light">
                <h5 className="card-title mb-0">
                    {user.role === 'student' ? 'Available Classes for Rating' : 'Lecture Reports'} 
                    <span className="badge bg-primary ms-2">{reports.length}</span>
                </h5>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Course</th>
                                <th>Class</th>
                                <th>Date & Time</th>
                                {user.role !== 'student' && <th>Lecturer</th>}
                                <th>Venue</th>
                                <th>Attendance</th>
                                <th>Topic</th>
                                {user.role === 'student' ? (
                                    <>
                                        <th>Your Rating</th>
                                        <th>Action</th>
                                    </>
                                ) : (
                                    <>
                                        <th>Ratings</th>
                                        <th>Status</th>
                                        {(canEditReport) && <th>Actions</th>}
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id}>
                                    <td>
                                        <div>
                                            <strong className="text-primary">{report.course_code}</strong>
                                            <br />
                                            <small className="text-muted">{report.course_name}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-secondary">{report.class_name}</span>
                                    </td>
                                    <td>
                                        <div>
                                            <small>{formatDate(report.date_of_lecture)}</small>
                                            <br />
                                            <small className="text-muted">{formatTime(report.scheduled_time)}</small>
                                        </div>
                                    </td>
                                    {user.role !== 'student' && (
                                        <td>
                                            <small>{report.lecturer_name}</small>
                                        </td>
                                    )}
                                    <td>
                                        <small>{report.venue}</small>
                                    </td>
                                    <td>
                                        <div>
                                            <span className={`badge ${getAttendanceStatus(report.actual_students_present, report.total_registered_students)}`}>
                                                {report.actual_students_present}/{report.total_registered_students}
                                            </span>
                                            <br />
                                            <small className="text-muted">
                                                {Math.round((report.actual_students_present / report.total_registered_students) * 100)}%
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="topic-preview" title={report.topic_taught}>
                                            {report.topic_taught.length > 50 
                                                ? report.topic_taught.substring(0, 50) + '...'
                                                : report.topic_taught
                                            }
                                        </div>
                                    </td>
                                    
                                    {/* Student View */}
                                    {user.role === 'student' ? (
                                        <>
                                            <td>
                                                <small>
                                                    {report.my_rating ? (
                                                        <span className="text-success">
                                                            {getRatingStars(report.my_rating)}
                                                            <br />
                                                            <small>(Your rating)</small>
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">Not rated</span>
                                                    )}
                                                </small>
                                            </td>
                                            <td>
                                                {canRateReport && (
                                                    <button
                                                        className={`btn btn-sm ${report.my_rating ? 'btn-success' : 'btn-outline-primary'}`}
                                                        onClick={() => onRateReport(report)}
                                                        title={report.my_rating ? `Update your rating (currently ${report.my_rating}/5)` : "Rate this lecture"}
                                                    >
                                                        {report.my_rating ? 'Update Rating' : 'Rate Class'}
                                                    </button>
                                                )}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>
                                                <small>
                                                    {report.rating ? (
                                                        <span title={`Principal Rating: ${report.rating}/5`}>
                                                            PL: {getRatingStars(report.rating)}
                                                        </span>
                                                    ) : (
                                                        'Not rated'
                                                    )}
                                                    {/* FIXED: Safe average rating display */}
                                                    {report.average_rating && report.average_rating > 0 ? (
                                                        <div className="text-muted" title={`Student Average: ${formatAverageRating(report.average_rating)}/5`}>
                                                            Students: {formatAverageRating(report.average_rating)} ⭐
                                                        </div>
                                                    ) : (
                                                        <div className="text-muted">
                                                            Students: No ratings
                                                        </div>
                                                    )}
                                                </small>
                                            </td>
                                            <td>
                                                {getStatusBadge(report.status)}
                                                {report.principal_feedback && (
                                                    <div>
                                                        <small className="text-muted" title={report.principal_feedback}>
                                                            ✓ Has feedback
                                                        </small>
                                                    </div>
                                                )}
                                            </td>
                                            {canEditReport && (
                                                <td>
                                                    <button
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => onEditReport(report)}
                                                        title="Edit Report"
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            )}
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportList;