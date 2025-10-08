import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const ReportEditForm = ({ report, user, onUpdate, onCancel }) => {
    const [formData, setFormData] = useState({
        faculty_name: '',
        class_name: '',
        week_of_reporting: '',
        date_of_lecture: '',
        course_name: '',
        course_code: '',
        lecturer_name: '',
        actual_students_present: '',
        total_registered_students: '',
        venue: '',
        scheduled_time: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: '',
        principal_feedback: '',
        rating: '',
        status: 'pending'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (report) {
            setFormData({
                faculty_name: report.faculty_name || '',
                class_name: report.class_name || '',
                week_of_reporting: report.week_of_reporting || '',
                date_of_lecture: report.date_of_lecture || '',
                course_name: report.course_name || '',
                course_code: report.course_code || '',
                lecturer_name: report.lecturer_name || '',
                actual_students_present: report.actual_students_present || '',
                total_registered_students: report.total_registered_students || '',
                venue: report.venue || '',
                scheduled_time: report.scheduled_time || '',
                topic_taught: report.topic_taught || '',
                learning_outcomes: report.learning_outcomes || '',
                recommendations: report.recommendations || '',
                principal_feedback: report.principal_feedback || '',
                rating: report.rating || '',
                status: report.status || 'pending'
            });
        }
    }, [report]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await ApiService.updateReport(report.id, formData);
            onUpdate();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForwardToPL = async () => {
        setLoading(true);
        try {
            await ApiService.updateReport(report.id, {
                ...formData,
                status: 'forwarded'
            });
            onUpdate();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow">
            <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">
                    Edit Report - {report.course_code}
                </h5>
            </div>
            <div className="card-body">
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

                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Faculty Name</label>
                            <input
                                type="text"
                                className="form-control"
                                name="faculty_name"
                                value={formData.faculty_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Class Name</label>
                            <input
                                type="text"
                                className="form-control"
                                name="class_name"
                                value={formData.class_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Week of Reporting</label>
                            <input
                                type="text"
                                className="form-control"
                                name="week_of_reporting"
                                value={formData.week_of_reporting}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Date of Lecture</label>
                            <input
                                type="date"
                                className="form-control"
                                name="date_of_lecture"
                                value={formData.date_of_lecture}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Course Name</label>
                            <input
                                type="text"
                                className="form-control"
                                name="course_name"
                                value={formData.course_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Course Code</label>
                            <input
                                type="text"
                                className="form-control"
                                name="course_code"
                                value={formData.course_code}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Lecturer's Name</label>
                            <input
                                type="text"
                                className="form-control"
                                name="lecturer_name"
                                value={formData.lecturer_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label">Students Present</label>
                            <input
                                type="number"
                                className="form-control"
                                name="actual_students_present"
                                value={formData.actual_students_present}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label">Total Registered</label>
                            <input
                                type="number"
                                className="form-control"
                                name="total_registered_students"
                                value={formData.total_registered_students}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Venue</label>
                            <input
                                type="text"
                                className="form-control"
                                name="venue"
                                value={formData.venue}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Scheduled Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="scheduled_time"
                                value={formData.scheduled_time}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Topic Taught</label>
                        <textarea
                            className="form-control"
                            name="topic_taught"
                            value={formData.topic_taught}
                            onChange={handleChange}
                            rows="3"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Learning Outcomes</label>
                        <textarea
                            className="form-control"
                            name="learning_outcomes"
                            value={formData.learning_outcomes}
                            onChange={handleChange}
                            rows="3"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Recommendations</label>
                        <textarea
                            className="form-control"
                            name="recommendations"
                            value={formData.recommendations}
                            onChange={handleChange}
                            rows="3"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Principal Lecturer Feedback</label>
                        <textarea
                            className="form-control"
                            name="principal_feedback"
                            value={formData.principal_feedback}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Provide your feedback and recommendations..."
                        />
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Rating (1-5)</label>
                            <select
                                className="form-select"
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                            >
                                <option value="">Select Rating</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Fair</option>
                                <option value="3">3 - Good</option>
                                <option value="4">4 - Very Good</option>
                                <option value="5">5 - Excellent</option>
                            </select>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="forwarded">Forwarded to Program Leader</option>
                            </select>
                        </div>
                    </div>

                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button 
                            type="button" 
                            className="btn btn-secondary me-md-2"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        {user.role === 'principal_lecturer' && (
                            <button 
                                type="button" 
                                className="btn btn-info me-md-2"
                                onClick={handleForwardToPL}
                                disabled={loading}
                            >
                                Forward to Program Leader
                            </button>
                        )}
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Updating...
                                </>
                            ) : (
                                'Update Report'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportEditForm;