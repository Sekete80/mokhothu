import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await apiService.getMyReports();
            setReports(data.reports || []);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setError('Failed to load reports: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReport = async (reportData) => {
        try {
            setError('');
            await apiService.createReport(reportData);
            alert('Report created successfully!');
            fetchReports(); // Refresh the list
        } catch (err) {
            console.error('Failed to create report:', err);
            setError('Failed to create report: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="text-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p>Loading reports...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>My Reports</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={() => document.getElementById('reportForm').classList.toggle('d-none')}
                        >
                            Create New Report
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Simple Report Form */}
                    <div id="reportForm" className="card mb-4 d-none">
                        <div className="card-body">
                            <h5 className="card-title">Create New Report</h5>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleCreateReport({
                                    faculty_name: formData.get('faculty_name'),
                                    class_name: formData.get('class_name'),
                                    lecture_date: formData.get('lecture_date'),
                                    topic_covered: formData.get('topic_covered')
                                });
                            }}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="faculty_name" className="form-label">Faculty Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="faculty_name"
                                                name="faculty_name"
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="class_name" className="form-label">Class Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="class_name"
                                                name="class_name"
                                                required 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="lecture_date" className="form-label">Lecture Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                id="lecture_date"
                                                name="lecture_date"
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="topic_covered" className="form-label">Topic Covered</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="topic_covered"
                                                name="topic_covered"
                                                required 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-success">Submit Report</button>
                            </form>
                        </div>
                    </div>

                    {/* Reports List */}
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">My Lecture Reports</h5>
                            {reports.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">No reports found.</p>
                                    <p>Create your first report using the button above.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Faculty</th>
                                                <th>Class</th>
                                                <th>Lecture Date</th>
                                                <th>Topic</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reports.map((report) => (
                                                <tr key={report.id}>
                                                    <td>{report.faculty_name}</td>
                                                    <td>{report.class_name}</td>
                                                    <td>{new Date(report.lecture_date).toLocaleDateString()}</td>
                                                    <td>{report.topic_covered}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            report.status === 'approved' ? 'bg-success' :
                                                            report.status === 'rejected' ? 'bg-danger' :
                                                            report.status === 'submitted' ? 'bg-primary' :
                                                            'bg-secondary'
                                                        }`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;