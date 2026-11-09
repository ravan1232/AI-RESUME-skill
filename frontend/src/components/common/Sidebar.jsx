import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Users2,
  MessageSquare,
  BotMessageSquare,
  GraduationCap,
  ShieldCheck,
  Settings,
  HelpCircle,
  Award
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const studentLinks = [
    { name: 'Readiness Hub', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile & Skills', path: '/profile', icon: User },
    { name: 'Resume & ATS Score', path: '/resume-analyzer', icon: FileText, badge: 'AI' },
    { name: 'Job Gap Matcher', path: '/job-matcher', icon: Briefcase, badge: 'AI' },
    { name: 'Peer Skill Exchange', path: '/exchange', icon: Users2, highlight: true },
    { name: 'Exchange Chat', path: '/chat', icon: MessageSquare },
    { name: 'AI Mock Interview', path: '/mock-interview', icon: BotMessageSquare, badge: 'Groq' },
    { name: 'Skill Verification', path: '/assessments', icon: Award },
  ];

  const adminLinks = [
    { name: 'Platform Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Student Management', path: '/admin/users', icon: User },
    { name: 'Skills Catalog', path: '/admin/skills', icon: GraduationCap },
    { name: 'Assessment Bank', path: '/admin/assessments', icon: ShieldCheck },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0A192F] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand in Sidebar (Mobile/Desktop Header) */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
              SB
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base tracking-wide">SkillBridge</span>
              <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase">
                {isAdmin ? 'Admin Console' : 'Placement AI'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            &times;
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {isAdmin ? 'Administration' : 'Placement & Growth'}
          </div>

          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  } ${item.highlight ? 'ring-1 ring-blue-500/30' : ''}`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Integration Callout Footer */}
        <div className="p-4 border-t border-slate-800/80 m-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SkillBridge Loop Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Missing JD skills automatically match with verified student mentors.
          </p>
        </div>
      </aside>
    </>
  );
};

