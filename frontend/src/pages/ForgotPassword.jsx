import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatApiError } from '../utils/errorUtils';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(formatApiError(err, 'Failed to send reset email. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[85vh] py-8">
      <div className="glass-panel w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">Forgot Password?</h2>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            Enter your registered email address to receive a secure password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-6 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm font-semibold">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Check Your Email</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                If an account exists for <strong className="text-slate-900">{email}</strong>, we have sent instructions to reset your password.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                (The link is valid for 30 minutes. Please check your spam folder if you don't see it within a minute.)
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="btn-outline text-sm"
              >
                Send to another email
              </button>
              <Link
                to="/login"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                &larr; Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all duration-300 text-sm"
                required
                placeholder="name@example.com"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                &larr; Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
