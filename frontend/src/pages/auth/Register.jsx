import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credential) => {
    try {
      setLoading(true);
      const user = await loginWithGoogle(credential, role);
      showToast(`Signed up with Google! Welcome, ${user.full_name}`, 'success');
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Google registration failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      showToast('All fields are required', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    try {
      setLoading(true);
      const user = await register(fullName, email, password, role);
      showToast(`Account created successfully! Welcome, ${user.full_name}`, 'success');
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-md shadow-navy-900/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-sky-400" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-navy-950">
              SkillBridge <span className="text-blue-600">AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
          <p className="text-sm text-slate-500 mt-1">
            Join the integrated placement readiness platform
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              role === 'student'
                ? 'bg-white text-navy-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              role === 'admin'
                ? 'bg-white text-navy-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ Platform Admin
          </button>
        </div>

        {/* Google Authentication Button */}
        <div className="mb-5">
          <GoogleSignInButton
            text={`Sign up as ${role === 'admin' ? 'Admin' : 'Student'} with Google`}
            role={role}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Alex Mercer"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

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
                placeholder="alex.mercer@university.edu"
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
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-navy-900 hover:bg-navy-800 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-navy-950/20 flex items-center justify-center space-x-2 disabled:opacity-70 mt-3"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

