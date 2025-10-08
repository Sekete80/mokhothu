import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ApiService from './services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            verifyToken(token);
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async (token) => {
        try {
            const userData = await ApiService.getProfile();
            setUser(userData.data);
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
            ApiService.removeToken();
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = (data) => {
        ApiService.setToken(data.token);
        setUser(data.user);
    };

    const handleRegisterSuccess = (data) => {
        ApiService.setToken(data.token);
        setUser(data.user);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        ApiService.removeToken();
        setUser(null);
        setShowRegister(false);
    };

    // Footer Component
    const Footer = () => (
        <footer className="bg-dark text-light py-4 mt-5">
            <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <h5>LUCT Faculty Reporting System</h5>
                        <p className="mb-0">Limkokwing University of Creative Technology</p>
                        <small className="text-muted">
                            Enhancing teaching quality through comprehensive reporting
                        </small>
                    </div>
                    <div className="col-md-6 text-md-end">
                        <div className="mb-2">
                            <strong>Contact Support:</strong>
                            <div>mokhothu@luct.co.ls</div>
                        </div>
                        <small className="text-muted">
                            &copy; {new Date().getFullYear()} LUCT. All rights reserved.
                        </small>
                    </div>
                </div>
            </div>
        </footer>
    );

    if (loading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading LUCT Reporting System...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="auth-container">
                <div className="container">
                    <div className="row justify-content-center align-items-center min-vh-100">
                        <div className="col-md-6 col-lg-5">
                            {showRegister ? (
                                <Register 
                                    onSwitchToLogin={() => setShowRegister(false)}
                                    onRegisterSuccess={handleRegisterSuccess}
                                />
                            ) : (
                                <Login 
                                    onSwitchToRegister={() => setShowRegister(true)}
                                    onLoginSuccess={handleLoginSuccess}
                                />
                            )}
                        </div>
                    </div>
                </div>
                {/* Footer for auth pages */}
                <footer className="bg-dark text-light py-3 mt-auto">
                    <div className="container text-center">
                        <small>
                            &copy; {new Date().getFullYear()} Limkokwing University of Creative Technology
                        </small>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="App d-flex flex-column min-vh-100">
            <Header user={user} onLogout={handleLogout} />
            <main className="flex-grow-1">
                <Dashboard user={user} />
            </main>
            <Footer />
        </div>
    );
}

export default App;