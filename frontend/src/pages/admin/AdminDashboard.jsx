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
  Award
} from 'lucide-react';

export const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Tab state derived from URL
  const getInitialTab = () => {
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

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  useEffect(() => {
    fetchAdminData();
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

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Administrator Control Center..." />;
  }

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Manage enrolled students, monitor placement readiness benchmarks, oversee skill catalogs, and maintain assessment banks.
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
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">Live in MongoDB Atlas</p>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Placement Score</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-3xl font-extrabold text-navy-950">{overview?.average_readiness_score || 78}%</p>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-3">Campus readiness baseline</p>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Peer Exchanges</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-3xl font-extrabold text-navy-950">{overview?.total_exchanges || 0}</p>
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">Peer tutoring sessions</p>
            </Card>

            <Card className="border-l-4 border-l-amber-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Catalog Skills</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-3xl font-extrabold text-navy-950">{skills.length}</p>
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                  <Award className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">Standardized industry skills</p>
            </Card>
          </div>

          {/* Quick Snapshot Table */}
          <Card
            title="Recent Student Enrollments"
            subtitle="Top student profiles indexed for placement readiness"
            action={
              <button
                onClick={() => handleTabChange('users')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All Students →
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Readiness</th>
                    <th className="px-4 py-3">Skills Offered</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.slice(0, 4).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{u.full_name}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-600">{u.readiness_score}%</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {u.skills_offered?.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
                  <th className="px-4 py-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
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
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
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

      {/* TAB 3: SKILLS CATALOG */}
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

      {/* TAB 4: ASSESSMENT QUESTION BANK */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-lg text-xs border ${
                            optIdx === q.correct_answer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                          {optIdx === q.correct_answer && (
                            <span className="ml-2 text-[10px] text-emerald-600 font-bold">✓ (Correct)</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-slate-500 mt-2 italic bg-white p-2 rounded border border-slate-100">
                        💡 Rationale: {q.explanation}
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
