import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Users, GraduationCap, ShieldCheck, Activity, Search, Award } from 'lucide-react';

export const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample managed students data
  const students = [
    {
      id: 'usr-1',
      name: 'Sarah Connor',
      email: 'sarah.connor@university.edu',
      role: 'student',
      readiness: 78,
      ats: 82,
      teaches: ['Python & FastAPI'],
      status: 'active'
    },
    {
      id: 'usr-2',
      name: 'Priya Sharma',
      email: 'priya.sharma@university.edu',
      role: 'student',
      readiness: 85,
      ats: 88,
      teaches: ['Docker', 'Kubernetes'],
      status: 'active'
    },
    {
      id: 'usr-3',
      name: 'Devon Vance',
      email: 'devon.vance@university.edu',
      role: 'student',
      readiness: 64,
      ats: 70,
      teaches: ['React.js', 'Tailwind'],
      status: 'active'
    }
  ];

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Platform Administration & Analytics</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Control Console</h1>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          Oversee student enrollment, placement readiness benchmarks, peer exchange metrics, and skill assessment banks.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Enrolled</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-extrabold text-navy-950">248</p>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">+12 this week</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Placement Score</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-extrabold text-navy-950">76%</p>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-3">↑ 5.2% vs last term</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Peer Exchanges</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-extrabold text-navy-950">142</p>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">89 Completed</p>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified Skills</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-extrabold text-navy-950">312</p>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Tested via Question Bank</p>
        </Card>
      </div>

      {/* Student Management Table */}
      <Card
        title="Student Directory & Readiness Status"
        subtitle="Live snapshot of registered students and their placement readiness"
        action={
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students..."
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
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">ATS Score</th>
                <th className="px-4 py-3">Skills Offered</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{s.email}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-blue-600">{s.readiness}%</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-emerald-600">{s.ats}%</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {s.teaches.map((skill, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

