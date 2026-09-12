import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');

  if (loading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-slate-500 font-semibold text-sm">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  const effectiveRole = user?.role || storedRole;

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    // Redirect based on role if they try to access unauthorized pages
    if (effectiveRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/candidate/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
