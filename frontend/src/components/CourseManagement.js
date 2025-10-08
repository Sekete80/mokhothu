import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const CourseManagement = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [courseForm, setCourseForm] = useState({
        course_code: '',
        course_name: '',
        description: '',
        credits: 3,
        faculty: ''
    });

    const [assignmentForm, setAssignmentForm] = useState({
        lecturer_id: '',
        module_name: ''
    });

    const loadCourses = async () => {
        try {
            setLoading(true);
            const result = await ApiService.request('/courses');
            setCourses(result.data || []);
        } catch (error) {
            setError('Failed to load courses: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadLecturers = async () => {
        try {
            const result = await ApiService.request('/users');
            const lecturerList = result.data.filter(u => 
                u.role === 'lecturer' || u.role === 'principal_lecturer'
            );
            setLecturers(lecturerList);
        } catch (error) {
            console.error('Failed to load lecturers:', error);
        }
    };

    useEffect(() => {
        loadCourses();
        loadLecturers();
    }, [user]);

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const result = await ApiService.request('/courses', {
                method: 'POST',
                body: courseForm
            });

            setSuccess('Course created successfully!');
            setShowCourseForm(false);
            setCourseForm({
                course_code: '',
                course_name: '',
                description: '',
                credits: 3,
                faculty: ''
            });
            loadCourses();
        } catch (error) {
            setError('Failed to create course: ' + error.message);
        }
    };

    const handleAssignLecturer = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const result = await ApiService.request(`/courses/${selectedCourse.id}/assign`, {
                method: 'POST',
                body: assignmentForm
            });

            setSuccess('Lecturer assigned successfully!');
            setShowAssignmentForm(false);
            setAssignmentForm({
                lecturer_id: '',
                module_name: ''
            });
            setSelectedCourse(null);
            loadCourses();
        } catch (error) {
            setError('Failed to assign lecturer: ' + error.message);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        try {
            setError('');
            await ApiService.request(`/courses/${courseId}`, {
                method: 'DELETE'
            });

            setSuccess('Course deleted successfully!');
            loadCourses();
        } catch (error) {
            setError('Failed to delete course: ' + error.message);
        }
    };

    const handleRemoveAssignment = async (assignmentId, courseId) => {
        if (!window.confirm('Are you sure you want to remove this assignment?')) {
            return;
        }

        try {
            setError('');
            await ApiService.request(`/courses/assignments/${assignmentId}`, {
                method: 'DELETE'
            });

            setSuccess('Assignment removed successfully!');
            loadCourses();
        } catch (error) {
            setError('Failed to remove assignment: ' + error.message);
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
                <p className="mt-2 text-muted">Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="course-management">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Course Management</h3>
                    <p className="text-muted mb-0">Manage courses and assign lecturers to modules</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowCourseForm(true)}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Course
                </button>
            </div>

            {/* Messages */}
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

            {/* Courses List */}
            <div className="row">
                {courses.map(course => (
                    <div key={course.id} className="col-md-6 col-lg-4 mb-4">
                        <div className="card h-100 shadow-sm">
                            <div className="card-header bg-primary text-white">
                                <h6 className="mb-0">{course.course_code}</h6>
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">{course.course_name}</h5>
                                <p className="card-text text-muted small">
                                    {course.description || 'No description provided'}
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
                                <div className="mb-3">
                                    <small className="text-muted">
                                        <strong>Modules Assigned:</strong> {course.assigned_modules || 0}
                                    </small>
                                </div>
                                <div className="mb-3">
                                    <small className="text-muted">
                                        <strong>Active Classes:</strong> {course.active_classes || 0}
                                    </small>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent">
                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-outline-primary btn-sm flex-fill"
                                        onClick={() => {
                                            setSelectedCourse(course);
                                            setShowAssignmentForm(true);
                                        }}
                                    >
                                        Assign Lecturer
                                    </button>
                                    <button 
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleDeleteCourse(course.id)}
                                        disabled={course.active_classes > 0}
                                        title={course.active_classes > 0 ? 'Cannot delete course with active classes' : 'Delete course'}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {courses.length === 0 && !loading && (
                <div className="text-center py-5">
                    <i className="bi bi-journal-x display-1 text-muted"></i>
                    <h4 className="mt-3 text-muted">No Courses Found</h4>
                    <p className="text-muted">Get started by creating your first course.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCourseForm(true)}
                    >
                        Create First Course
                    </button>
                </div>
            )}

            {/* Create Course Modal */}
            {showCourseForm && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Course</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowCourseForm(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCreateCourse}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Course Code *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={courseForm.course_code}
                                            onChange={(e) => setCourseForm({...courseForm, course_code: e.target.value})}
                                            required
                                            placeholder="e.g., CS101"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Course Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={courseForm.course_name}
                                            onChange={(e) => setCourseForm({...courseForm, course_name: e.target.value})}
                                            required
                                            placeholder="e.g., Introduction to Programming"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Faculty *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={courseForm.faculty}
                                            onChange={(e) => setCourseForm({...courseForm, faculty: e.target.value})}
                                            required
                                            placeholder="e.g., Faculty of Computing"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Credits</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={courseForm.credits}
                                            onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value) || 3})}
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={courseForm.description}
                                            onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                                            placeholder="Course description and objectives..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setShowCourseForm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Course
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Lecturer Modal */}
            {showAssignmentForm && selectedCourse && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Assign Lecturer - {selectedCourse.course_code}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => {
                                        setShowAssignmentForm(false);
                                        setSelectedCourse(null);
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleAssignLecturer}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Lecturer *</label>
                                        <select
                                            className="form-select"
                                            value={assignmentForm.lecturer_id}
                                            onChange={(e) => setAssignmentForm({...assignmentForm, lecturer_id: e.target.value})}
                                            required
                                        >
                                            <option value="">Select a lecturer</option>
                                            {lecturers.map(lecturer => (
                                                <option key={lecturer.id} value={lecturer.id}>
                                                    {lecturer.name} ({lecturer.email}) - {lecturer.role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Module Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={assignmentForm.module_name}
                                            onChange={(e) => setAssignmentForm({...assignmentForm, module_name: e.target.value})}
                                            required
                                            placeholder="e.g., Programming Fundamentals, Database Systems"
                                        />
                                        <div className="form-text">
                                            Specify which module or topic the lecturer will teach
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => {
                                            setShowAssignmentForm(false);
                                            setSelectedCourse(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Assign Lecturer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManagement;