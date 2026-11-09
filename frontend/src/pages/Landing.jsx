import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Users, BrainCircuit, Rocket, CheckCircle2, Award } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-sky-200" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">SkillBridge <span className="text-blue-400">AI</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition">
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <BrainCircuit className="w-4 h-4" />
          <span>Unified Placement & Peer Exchange Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Supercharge Your Career with <br />
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            AI Placement Readiness & Peer Exchange
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The only dual-engine platform that analyzes job descriptions against your resume, calculates missing skills, and instantly connects you to verified student peers ready to teach them.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition shadow-xl shadow-blue-600/30 flex items-center justify-center space-x-2 group"
          >
            <span>Launch Student Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition"
          >
            Demo Sign In
          </Link>
        </div>

        {/* Dual Pillar Preview Grid */}
        <div className="mt-24 grid md:grid-cols-2 gap-8 text-left">
          {/* Pillar 1 */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 mb-6">
              <Rocket className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Placement Readiness Engine</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Instant ATS resume scoring, job description skill extraction, gap calculation, and tailored roadmaps powered by Groq LLaMA models.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Deterministic ATS compliance and format analyzer</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Job Description match % and missing skill breakdown</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>AI Mock Interview simulation with real-time feedback</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Peer Skill Exchange Engine</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Close your placement gaps collaboratively. Matched missing skills trigger automated peer discovery to find campus mentors.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Teach what you know, master what you need for placements</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Real-time WebSocket chat and structured learning sessions</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Skill assessments that raise verified placement scores</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

