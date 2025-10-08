import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const RatingModal = ({ report, show, onClose, onRatingSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show && report) {
            setRating(0);
            setFeedback('');
            setError('');
        }
    }, [show, report]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await ApiService.rateReport(report.id, {
                rating: rating,
                feedback: feedback
            });
            
            onRatingSubmitted();
            onClose();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Rate Class - {report?.course_code}</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                            disabled={loading}
                        ></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger">{error}</div>
                            )}
                            
                            <div className="mb-4">
                                <label className="form-label fw-bold">How would you rate this class?</label>
                                <div className="d-flex justify-content-between mt-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`btn btn-lg ${rating >= star ? 'btn-warning' : 'btn-outline-warning'}`}
                                            onClick={() => setRating(star)}
                                            style={{ fontSize: '1.5rem' }}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                                <div className="d-flex justify-content-between mt-2 text-muted small">
                                    <span>Poor</span>
                                    <span>Fair</span>
                                    <span>Good</span>
                                    <span>Very Good</span>
                                    <span>Excellent</span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Additional Feedback (Optional)</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder="Share your thoughts about the class, lecturer, or any suggestions for improvement..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                            </div>

                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6 className="card-title">Class Details</h6>
                                    <p className="mb-1"><strong>Course:</strong> {report?.course_name}</p>
                                    <p className="mb-1"><strong>Lecturer:</strong> {report?.lecturer_name}</p>
                                    <p className="mb-1"><strong>Date:</strong> {report?.date_of_lecture ? new Date(report.date_of_lecture).toLocaleDateString() : ''}</p>
                                    <p className="mb-0"><strong>Topic:</strong> {report?.topic_taught}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading || rating === 0}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Rating'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;