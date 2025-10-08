import React from 'react';

const Header = ({ user, onLogout }) => {
    const getRoleDisplayName = (role) => {
        const roleMap = {
            student: 'Student',
            lecturer: 'Lecturer',
            principal_lecturer: 'Principal Lecturer',
            program_leader: 'Program Leader'
        };
        return roleMap[role] || role;
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
            <div className="container">
                <span className="navbar-brand fw-bold">
                    LUCT Faculty Reporting System
                </span>
                
                <div className="navbar-nav ms-auto align-items-center">
                    <div className="d-flex align-items-center">
                        <span className="navbar-text text-light me-3">
                            Welcome, {user.name} ({getRoleDisplayName(user.role)})
                        </span>
                        <button 
                            className="btn btn-outline-light btn-sm"
                            onClick={onLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;