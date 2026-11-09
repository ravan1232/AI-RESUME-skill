import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [latestResume, setLatestResume] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchLatestResume();
  }, []);

  const fetchLatestResume = async () => {
    try {
      setLoadingInitial(true);
      const res = await api.get('/resumes/latest');
      if (res.data?.has_resume) {
        setLatestResume(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        showToast('Please upload a PDF document (.pdf)', 'warning');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a PDF resume file first', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setAnalyzing(true);
      const res = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLatestResume({
        has_resume: true,
        filename: res.data.filename,
        ats_score: res.data.ats_score,
        extracted_skills: res.data.extracted_skills,
        word_count: res.data.word_count,
        strengths: res.data.strengths,
        improvements: res.data.improvements,
        created_at: new Date().toISOString()
      });
      showToast(`Resume parsed successfully! ATS Score: ${res.data.ats_score}%`, 'success');
      setFile(null);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Resume analysis failed. Ensure it is a valid text PDF.';
      showToast(msg, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner size="lg" text="Loading Resume Intelligence..." />;
  }

  const atsScore = latestResume?.ats_score || 0;
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-3xl p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PyPDF2 Extraction & ATS Diagnostic Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Resume & ATS Scorer</h1>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          Upload your PDF resume to extract technical keywords, evaluate structural ATS compliance, and update your baseline placement readiness score.
        </p>
      </div>

      {/* Upload Box */}
      <Card title="Upload PDF Resume" subtitle="Supported format: .pdf (under 5MB)">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors rounded-2xl p-8 text-center bg-slate-50/50">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              {file ? file.name : 'Select or drag your PDF resume here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Extracts skills, action verbs, and section headers automatically.
            </p>
            <label className="mt-4 inline-block px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-sm transition">
              Browse PDF File
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || analyzing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/20 flex items-center space-x-2"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting & Scoring...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Run ATS Diagnostic</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Latest Analysis Results */}
      {latestResume && (
        <div className="space-y-6 animate-fade-in">
          {/* Score Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-l-4 border-l-blue-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall ATS Score</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-4xl font-extrabold text-navy-950">{atsScore}%</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreColor(atsScore)}`}>
                  {atsScore >= 80 ? 'Highly Competitive' : atsScore >= 65 ? 'Good Baseline' : 'Needs Optimization'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${atsScore}%` }}
                />
              </div>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Technical Skills Extracted</p>
              <p className="text-4xl font-extrabold text-navy-950 mt-2">
                {latestResume.extracted_skills?.length || 0}
              </p>
              <p className="text-xs text-slate-400 mt-4">Synced to your placement profile</p>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Document Word Count</p>
              <p className="text-4xl font-extrabold text-navy-950 mt-2">
                {latestResume.word_count || 340}
              </p>
              <p className="text-xs text-slate-400 mt-4">Optimal ATS range: 300 - 650 words</p>
            </Card>
          </div>

          {/* Extracted Skills Cloud */}
          <Card title="Detected Technical Skills" subtitle="These keywords are recognized by recruiting parsers">
            <div className="flex flex-wrap gap-2">
              {latestResume.extracted_skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="ATS Strengths" subtitle="Positive formatting and keyword indicators">
              <ul className="space-y-2.5 text-xs text-slate-600">
                {latestResume.strengths?.map((str, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Recommended Optimizations" subtitle="High-impact changes to improve interview shortlisting">
              <ul className="space-y-2.5 text-xs text-slate-600">
                {latestResume.improvements?.map((imp, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Next Step Callout */}
          <div className="p-6 bg-gradient-to-r from-blue-900 to-navy-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base">Next Step: Job Description Gap Analysis</h3>
              <p className="text-xs text-slate-300 mt-1">
                Compare your extracted skills against specific job openings to uncover missing skills and find peer mentors!
              </p>
            </div>
            <Link
              to="/job-matcher"
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl text-xs transition shadow-md whitespace-nowrap flex items-center space-x-1.5"
            >
              <span>Launch Job Matcher</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
