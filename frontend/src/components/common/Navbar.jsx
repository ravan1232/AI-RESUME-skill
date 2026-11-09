import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, User, Shield, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between transition-all">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-navy-900 via-navy-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-navy-900/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-navy-950 via-navy-800 to-navy-900 bg-clip-text text-transparent">
              SkillBridge
            </span>
            <span className="text-xs font-bold text-blue-600 ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200/60 rounded">
              AI
            </span>
          </div>
        </Link>
      </div>

      {/* User Actions & Badge */}
      <div className="flex items-center space-x-3.5">
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-slate-100/80 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
          {isAdmin ? (
            <>
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-800 font-semibold">Admin Mode</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Student Portal</span>
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.full_name || 'Member'}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role || 'student'}</p>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

