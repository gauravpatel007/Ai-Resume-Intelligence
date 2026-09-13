import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { formatApiError } from '../utils/errorUtils';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setError('No reset token provided. Please use the link sent to your email.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        setTokenValid(true);
        setUserEmail(res.data.email || '');
      } catch (err) {
        setTokenValid(false);
        setError(formatApiError(err, 'Password reset link is invalid or has expired.'));
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token: token,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(formatApiError(err, 'Failed to reset password. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex justify-center items-center min-h-[85vh] py-8">
        <div className="glass-panel w-full max-w-md p-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold text-sm">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[85vh] py-8">
      <div className="glass-panel w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">Set New Password</h2>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            {userEmail ? `Resetting password for ${userEmail}` : 'Create a strong, secure password'}
          </p>
        </div>

        {error && (
          <div className="mb-6 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm font-semibold">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Password Reset Complete!</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your password has been successfully updated. You can now log in to your account with your new credentials.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full btn-primary py-3"
              >
                Sign In Now
              </button>
            </div>
          </div>
        ) : !tokenValid ? (
          <div className="text-center space-y-6">
            <p className="text-slate-600 text-sm">
              This password reset link is invalid, expired, or has already been used.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <Link to="/forgot-password" className="btn-primary py-3 text-sm">
                Request a New Reset Link
              </Link>
              <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-700 transition">
                &larr; Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all duration-300 pr-12 text-sm"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all duration-300 text-sm"
                required
                minLength={6}
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Password...</span>
                </>
              ) : (
                'Save New Password'
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition">
                &larr; Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
