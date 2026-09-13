import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import UploadResume from './pages/UploadResume';

import AdminDashboard from './pages/AdminDashboard';
import ExtractedProfile from './pages/ExtractedProfile';
const Navigation = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-sm w-full">
      <div className="w-full px-8 h-16 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" 
          onClick={() => {
            if (user?.role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else if (user) {
              window.location.href = '/candidate/dashboard';
            } else {
              window.location.href = '/';
            }
          }}
          title="Go to Dashboard"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
            AI
          </div>
          <div className="font-extrabold text-xl tracking-tight text-slate-800">
            Resume<span className="text-blue-600">Intel</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {!user ? (
            <>
              <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-semibold transition-colors">Sign In</Link>
              <Link to="/register" className="btn-primary py-2 px-5 text-sm">Create Account</Link>
            </>
          ) : (
            <>
              {user.role !== 'admin' && (
                <Link to="/candidate/dashboard" className="text-slate-600 hover:text-indigo-600 font-bold transition-colors">My Dashboard</Link>
              )}
              <div className="h-6 w-[2px] bg-slate-200"></div>
              <span className="text-sm font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">{user.email}</span>
              <button onClick={logout} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-all">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isDashboardLayout = location.pathname.startsWith('/admin') || location.pathname.startsWith('/candidate');

  if (isLandingPage) {
    return <>{children}</>;
  }

  if (isDashboardLayout) {
    return (
      <div className="h-screen flex flex-col font-sans relative z-0 overflow-hidden bg-slate-50">
        <main className="flex-1 flex flex-col w-full overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-light flex flex-col font-sans relative z-0">
      <Navigation />
      <main className="max-w-7xl mx-auto w-full p-4 mt-8 flex-grow">
        {children}
      </main>
      <footer className="mt-auto py-8 text-center text-slate-500 text-sm font-medium">
        AI Resume Intelligence © 2026
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Candidate Routes */}
            <Route path="/candidate/dashboard" element={<ProtectedRoute allowedRoles={['candidate']}><CandidateDashboard /></ProtectedRoute>} />
            <Route path="/candidate/*" element={<Navigate to="/candidate/dashboard" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/semantic" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard initialView="semantic" /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
