import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/student/Dashboard';
import { Profile } from './pages/student/Profile';
import { ResumeAnalyzer } from './pages/student/ResumeAnalyzer';
import { JobMatcher } from './pages/student/JobMatcher';
import { SkillExchange } from './pages/student/SkillExchange';
import { Chat } from './pages/student/Chat';
import { MockInterview } from './pages/student/MockInterview';
import { Assessments } from './pages/student/Assessments';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Protected Layout */}
            <Route element={<StudentLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
              <Route path="/job-matcher" element={<JobMatcher />} />
              <Route path="/exchange" element={<SkillExchange />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/mock-interview" element={<MockInterview />} />
              <Route path="/assessments" element={<Assessments />} />
            </Route>

            {/* Admin Protected Layout */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminDashboard />} />
              <Route path="/admin/skills" element={<AdminDashboard />} />
              <Route path="/admin/assessments" element={<AdminDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

