import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0) {
        // user.roles is typically an array of strings (from Spatie Roles) or a single string
        const userRoles = Array.isArray(user?.roles) 
            ? user.roles.map(r => r.name || r) 
            : [user?.role].filter(Boolean);

        const hasAccess = allowedRoles.some(role => userRoles.includes(role));

        if (!hasAccess) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
};
