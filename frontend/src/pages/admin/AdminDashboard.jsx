import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Activity,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Sparkles,
  FileText,
  Copy,
  Check,
  BookmarkPlus,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Layers,
  SlidersHorizontal,
  RefreshCw,
  FileQuestion,
  UserCheck
} from 'lucide-react';

export const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Tab state derived from URL
  const getInitialTab = () => {
    if (location.pathname.includes('/resume-questions')) return 'resume-questions';
    if (location.pathname.includes('/users')) return 'users';
    if (location.pathname.includes('/skills')) return 'skills';
    if (location.pathname.includes('/assessments')) return 'assessments';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [assessments, setAssessments] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // New Skill Modal
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Web Frameworks');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);

  // Resume Question Generator State
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [customResumeText, setCustomResumeText] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [generatorMode, setGeneratorMode] = useState('enrolled'); // 'enrolled' | 'custom'
  const [difficulty, setDifficulty] = useState('mid');
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [savedQuestionIds, setSavedQuestionIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  useEffect(() => {
    fetchAdminData();
    fetchCandidates();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, uRes, sRes, aRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/skills'),
        api.get('/admin/assessments')
      ]);
      setOverview(ovRes.data);
      setUsers(uRes.data.users || []);
      setSkills(sRes.data.skills || []);
      setAssessments(aRes.data.question_bank || {});
    } catch (err) {
      console.error(err);
      showToast('Error loading admin records from MongoDB', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/admin/student-resumes');
      const list = res.data.candidates || [];
      setCandidates(list);
      if (list.length > 0 && !selectedCandidateId) {
        setSelectedCandidateId(list[0].user_id);
      }
    } catch (e) {
      console.error('Could not fetch candidate resumes', e);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/admin');
    else navigate(`/admin/${tab}`);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/admin/users/${userId}/status`, { is_active: newStatus });
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u)));
      showToast(`User account ${newStatus ? 'activated' : 'suspended'}`, 'info');
    } catch (err) {
      showToast('Failed to update user status', 'error');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      const res = await api.post('/admin/skills', {
        name: newSkillName.trim(),
        category: newSkillCategory,
        description: newSkillDesc
      });
      setSkills([...skills, res.data.skill]);
      setNewSkillName('');
      setNewSkillDesc('');
      setShowAddSkill(false);
      showToast(`Added '${res.data.skill.name}' to platform catalog!`, 'success');
    } catch (err) {
      showToast('Failed to add skill', 'error');
    }
  };

  const handleDeleteSkill = async (skillName) => {
    if (!window.confirm(`Are you sure you want to remove '${skillName}'?`)) return;
    try {
      await api.delete(`/admin/skills/${encodeURIComponent(skillName)}`);
      setSkills(skills.filter((s) => s.name !== skillName));
      showToast(`Skill '${skillName}' removed`, 'info');
    } catch (err) {
      showToast('Failed to delete skill', 'error');
    }
  };

  const handleSelectStudentForQuestions = (studentId) => {
    setSelectedCandidateId(studentId);
    setGeneratorMode('enrolled');
    handleTabChange('resume-questions');
    showToast('Candidate selected! Click Generate to formulate tailored questions.', 'info');
  };

  const handleGenerateQuestions = async () => {
    try {
      setGenerating(true);
      const payload = {
        difficulty,
        count: parseInt(questionCount, 10),
      };

      if (generatorMode === 'enrolled') {
        if (!selectedCandidateId) {
          showToast('Please select a student candidate', 'warning');
          setGenerating(false);
          return;
        }
        payload.user_id = selectedCandidateId;
      } else {
        if (!customResumeText.trim()) {
          showToast('Please paste the candidate resume text', 'warning');
          setGenerating(false);
          return;
        }
        payload.resume_text = customResumeText.trim();
        payload.candidate_name = candidateName.trim() || 'Candidate';
      }

      const res = await api.post('/admin/generate-resume-questions', payload);
      setGeneratedResult(res.data);
      showToast(`Generated ${res.data.total_questions} tailored questions for ${res.data.candidate_name}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate resume-based questions', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToQuestionBank = async (q) => {
    try {
      setSavingId(q.id);
      const categorySkill = q.category.split(' ')[0] || 'Python';
      await api.post('/admin/add-to-question-bank', {
        skill_name: categorySkill,
        question: q.question,
        difficulty: q.difficulty || 'Intermediate',
        explanation: q.ideal_answer_criteria
      });
      setSavedQuestionIds(new Set([...savedQuestionIds, q.id]));
      showToast(`Saved to '${categorySkill}' assessment bank!`, 'success');
      // Refresh assessments
      const aRes = await api.get('/admin/assessments');
      setAssessments(aRes.data.question_bank || {});
    } catch (err) {
      showToast('Failed to save question to question bank', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleCopyQuestion = (q) => {
    const text = `QUESTION: ${q.question}\nCATEGORY: ${q.category} (${q.difficulty})\nRESUME CONTEXT: ${q.resume_context}\n\nIDEAL ANSWER / EVALUATION CRITERIA:\n${q.ideal_answer_criteria}`;
    navigator.clipboard.writeText(text);
    setCopiedId(q.id);
    showToast('Question and answer criteria copied!', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAll = () => {
    if (!generatedResult?.questions) return;
    const allText = generatedResult.questions
      .map(
        (q, idx) =>
          `[Question ${idx + 1}] Category: ${q.category} | Level: ${q.difficulty}\n` +
          `Prompt: ${q.question}\n` +
          `Resume Context: ${q.resume_context}\n` +
          `Evaluation Criteria: ${q.ideal_answer_criteria}\n`
      )
      .join('\n--------------------------------------------------\n\n');

    navigator.clipboard.writeText(
      `SKILLBRIDGE AI: AUTOMATED RESUME INTERVIEW SCRIPT\nCANDIDATE: ${generatedResult.candidate_name.toUpperCase()}\nSKILLS: ${generatedResult.skills_detected?.join(', ')}\n\n${allText}`
    );
    showToast('Full interview script copied to clipboard!', 'success');
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Administrator Control Center..." />;
  }

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCandidateObj = candidates.find((c) => c.user_id === selectedCandidateId);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>MongoDB Atlas Connected • Administrator Console</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Administration Hub</h1>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          Manage enrolled students, formulate automated interview questions from user resumes, monitor placement benchmarks, and oversee skill catalogs.
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            📊 Platform Overview
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            👥 Student Management ({users.length})
          </button>
          <button
            onClick={() => handleTabChange('resume-questions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'resume-questions'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold'
                : 'bg-indigo-950/60 text-indigo-200 border border-indigo-700/50 hover:bg-indigo-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Resume Q&A Generator</span>
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              AI
            </span>
          </button>
          <button
            onClick={() => handleTabChange('skills')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'skills'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            🎓 Skills Catalog ({skills.length})
          </button>
          <button
            onClick={() => handleTabChange('assessments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'assessments'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            🛡️ Assessment Question Bank
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="border-l-4 border-l-blue-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enrolled Students</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-3xl font-extrabold text-navy-950">{overview?.total_students || users.length}</p>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Active accounts in MongoDB Atlas</p>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Placement Readiness</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-3xl font-extrabold text-emerald-600">{overview?.average_readiness_score || 78}%</p>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">ATS + Technical + Verification test scores</p>
            </Card>

            <Card className="border-l-4 border-l-indigo-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resume Questions AI</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-3xl font-extrabold text-indigo-600">{candidates.length}</p>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Resumes ready for automated questioning</p>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skill Catalog Entities</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-3xl font-extrabold text-purple-600">{overview?.total_skills || skills.length}</p>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Verified technical taxonomies</p>
            </Card>
          </div>

          {/* Quick Action: Feature Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>New Feature</span>
              </div>
              <h3 className="text-lg font-bold">Automated Resume Question Generator</h3>
              <p className="text-xs text-blue-200 max-w-xl">
                Automatically formulate customized technical interview questions and evaluation criteria from candidate resumes.
              </p>
            </div>
            <button
              onClick={() => handleTabChange('resume-questions')}
              className="px-5 py-2.5 bg-white text-navy-950 font-bold text-xs rounded-xl hover:bg-blue-50 transition shadow-md whitespace-nowrap flex items-center space-x-2"
            >
              <span>Launch Generator</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT MANAGEMENT */}
      {activeTab === 'users' && (
        <Card
          title="Student Directory & Account Moderation"
          subtitle="Real-time synchronized student accounts in MongoDB Atlas"
          action={
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Readiness</th>
                  <th className="px-4 py-3">ATS Score</th>
                  <th className="px-4 py-3">Skills Offered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-blue-600">{u.readiness_score}%</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">{u.ats_score}%</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.skills_offered?.map((s, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Generate Questions Button */}
                      <button
                        onClick={() => handleSelectStudentForQuestions(u.id)}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition inline-flex items-center space-x-1"
                        title="Formulate automated interview questions from candidate resume"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Form Q&A</span>
                      </button>

                      {/* Moderation Button */}
                      <button
                        onClick={() => toggleUserStatus(u.id, u.is_active)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                          u.is_active
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: AUTOMATED RESUME QUESTION GENERATOR */}
      {activeTab === 'resume-questions' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Generator Banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/20 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Resume Grounded Question Synthesis Engine</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Automated Resume Question Generator
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Synthesize tailored, in-depth technical and architectural interview questions derived directly from candidate resume projects, frameworks, and claimed competencies.
                </p>
              </div>

              {generatedResult && (
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition flex items-center space-x-2 shadow-sm self-start md:self-auto"
                >
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span>Copy Interview Script</span>
                </button>
              )}
            </div>
          </div>

          {/* Generator Controls & Candidate Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Control Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Card title="Candidate Source & Configuration" subtitle="Select a student or provide custom resume text">
                <div className="space-y-5">
                  {/* Source Toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setGeneratorMode('enrolled')}
                      className={`py-2 text-xs font-semibold rounded-lg transition ${
                        generatorMode === 'enrolled'
                          ? 'bg-white text-navy-950 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🎓 Enrolled Student ({candidates.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneratorMode('custom')}
                      className={`py-2 text-xs font-semibold rounded-lg transition ${
                        generatorMode === 'custom'
                          ? 'bg-white text-navy-950 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📝 Custom Resume Text
                    </button>
                  </div>

                  {/* Mode 1: Enrolled Student Selection */}
                  {generatorMode === 'enrolled' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Select Enrolled Student
                      </label>
                      <select
                        value={selectedCandidateId}
                        onChange={(e) => setSelectedCandidateId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {candidates.map((c) => (
                          <option key={c.user_id} value={c.user_id}>
                            {c.full_name} ({c.email}) {c.has_resume ? `• ${c.filename}` : '• Profile Skills'}
                          </option>
                        ))}
                      </select>

                      {/* Selected Candidate Metadata Preview */}
                      {selectedCandidateObj && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{selectedCandidateObj.full_name}</span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {selectedCandidateObj.ats_score}% ATS Score
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Detected Skills in Resume
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {selectedCandidateObj.skills?.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          {selectedCandidateObj.filename && (
                            <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>{selectedCandidateObj.filename}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode 2: Custom Resume Input */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Candidate Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Alex Mercer"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Paste Resume Text / Project Highlights
                        </label>
                        <textarea
                          rows={6}
                          placeholder="Paste resume text, work experience, projects, or technical competencies here..."
                          value={customResumeText}
                          onChange={(e) => setCustomResumeText(e.target.value)}
                          className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Difficulty Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Interview Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'entry', label: 'Entry Level', sub: '0-1 yrs' },
                        { key: 'mid', label: 'Mid Level', sub: '1-3 yrs' },
                        { key: 'senior', label: 'Senior Lead', sub: '3+ yrs' }
                      ].map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => setDifficulty(d.key)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs transition ${
                            difficulty === d.key
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-500/20'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div>{d.label}</div>
                          <div className="text-[10px] opacity-75 font-normal">{d.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Number of Questions to Synthesize
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 5, 8, 10].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setQuestionCount(cnt)}
                          className={`py-2 text-center rounded-xl border text-xs font-bold transition ${
                            questionCount === cnt
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {cnt} Qs
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={generating}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Synthesizing Questions with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Formulate Tailored Questions</span>
                      </>
                    )}
                  </button>
                </div>
              </Card>
            </div>

            {/* Right Output Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {generatedResult ? (
                <div className="space-y-5 animate-fade-in">
                  {/* Candidate Summary Pill */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {generatedResult.candidate_name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                          {generatedResult.difficulty} level
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Synthesized {generatedResult.total_questions} tailored interview questions based on resume
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {generatedResult.skills_detected?.slice(0, 4).map((sk, i) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {generatedResult.questions?.map((q, idx) => {
                      const isCopied = copiedId === q.id;
                      const isSaved = savedQuestionIds.has(q.id);
                      const isSaving = savingId === q.id;

                      return (
                        <div
                          key={q.id || idx}
                          className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm transition space-y-3.5 group"
                        >
                          {/* Question Top Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                                {q.category}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                • {q.difficulty}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1.5 opacity-90 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleCopyQuestion(q)}
                                title="Copy Question & Criteria"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => handleAddToQuestionBank(q)}
                                disabled={isSaved || isSaving}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center space-x-1 ${
                                  isSaved
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                                }`}
                              >
                                {isSaved ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Saved to Bank</span>
                                  </>
                                ) : isSaving ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <BookmarkPlus className="w-3 h-3 text-indigo-600" />
                                    <span>Add to Bank</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Question Text */}
                          <p className="text-sm font-bold text-slate-900 leading-snug">
                            {q.question}
                          </p>

                          {/* Resume Trigger Callout */}
                          {q.resume_context && (
                            <div className="flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/70 p-2.5 rounded-xl">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>
                                <strong className="font-semibold">Why this question:</strong> {q.resume_context}
                              </span>
                            </div>
                          )}

                          {/* Evaluation Criteria / Ideal Answer */}
                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                              🎯 Interviewer Evaluation Criteria:
                            </span>
                            <p className="leading-relaxed text-slate-600">
                              {q.ideal_answer_criteria}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Empty State */
                <Card className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    No Resume Questions Generated Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Select an enrolled student from the left panel or paste any candidate's resume text, then click{' '}
                    <strong>"Formulate Tailored Questions"</strong> to generate deep, resume-grounded interview questions.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleGenerateQuestions}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition inline-flex items-center space-x-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Formulate Questions for {selectedCandidateObj?.full_name || 'Candidate'}</span>
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SKILLS CATALOG */}
      {activeTab === 'skills' && (
        <Card
          title="Platform Skills Catalog"
          subtitle="Standardized skill entities utilized for ATS parsing and autonomous peer matching"
          action={
            <button
              onClick={() => setShowAddSkill(!showAddSkill)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Platform Skill</span>
            </button>
          }
        >
          {/* Add Skill Form */}
          {showAddSkill && (
            <form onSubmit={handleAddSkill} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Catalog Entry</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Skill Name (e.g. Next.js, GraphQL)"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  required
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Programming Languages">Programming Languages</option>
                  <option value="Web Frameworks">Web Frameworks</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Databases">Databases</option>
                  <option value="Core CS">Core CS</option>
                  <option value="Architecture">Architecture</option>
                </select>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSkill(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          )}

          {/* Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skills.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{s.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteSkill(s.name)}
                  title="Delete skill"
                  className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: ASSESSMENT QUESTION BANK */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          {Object.entries(assessments).map(([skillKey, questions]) => (
            <Card
              key={skillKey}
              title={`Verification Questions: ${skillKey.toUpperCase()}`}
              subtitle={`${questions.length} multiple choice technical verification questions`}
            >
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id || i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-semibold text-slate-800 text-sm">
                      Q{i + 1}: {q.question}
                    </p>
                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg text-xs border ${
                              optIdx === q.correct_answer || optIdx === q.correct_index
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                            <span>{opt}</span>
                            {(optIdx === q.correct_answer || optIdx === q.correct_index) && (
                              <span className="ml-2 text-[10px] text-emerald-600 font-bold">✓ (Correct)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-slate-500 mt-2 italic bg-white p-2 rounded border border-slate-100">
                        💡 Rationale / Evaluation: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
