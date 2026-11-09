import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.full_name}!`, 'success');
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    try {
      setLoading(true);
      const user = await loginWithGoogle(credential, 'student');
      showToast(`Signed in with Google! Welcome, ${user.full_name}`, 'success');
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Google authentication failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-md shadow-navy-900/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-sky-400" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-navy-950">
              SkillBridge <span className="text-blue-600">AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="text-sm text-slate-500 mt-1">
            Access placement analytics & peer skill exchange
          </p>
        </div>

        {/* Google Authentication Button */}
        <div className="mb-5">
          <GoogleSignInButton
            text="Continue with Google"
            onSuccess={handleGoogleSuccess}
            onError={(err) => showToast(err, 'error')}
          />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative">
            or with email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@university.edu"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-navy-900 hover:bg-navy-800 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-navy-950/20 flex items-center justify-center space-x-2 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In with Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
