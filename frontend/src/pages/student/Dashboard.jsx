import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  FileText,
  Briefcase,
  Users2,
  Calendar,
  CheckCircle,
  ArrowRight,
  Target,
  BookOpen,
  Award
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get('/students/profile'),
          api.get('/students/dashboard-stats')
        ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Placement Dashboard..." />;
  }

  const readiness = profile?.placement_readiness || {
    overall_score: 70,
    ats_score: 75,
    technical_skill_score: 70,
    soft_skill_score: 75,
    mock_interview_score: 65,
    verified_skills_count: 0
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-navy-950/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Placement Readiness Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || 'Student'}!
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Your placement readiness score is currently at <span className="text-white font-bold">{readiness.overall_score}%</span>. 
            Analyze a target job description to pinpoint missing skills and auto-match with peer mentors.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/resume-analyzer"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition shadow-lg shadow-blue-600/30 flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Analyze Resume</span>
            </Link>
            <Link
              to="/job-matcher"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wide transition border border-white/20 flex items-center space-x-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Job Gap Matcher</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Overall Readiness */}
        <Card className="border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Readiness Score</p>
              <p className="text-3xl font-extrabold text-navy-950 mt-1">{readiness.overall_score}%</p>
            </div>
            <div className={`p-3 rounded-2xl border ${getScoreColor(readiness.overall_score)}`}>
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${readiness.overall_score}%` }}
            />
          </div>
        </Card>

        {/* ATS Score */}
        <Card className="border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">ATS Resume Score</p>
              <p className="text-3xl font-extrabold text-navy-950 mt-1">{readiness.ats_score}%</p>
            </div>
            <div className={`p-3 rounded-2xl border ${getScoreColor(readiness.ats_score)}`}>
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Format & Keywords calibrated</span>
          </p>
        </Card>

        {/* Skills I Can Teach */}
        <Card className="border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skills I Teach</p>
              <p className="text-3xl font-extrabold text-navy-950 mt-1">
                {profile?.skills_can_teach?.length || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Users2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            {profile?.skills_can_teach?.length > 0
              ? `${profile.skills_can_teach[0].skill_name} + more`
              : 'Add skills to earn exchange karma'}
          </p>
        </Card>

        {/* Skills Want to Learn */}
        <Card className="border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skills to Learn</p>
              <p className="text-3xl font-extrabold text-navy-950 mt-1">
                {profile?.skills_want_to_learn?.length || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            {profile?.skills_want_to_learn?.length > 0
              ? `${profile.skills_want_to_learn[0].skill_name} (Priority)`
              : 'Add skills you want to learn'}
          </p>
        </Card>
      </div>

      {/* Critical Integration Pipeline Section */}
      <Card title="Integrated Placement & Skill Exchange Engine" subtitle="How your profile data powers autonomous peer matching">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 1</span>
            <h4 className="font-semibold text-slate-800 text-sm mt-1">Extract & ATS Score</h4>
            <p className="text-xs text-slate-500 mt-1">PyPDF2 parses resume text and scores ATS compliance deterministically.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 2</span>
            <h4 className="font-semibold text-slate-800 text-sm mt-1">Job Gap Analysis</h4>
            <p className="text-xs text-slate-500 mt-1">Compares job descriptions to identify matched and critical missing skills.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Step 3</span>
            <h4 className="font-semibold text-slate-800 text-sm mt-1">Autonomous Peer Match</h4>
            <p className="text-xs text-slate-500 mt-1">Directly queries students who teach your missing skills and suggests exchanges.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step 4</span>
            <h4 className="font-semibold text-slate-800 text-sm mt-1">Assess & Verify</h4>
            <p className="text-xs text-slate-500 mt-1">Test your newly gained skills to update your verified placement readiness.</p>
          </div>
        </div>
      </Card>

      {/* Skills Showcase & Profile Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills I Can Teach */}
        <Card
          title="Skills I Can Teach"
          subtitle="Offered to fellow students during peer exchanges"
          action={
            <Link to="/profile" className="text-xs font-semibold text-blue-600 hover:underline">
              Manage Skills
            </Link>
          }
        >
          {profile?.skills_can_teach?.length > 0 ? (
            <div className="space-y-3">
              {profile.skills_can_teach.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.skill_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{s.proficiency} • {s.years_of_experience} yrs exp</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                    {s.verified ? 'Verified' : 'Self-Rated'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              No skills added yet. Visit Profile to add skills you can teach.
            </div>
          )}
        </Card>

        {/* Skills I Want to Learn */}
        <Card
          title="Skills I Want to Learn"
          subtitle="These drive your recommended peer tutors"
          action={
            <Link to="/profile" className="text-xs font-semibold text-blue-600 hover:underline">
              Edit Goals
            </Link>
          }
        >
          {profile?.skills_want_to_learn?.length > 0 ? (
            <div className="space-y-3">
              {profile.skills_want_to_learn.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.skill_name}</p>
                    <p className="text-xs text-slate-500 capitalize">Target: {s.target_proficiency}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded-lg capitalize">
                    {s.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              No learning goals added yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

