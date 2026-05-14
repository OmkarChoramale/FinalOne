import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = getUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Fallback depending on their role
        if (user.role === 'TOURIST') return <Navigate to="/dashboard" replace />;
        return <Navigate to="/main-dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
