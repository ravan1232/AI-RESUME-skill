import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users2,
  Calendar,
  Send,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const JOB_PRESETS = [
  {
    title: "Full-Stack Software Engineer",
    company: "Acme Tech Solutions",
    description: "We are seeking a Full-Stack Engineer with strong expertise in Python, FastAPI, React.js, Docker containerization, PostgreSQL, and Git version control. Experience with microservices, Redis caching, and CI/CD pipelines is a major plus."
  },
  {
    title: "Cloud & DevOps Specialist",
    company: "CloudScale Systems",
    description: "Looking for an aspiring Cloud Engineer proficient in Docker, Kubernetes cluster orchestration, AWS cloud services (S3, EC2, IAM), CI/CD workflows, Linux administration, and System Design fundamentals."
  },
  {
    title: "AI & Distributed Systems Developer",
    company: "NexGen Labs",
    description: "Seeking a passionate developer with deep fundamentals in Data Structures & Algorithms, Python, FastAPI microservices, System Design, REST APIs, and database design with PostgreSQL and MongoDB."
  }
];

export const JobMatcher = () => {
  const [jobTitle, setJobTitle] = useState(JOB_PRESETS[0].title);
  const [companyName, setCompanyName] = useState(JOB_PRESETS[0].company);
  const [jobDesc, setJobDesc] = useState(JOB_PRESETS[0].description);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Exchange Request Modal
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [skillOffered, setSkillOffered] = useState('React.js');
  const [skillRequested, setSkillRequested] = useState('Docker');
  const [exchangeNote, setExchangeNote] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      setLoadingInitial(true);
      const res = await api.get('/jobs/latest');
      if (res.data?.has_analysis) {
        setAnalysisResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setJobTitle(preset.title);
    setCompanyName(preset.company);
    setJobDesc(preset.description);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jobDesc.trim()) {
      showToast('Please enter a job description', 'warning');
      return;
    }

    try {
      setAnalyzing(true);
      const res = await api.post('/jobs/analyze', {
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDesc
      });
      setAnalysisResult(res.data);
      showToast(`Gap analysis complete! Match: ${res.data.match_percentage}%`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error analyzing job description', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const openExchangeModal = (peer, targetSkill) => {
    setSelectedPeer(peer);
    setSkillRequested(targetSkill || peer.skills_they_can_teach[0]?.skill_name || 'Docker');
    setExchangeNote(`Hi ${peer.peer_name}, I saw you teach ${targetSkill || 'this skill'}. Would love to exchange and learn together!`);
  };

  const handleSendExchangeRequest = async (e) => {
    e.preventDefault();
    if (!selectedPeer) return;

    try {
      setSendingRequest(true);
      await api.post('/exchange/request', {
        provider_id: selectedPeer.peer_id,
        skill_offered: skillOffered,
        skill_requested: skillRequested,
        notes: exchangeNote
      });
      showToast(`Exchange request sent to ${selectedPeer.peer_name}!`, 'success');
      setSelectedPeer(null);
      navigate('/exchange');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to send exchange request', 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner size="lg" text="Loading Job Gap Engine..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Placement Critical Integration Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Job Gap & Peer Matchmaker</h1>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          Paste any placement job description to extract required skills, compute missing competencies, generate a personalized learning roadmap, and instantly match with campus peer mentors.
        </p>
      </div>

      {/* Preset Buttons */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Quick Preset Job Openings:
        </p>
        <div className="flex flex-wrap gap-2">
          {JOB_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 shadow-sm transition"
            >
              💼 {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <Card title="Target Placement Opportunity">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Role Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Job Description / Requirements Text
            </label>
            <textarea
              rows={4}
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={analyzing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/20 flex items-center space-x-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Skill Gaps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Placement Match</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* ANALYSIS RESULTS */}
      {analysisResult && (
        <div className="space-y-8 animate-fade-in">
          {/* Match Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-l-4 border-l-blue-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Placement Match Score</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-4xl font-extrabold text-navy-950">
                  {analysisResult.match_percentage}%
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {analysisResult.match_percentage >= 75 ? 'Strong Match' : 'Actionable Gaps'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${analysisResult.match_percentage}%` }}
                />
              </div>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Matched Skills</p>
              <p className="text-4xl font-extrabold text-navy-950 mt-2">
                {analysisResult.matched_skills?.length || 0}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {analysisResult.matched_skills?.map((s, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Missing Skills (Gaps)</p>
              <p className="text-4xl font-extrabold text-navy-950 mt-2">
                {analysisResult.missing_skills?.length || 0}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {analysisResult.missing_skills?.map((s, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                    ! {s}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* CRITICAL INTEGRATION: AUTONOMOUS PEER MENTORS */}
          <Card
            title="Recommended Campus Peer Mentors"
            subtitle="Autonomous matching: fellow students who teach your exact missing skills"
          >
            {analysisResult.recommended_partners?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.recommended_partners.map((peer, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-sm transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{peer.peer_name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{peer.headline}</p>
                          <p className="text-[11px] text-slate-400">{peer.college} • {peer.department}</p>
                        </div>
                        <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                          {peer.compatibility_score}% Match
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                          Can Teach You:
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {peer.skills_they_can_teach?.map((item, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                            >
                              ⭐ {item.skill_name} ({item.proficiency})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openExchangeModal(peer, peer.skills_they_can_teach[0]?.skill_name)}
                      className="mt-5 w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Exchange Request</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-sm">
                No peer mentors found for these missing skills yet.
              </div>
            )}
          </Card>

          {/* Personalized Learning Roadmap */}
          <Card title="Personalized Learning Roadmap" subtitle="Milestone schedule to close your placement gaps">
            <div className="space-y-4">
              {analysisResult.learning_roadmap?.map((step) => (
                <div key={step.step} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded">
                        Step {step.step}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">{step.skill}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        {step.priority} Priority
                      </span>
                    </div>
                    <ul className="text-xs text-slate-600 pl-4 list-disc space-y-0.5 mt-2">
                      {step.milestones?.map((m, mi) => (
                        <li key={mi}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-slate-500 block">Est: {step.estimated_hours} Hours</span>
                    <Link
                      to="/assessments"
                      className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Take Verification Quiz →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Exchange Request Modal */}
      {selectedPeer && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Send Peer Skill Exchange Request
            </h3>
            <p className="text-xs text-slate-500">
              Propose an exchange with <span className="font-semibold text-slate-800">{selectedPeer.peer_name}</span>.
            </p>

            <form onSubmit={handleSendExchangeRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Skill You Want to Learn (from {selectedPeer.peer_name})
                </label>
                <input
                  type="text"
                  value={skillRequested}
                  onChange={(e) => setSkillRequested(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Skill You Offer to Teach in Return
                </label>
                <input
                  type="text"
                  value={skillOffered}
                  onChange={(e) => setSkillOffered(e.target.value)}
                  placeholder="e.g. Python, React.js, FastAPI"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Personal Intro Message
                </label>
                <textarea
                  rows={3}
                  value={exchangeNote}
                  onChange={(e) => setExchangeNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-md flex items-center space-x-1.5"
                >
                  {sendingRequest ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
