import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const ClassManagement = ({ user }) => {
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedLecturer, setSelectedLecturer] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        class_code: '',
        class_name: '',
        course_id: '',
        lecturer_id: '',
        semester: '',
        academic_year: '',
        max_students: 30
    });

    const loadClasses = async () => {
        try {
            setLoading(true);
            const result = await ApiService.getAllClasses();
            console.log('Classes loaded:', result.data);
            setClasses(result.data || []);
        } catch (error) {
            setError('Failed to load classes: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadCourses = async () => {
        try {
            const result = await ApiService.getAllCourses();
            setCourses(result.data || []);
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    };

    const loadLecturers = async () => {
        try {
            const result = await ApiService.getAllUsers();
            const lecturerUsers = result.data.filter(user => 
                user.role === 'lecturer' || user.role === 'principal_lecturer'
            );
            setLecturers(lecturerUsers);
        } catch (error) {
            console.error('Failed to load lecturers:', error);
        }
    };

    useEffect(() => {
        loadClasses();
        loadCourses();
        loadLecturers();
    }, []);

    // Set default academic year when form opens
    useEffect(() => {
        if (showForm && !formData.academic_year) {
            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;
            setFormData(prev => ({
                ...prev,
                academic_year: `${currentYear}/${nextYear}`
            }));
        }
    }, [showForm]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClass) {
                await ApiService.updateClass(editingClass.id, formData);
                setError('');
                setEditingClass(null);
            } else {
                await ApiService.createClass(formData);
                setError('');
            }
            
            setShowForm(false);
            resetForm();
            loadClasses();
        } catch (error) {
            setError('Failed to save class: ' + error.message);
        }
    };

    const handleEdit = (classItem) => {
        setEditingClass(classItem);
        setFormData({
            class_code: classItem.class_code,
            class_name: classItem.class_name,
            course_id: classItem.course_id,
            lecturer_id: classItem.lecturer_id || '',
            semester: classItem.semester,
            academic_year: classItem.academic_year,
            max_students: classItem.max_students
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await ApiService.deleteClass(id);
                loadClasses();
            } catch (error) {
                setError('Failed to delete class: ' + error.message);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            class_code: '',
            class_name: '',
            course_id: '',
            lecturer_id: '',
            semester: '',
            academic_year: '',
            max_students: 30
        });
        setEditingClass(null);
    };

    const handleAssignLecturer = (classItem) => {
        setSelectedClass(classItem);
        setSelectedLecturer(classItem.lecturer_id || '');
        setShowAssignModal(true);
    };

    const submitAssignment = async () => {
        try {
            await ApiService.updateClass(selectedClass.id, {
                lecturer_id: selectedLecturer || null
            });
            
            setShowAssignModal(false);
            setSelectedClass(null);
            setSelectedLecturer('');
            loadClasses();
        } catch (error) {
            setError('Failed to assign lecturer: ' + error.message);
        }
    };

    const removeAssignment = async (classItem) => {
        if (window.confirm('Are you sure you want to remove the lecturer from this class?')) {
            try {
                await ApiService.updateClass(classItem.id, {
                    lecturer_id: null
                });
                loadClasses();
            } catch (error) {
                setError('Failed to remove lecturer: ' + error.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading classes...</p>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4>Class Management</h4>
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Class
                    </button>
                </div>

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

                {/* Classes List */}
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">All Classes</h5>
                    </div>
                    <div className="card-body">
                        {classes.length === 0 ? (
                            <div className="text-center py-4">
                                <i className="bi bi-people display-1 text-muted"></i>
                                <h5 className="mt-3 text-muted">No Classes Found</h5>
                                <p className="text-muted">Get started by creating your first class.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Class Code</th>
                                            <th>Class Name</th>
                                            <th>Course</th>
                                            <th>Lecturer</th>
                                            <th>Semester</th>
                                            <th>Academic Year</th>
                                            <th>Max Students</th>
                                            <th>Enrolled</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.map(classItem => (
                                            <tr key={classItem.id}>
                                                <td>
                                                    <strong>{classItem.class_code}</strong>
                                                </td>
                                                <td>{classItem.class_name}</td>
                                                <td>
                                                    {classItem.course_name ? (
                                                        `${classItem.course_code} - ${classItem.course_name}`
                                                    ) : (
                                                        <span className="text-muted">No course assigned</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {classItem.lecturer_name ? (
                                                        <div>
                                                            <div>{classItem.lecturer_name}</div>
                                                            <small className="text-muted">
                                                                {classItem.lecturer_email}
                                                            </small>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">Not assigned</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {classItem.semester ? `Semester ${classItem.semester}` : 'Not set'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {classItem.academic_year || (
                                                        <span className="text-warning">Not set</span>
                                                    )}
                                                </td>
                                                <td>{classItem.max_students || 0}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        classItem.enrolled_students >= (classItem.max_students || 0) 
                                                            ? 'bg-danger' 
                                                            : classItem.enrolled_students > 0 ? 'bg-success' : 'bg-secondary'
                                                    }`}>
                                                        {classItem.enrolled_students || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => handleAssignLecturer(classItem)}
                                                            title="Assign Lecturer"
                                                        >
                                                            <i className="bi bi-person-plus"></i>
                                                        </button>
                                                        {classItem.lecturer_id && (
                                                            <button
                                                                className="btn btn-outline-warning"
                                                                onClick={() => removeAssignment(classItem)}
                                                                title="Remove Lecturer"
                                                            >
                                                                <i className="bi bi-person-dash"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => handleEdit(classItem)}
                                                            title="Edit Class"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger"
                                                            onClick={() => handleDelete(classItem.id)}
                                                            title="Delete Class"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Class Form Modal */}
                {showForm && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {editingClass ? 'Edit Class' : 'Add New Class'}
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                    ></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Class Code *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="class_code"
                                                        value={formData.class_code}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Class Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="class_name"
                                                        value={formData.class_name}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Course *</label>
                                                    <select
                                                        className="form-select"
                                                        name="course_id"
                                                        value={formData.course_id}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="">Select Course</option>
                                                        {courses.map(course => (
                                                            <option key={course.id} value={course.id}>
                                                                {course.course_code} - {course.course_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Lecturer</label>
                                                    <select
                                                        className="form-select"
                                                        name="lecturer_id"
                                                        value={formData.lecturer_id}
                                                        onChange={handleInputChange}
                                                    >
                                                        <option value="">Not Assigned</option>
                                                        {lecturers.map(lecturer => (
                                                            <option key={lecturer.id} value={lecturer.id}>
                                                                {lecturer.name} ({lecturer.role})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">Semester *</label>
                                                    <select
                                                        className="form-select"
                                                        name="semester"
                                                        value={formData.semester}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="">Select Semester</option>
                                                        <option value="1">Semester 1</option>
                                                        <option value="2">Semester 2</option>
                                                        <option value="3">Semester 3</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">Academic Year *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="academic_year"
                                                        value={formData.academic_year}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g., 2024/2025"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">Max Students</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        name="max_students"
                                                        value={formData.max_students}
                                                        onChange={handleInputChange}
                                                        min="1"
                                                        max="100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowForm(false);
                                                resetForm();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            {editingClass ? 'Update Class' : 'Create Class'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assign Lecturer Modal */}
                {showAssignModal && selectedClass && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Assign Lecturer to Class</h5>
                                    <button 
                                        type="button" 
                                        className="btn-close"
                                        onClick={() => setShowAssignModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Class</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={`${selectedClass.class_code} - ${selectedClass.class_name}`}
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Select Lecturer</label>
                                        <select
                                            className="form-select"
                                            value={selectedLecturer}
                                            onChange={(e) => setSelectedLecturer(e.target.value)}
                                        >
                                            <option value="">Not Assigned</option>
                                            {lecturers.map(lecturer => (
                                                <option key={lecturer.id} value={lecturer.id}>
                                                    {lecturer.name} ({lecturer.role}) - {lecturer.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedClass.lecturer_name && (
                                        <div className="alert alert-info">
                                            <small>
                                                Currently assigned to: <strong>{selectedClass.lecturer_name}</strong>
                                            </small>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary"
                                        onClick={() => setShowAssignModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary"
                                        onClick={submitAssignment}
                                    >
                                        Assign Lecturer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassManagement;