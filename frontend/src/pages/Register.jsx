import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { formatApiError } from '../utils/errorUtils';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRendered, setGoogleRendered] = useState(false);
  const [googleConfigMissing, setGoogleConfigMissing] = useState(false);
  const { register, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setGoogleLoading(true);
      setError('');
      if (!response?.credential) {
        throw new Error('No credential received from Google.');
      }
      const role = await loginWithGoogle(response.credential);
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    } catch (err) {
      setError(formatApiError(err, 'Google Sign-In failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId || googleClientId.trim() === '' || googleClientId.startsWith('your-')) {
      return;
    }

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId.trim(),
            callback: handleGoogleCredentialResponse,
          });

          const btnContainer = document.getElementById('googleSignUpDiv');
          if (btnContainer) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: btnContainer.offsetWidth || 340,
              text: 'signup_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
            setGoogleRendered(true);
          }
        } catch (e) {
          console.error('Failed to initialize Google Sign-In on Register:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  const handleCustomGoogleClick = () => {
    if (!googleClientId || googleClientId.trim() === '' || googleClientId.startsWith('your-')) {
      setGoogleConfigMissing(true);
      setError('Google Sign-In setup required: Please configure VITE_GOOGLE_CLIENT_ID in frontend/.env');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('One-tap prompt was not displayed or dismissed.');
        }
      });
    } else {
      setError('Google Identity Services library is still loading. Please check your internet connection.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      // Candidates are redirected to candidate dashboard after registration
      navigate('/candidate/dashboard');
    } catch (err) {
      setError(formatApiError(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[85vh] py-8">
      <div className="glass-panel w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
              AI
            </div>
            <div className="font-extrabold text-xl tracking-tight text-slate-800">
              Resume<span className="text-blue-600">Intel</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">Create Account</h2>
          <p className="text-slate-500 mt-2 font-medium">Join the intelligent hiring platform</p>
        </div>
        
        {error && <div className="mb-6 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm font-semibold">{error}</div>}

        {/* Google Sign Up Option */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <div id="googleSignUpDiv" className="w-full flex justify-center"></div>

          {(!googleRendered || !googleClientId) && (
            <button
              type="button"
              onClick={handleCustomGoogleClick}
              disabled={googleLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 text-sm flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99]"
            >
              {googleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          )}

          {googleConfigMissing && (
            <div className="w-full mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-left">
              <p className="text-xs text-amber-800 font-bold mb-1">Google OAuth Setup Needed</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Add your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">VITE_GOOGLE_CLIENT_ID</code> to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">frontend/.env</code> to activate Google Sign-In.
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold">Or with email & password</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all duration-300 text-sm"
              required
              placeholder="John Doe"
            />
          </div>
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
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all duration-300 pr-12 text-sm"
                required
                placeholder="••••••••"
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
          <button
            type="submit"
            className="w-full btn-primary mt-4 py-3"
          >
            Register
          </button>
        </form>
        
        <p className="mt-8 text-center text-slate-600 font-medium text-sm">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-bold transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

