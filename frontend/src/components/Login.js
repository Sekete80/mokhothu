import React, { useState } from 'react';
import ApiService from '../services/api';

const Login = ({ onSwitchToRegister, onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
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
            const result = await ApiService.login(formData);
            ApiService.setToken(result.token);
            onLoginSuccess(result);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow">
            <div className="card-body p-4">
                <h3 className="card-title text-center mb-4 text-primary">
                    LUCT Reporting System
                </h3>
                <h5 className="text-center mb-4 text-muted">Login</h5>
                
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
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-100 py-2 mb-3"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>

                    <div className="text-center">
                        <span className="text-muted">Don't have an account? </span>
                        <button 
                            type="button" 
                            className="btn btn-link p-0 text-decoration-none"
                            onClick={onSwitchToRegister}
                            disabled={loading}
                        >
                            Register here
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;