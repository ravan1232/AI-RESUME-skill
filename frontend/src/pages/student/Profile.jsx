import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { User, BookOpen, Clock, Plus, Trash2, Save, Sparkles, CheckCircle2 } from 'lucide-react';

export const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // New Skill inputs
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newTeachProficiency, setNewTeachProficiency] = useState('intermediate');
  const [newLearnSkill, setNewLearnSkill] = useState('');
  const [newLearnPriority, setNewLearnPriority] = useState('high');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/profile');
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const payload = {
        headline: profile.headline,
        bio: profile.bio,
        college: profile.college,
        department: profile.department,
        graduation_year: parseInt(profile.graduation_year, 10) || 2026,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        skills_can_teach: profile.skills_can_teach,
        skills_want_to_learn: profile.skills_want_to_learn,
        availability: profile.availability
      };

      const res = await api.put('/students/profile', payload);
      setProfile(res.data);
      showToast('Profile and skills updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addTeachSkill = () => {
    if (!newTeachSkill.trim()) return;
    const exists = profile.skills_can_teach?.some(
      (s) => s.skill_name.toLowerCase() === newTeachSkill.trim().toLowerCase()
    );
    if (exists) {
      showToast('Skill already in your teaching list', 'warning');
      return;
    }

    const updated = [
      ...(profile.skills_can_teach || []),
      {
        skill_name: newTeachSkill.trim(),
        proficiency: newTeachProficiency,
        years_of_experience: 1.0,
        verified: false,
        rating: 5.0
      }
    ];

    setProfile({ ...profile, skills_can_teach: updated });
    setNewTeachSkill('');
  };

  const removeTeachSkill = (index) => {
    const updated = [...profile.skills_can_teach];
    updated.splice(index, 1);
    setProfile({ ...profile, skills_can_teach: updated });
  };

  const addLearnSkill = () => {
    if (!newLearnSkill.trim()) return;
    const exists = profile.skills_want_to_learn?.some(
      (s) => s.skill_name.toLowerCase() === newLearnSkill.trim().toLowerCase()
    );
    if (exists) {
      showToast('Skill already in your learning list', 'warning');
      return;
    }

    const updated = [
      ...(profile.skills_want_to_learn || []),
      {
        skill_name: newLearnSkill.trim(),
        target_proficiency: 'intermediate',
        priority: newLearnPriority
      }
    ];

    setProfile({ ...profile, skills_want_to_learn: updated });
    setNewLearnSkill('');
  };

  const removeLearnSkill = (index) => {
    const updated = [...profile.skills_want_to_learn];
    updated.splice(index, 1);
    setProfile({ ...profile, skills_want_to_learn: updated });
  };

  const toggleDay = (day) => {
    const days = profile.availability?.days || [];
    let updated;
    if (days.includes(day)) {
      updated = days.filter((d) => d !== day);
    } else {
      updated = [...days, day];
    }
    setProfile({
      ...profile,
      availability: { ...profile.availability, days: updated }
    });
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Profile..." />;
  }

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Profile & Skill Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your credentials, teaching competencies, and placement goals.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-navy-900/20 flex items-center space-x-2 self-start sm:self-auto disabled:opacity-70"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Basic Academic Info */}
      <Card title="Academic & Professional Identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={profile?.full_name || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Headline
            </label>
            <input
              type="text"
              value={profile?.headline || ''}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              placeholder="e.g. Full-Stack Developer | Python & React"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              College / University
            </label>
            <input
              type="text"
              value={profile?.college || ''}
              onChange={(e) => setProfile({ ...profile, college: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <input
              type="text"
              value={profile?.department || ''}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Professional Bio
            </label>
            <textarea
              rows={3}
              value={profile?.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Brief summary of your placement interests, career ambitions, and technical passions..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>
        </div>
      </Card>

      {/* Skills I Can Teach */}
      <Card
        title="Skills I Can Teach (Peer Offerings)"
        subtitle="These skills make you discoverable to peers who have gaps in these areas"
      >
        <div className="space-y-4">
          {/* Add skill input */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="text"
              placeholder="e.g. React.js, Python, FastAPI, Docker"
              value={newTeachSkill}
              onChange={(e) => setNewTeachSkill(e.target.value)}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={newTeachProficiency}
              onChange={(e) => setNewTeachProficiency(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 capitalize"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              type="button"
              onClick={addTeachSkill}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center space-x-1 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>

          {/* List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile?.skills_can_teach?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800 text-sm">{item.skill_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {item.proficiency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Rating: 5.0 ⭐</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeTeachSkill(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Skills I Want to Learn */}
      <Card
        title="Skills I Want to Learn (Learning Goals)"
        subtitle="Used by our matching engine to connect you with suitable mentors"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="text"
              placeholder="e.g. Kubernetes, AWS, System Design, DSA"
              value={newLearnSkill}
              onChange={(e) => setNewLearnSkill(e.target.value)}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={newLearnPriority}
              onChange={(e) => setNewLearnPriority(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 capitalize"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <button
              type="button"
              onClick={addLearnSkill}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center space-x-1 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile?.skills_want_to_learn?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition"
              >
                <div>
                  <span className="font-semibold text-slate-800 text-sm">{item.skill_name}</span>
                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 capitalize">
                    {item.priority}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeLearnSkill(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Availability Management */}
      <Card title="Exchange Availability" subtitle="Select the days and time windows when you can host peer tutoring sessions">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Available Days
            </label>
            <div className="flex flex-wrap gap-2">
              {allDays.map((day) => {
                const isSelected = profile.availability?.days?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

