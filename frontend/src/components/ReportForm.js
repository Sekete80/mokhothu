// TODO: implement
import React, { useState } from 'react';
import ApiService from '../services/api';

const ReportForm = ({ user, onReportCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        faculty_name: 'Faculty of Science and Technology',
        class_name: '',
        week_of_reporting: '',
        date_of_lecture: '',
        course_name: '',
        course_code: '',
        lecturer_name: user.name,
        actual_students_present: '',
        total_registered_students: '',
        venue: '',
        scheduled_time: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            await ApiService.createReport(formData);
            onReportCreated();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow">
            <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                    <i className="bi bi-plus-circle me-2"></i>
                    Submit New Lecture Report
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
                                placeholder="e.g., CS-3A, MBA-2B"
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
                                placeholder="e.g., Week 5, Semester 1"
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
                                placeholder="e.g., Database Management Systems"
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
                                placeholder="e.g., CS301, MBA501"
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
                                placeholder="e.g., Room 101, Lab A"
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
                            placeholder="Describe the main topic covered in this lecture..."
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
                            placeholder="What should students be able to do after this lecture?"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Recommendations</label>
                        <textarea
                            className="form-control"
                            name="recommendations"
                            value={formData.recommendations}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Any recommendations for improvement or follow-up actions..."
                            required
                        />
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
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Report'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportForm;