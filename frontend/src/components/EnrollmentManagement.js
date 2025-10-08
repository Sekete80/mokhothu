import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const EnrollmentManagement = ({ user }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    
    const [enrollForm, setEnrollForm] = useState({
        student_id: '',
        class_id: ''
    });

    const [stats, setStats] = useState({
        total_enrollments: 0,
        unique_students: 0,
        active_classes: 0
    });

    const loadEnrollments = async () => {
        try {
            setLoading(true);
            const result = await ApiService.getEnrollments();
            console.log('Enrollments loaded:', result.data);
            setEnrollments(result.data || []);
        } catch (error) {
            setError('Failed to load enrollments: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableStudents = async () => {
        try {
            const result = await ApiService.getAvailableStudents();
            setAvailableStudents(result.data || []);
        } catch (error) {
            console.error('Failed to load students:', error);
        }
    };

    const loadClasses = async () => {
        try {
            const result = await ApiService.getClasses();
            setClasses(result.data || []);
        } catch (error) {
            console.error('Failed to load classes:', error);
        }
    };

    const loadStats = async () => {
        try {
            // This would call a stats endpoint if available
            const enrollmentsResult = await ApiService.getEnrollments();
            const enrollmentsData = enrollmentsResult.data || [];
            
            const uniqueStudents = new Set(enrollmentsData.map(e => e.student_id)).size;
            const uniqueClasses = new Set(enrollmentsData.map(e => e.class_id)).size;
            
            setStats({
                total_enrollments: enrollmentsData.length,
                unique_students: uniqueStudents,
                active_classes: uniqueClasses
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    useEffect(() => {
        loadEnrollments();
        loadAvailableStudents();
        loadClasses();
        loadStats();
    }, []);

    const handleEnrollSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');
            
            const result = await ApiService.enrollStudent(enrollForm);
            
            setSuccess(result.message || 'Student enrolled successfully!');
            setShowEnrollForm(false);
            setEnrollForm({ student_id: '', class_id: '' });
            
            // Reload data
            loadEnrollments();
            loadAvailableStudents();
            loadStats();
            
        } catch (error) {
            setError(error.message || 'Failed to enroll student');
        }
    };

    const handleDeleteEnrollment = async (enrollmentId, studentName, className) => {
        if (window.confirm(`Are you sure you want to remove ${studentName} from ${className}?`)) {
            try {
                await ApiService.deleteEnrollment(enrollmentId);
                setSuccess('Student removed from class successfully');
                loadEnrollments();
                loadAvailableStudents();
                loadStats();
            } catch (error) {
                setError('Failed to remove enrollment: ' + error.message);
            }
        }
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading enrollments...</p>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4>Enrollment Management</h4>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowEnrollForm(true)}
                        disabled={user.role !== 'program_leader' && user.role !== 'principal_lecturer'}
                    >
                        <i className="bi bi-person-plus me-2"></i>
                        Enroll Student
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="card bg-primary text-white">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h4>{stats.total_enrollments}</h4>
                                        <p className="mb-0">Total Enrollments</p>
                                    </div>
                                    <div className="align-self-center">
                                        <i className="bi bi-people fs-1"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-success text-white">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h4>{stats.unique_students}</h4>
                                        <p className="mb-0">Unique Students</p>
                                    </div>
                                    <div className="align-self-center">
                                        <i className="bi bi-person-check fs-1"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-info text-white">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h4>{stats.active_classes}</h4>
                                        <p className="mb-0">Active Classes</p>
                                    </div>
                                    <div className="align-self-center">
                                        <i className="bi bi-book fs-1"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {error}
                        <button type="button" className="btn-close" onClick={clearMessages}></button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {success}
                        <button type="button" className="btn-close" onClick={clearMessages}></button>
                    </div>
                )}

                {/* Enrollments List */}
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Current Enrollments</h5>
                    </div>
                    <div className="card-body">
                        {enrollments.length === 0 ? (
                            <div className="text-center py-4">
                                <i className="bi bi-people display-1 text-muted"></i>
                                <h5 className="mt-3 text-muted">No Enrollments Found</h5>
                                <p className="text-muted">Get started by enrolling students in classes.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Class</th>
                                            <th>Course</th>
                                            <th>Lecturer</th>
                                            <th>Enrollment Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollments.map(enrollment => (
                                            <tr key={enrollment.id}>
                                                <td>
                                                    <div>
                                                        <strong>{enrollment.student_name}</strong>
                                                        <br />
                                                        <small className="text-muted">{enrollment.student_email}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{enrollment.class_code}</strong>
                                                        <br />
                                                        <small className="text-muted">{enrollment.class_name}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    {enrollment.course_name ? (
                                                        <div>
                                                            <strong>{enrollment.course_code}</strong>
                                                            <br />
                                                            <small className="text-muted">{enrollment.course_name}</small>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">No course</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {enrollment.lecturer_name ? (
                                                        enrollment.lecturer_name
                                                    ) : (
                                                        <span className="text-muted">Not assigned</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <span className="badge bg-success">Active</span>
                                                </td>
                                                <td>
                                                    {(user.role === 'program_leader' || user.role === 'principal_lecturer') && (
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleDeleteEnrollment(
                                                                enrollment.id, 
                                                                enrollment.student_name, 
                                                                enrollment.class_name
                                                            )}
                                                            title="Remove Enrollment"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enroll Student Modal */}
                {showEnrollForm && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Enroll Student in Class</h5>
                                    <button 
                                        type="button" 
                                        className="btn-close"
                                        onClick={() => {
                                            setShowEnrollForm(false);
                                            setEnrollForm({ student_id: '', class_id: '' });
                                            clearMessages();
                                        }}
                                    ></button>
                                </div>
                                <form onSubmit={handleEnrollSubmit}>
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Select Student *</label>
                                                    <select
                                                        className="form-select"
                                                        name="student_id"
                                                        value={enrollForm.student_id}
                                                        onChange={(e) => setEnrollForm({
                                                            ...enrollForm,
                                                            student_id: e.target.value
                                                        })}
                                                        required
                                                    >
                                                        <option value="">Choose Student...</option>
                                                        {availableStudents.map(student => (
                                                            <option key={student.id} value={student.id}>
                                                                {student.name} - {student.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="form-text">
                                                        {availableStudents.length} students available for enrollment
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Select Class *</label>
                                                    <select
                                                        className="form-select"
                                                        name="class_id"
                                                        value={enrollForm.class_id}
                                                        onChange={(e) => setEnrollForm({
                                                            ...enrollForm,
                                                            class_id: e.target.value
                                                        })}
                                                        required
                                                    >
                                                        <option value="">Choose Class...</option>
                                                        {classes.map(classItem => (
                                                            <option key={classItem.id} value={classItem.id}>
                                                                {classItem.class_code} - {classItem.class_name} 
                                                                {classItem.enrolled_count !== undefined && 
                                                                    ` (${classItem.enrolled_count}/${classItem.max_students} enrolled)`
                                                                }
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="form-text">
                                                        {classes.length} classes available
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {enrollForm.class_id && enrollForm.student_id && (
                                            <div className="alert alert-info">
                                                <h6>Enrollment Summary:</h6>
                                                <strong>Student:</strong> {
                                                    availableStudents.find(s => s.id == enrollForm.student_id)?.name
                                                }<br />
                                                <strong>Class:</strong> {
                                                    classes.find(c => c.id == enrollForm.class_id)?.class_name
                                                }<br />
                                                <strong>Course:</strong> {
                                                    classes.find(c => c.id == enrollForm.class_id)?.course_name || 'No course assigned'
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowEnrollForm(false);
                                                setEnrollForm({ student_id: '', class_id: '' });
                                                clearMessages();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={!enrollForm.student_id || !enrollForm.class_id}
                                        >
                                            Enroll Student
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnrollmentManagement;