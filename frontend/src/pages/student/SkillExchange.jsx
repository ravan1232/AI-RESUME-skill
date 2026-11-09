import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Users2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  Star,
  Send,
  Plus,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SkillExchange = () => {
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);

  // Scheduling Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulePeerId, setSchedulePeerId] = useState('');
  const [scheduleExchangeId, setScheduleExchangeId] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionTime, setSessionTime] = useState('2026-11-12T18:00');

  // Rating Modal
  const [ratingSessionId, setRatingSessionId] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingReview, setRatingReview] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchExchangeData();
  }, []);

  const fetchExchangeData = async () => {
    try {
      setLoading(true);
      const [reqRes, sessRes, matchRes] = await Promise.all([
        api.get('/exchange/requests'),
        api.get('/exchange/sessions'),
        api.get('/exchange/matches')
      ]);
      setRequests(reqRes.data);
      setSessions(sessRes.data.sessions || []);
      setMatches(matchRes.data.matches || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading exchange data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (exchangeId, status) => {
    try {
      await api.put(`/exchange/requests/${exchangeId}/status`, { status });
      showToast(`Exchange request ${status}!`, 'success');
      fetchExchangeData();
    } catch (err) {
      showToast('Failed to update request', 'error');
    }
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exchange/sessions', {
        exchange_id: scheduleExchangeId || 'ex-general',
        peer_id: schedulePeerId,
        skill_topic: sessionTopic,
        scheduled_at: sessionTime,
        duration_minutes: 60
      });
      showToast('Learning session scheduled successfully!', 'success');
      setShowScheduleModal(false);
      fetchExchangeData();
    } catch (err) {
      showToast('Failed to schedule session', 'error');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!ratingSessionId) return;
    try {
      await api.post(`/exchange/sessions/${ratingSessionId}/feedback`, {
        rating: ratingStars,
        review: ratingReview
      });
      showToast('Feedback submitted! Peer karma updated.', 'success');
      setRatingSessionId(null);
      fetchExchangeData();
    } catch (err) {
      showToast('Failed to submit feedback', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Peer Exchange Marketplace..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Users2 className="w-3.5 h-3.5" />
          <span>Peer-to-Peer Learning Network</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Skill Exchange Hub</h1>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          Manage your active exchange proposals, schedule live 1-on-1 tutoring sessions, and review peer feedback to boost campus karma.
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
          >
            📬 Exchange Requests ({requests.incoming.length + requests.outgoing.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'sessions'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
          >
            📅 Scheduled Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'mentors'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
          >
            🌟 Browse Campus Mentors ({matches.length})
          </button>
        </div>
      </div>

      {/* TAB 1: EXCHANGE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming */}
          <Card title="Incoming Proposals" subtitle="Peers offering skills to learn from you">
            {requests.incoming.length > 0 ? (
              <div className="space-y-3">
                {requests.incoming.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{req.peer_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Offers to teach: <span className="font-semibold text-blue-600">{req.skill_offered}</span> • Wants to learn: <span className="font-semibold text-indigo-600">{req.skill_requested}</span>
                      </p>
                      {req.notes && <p className="text-xs text-slate-500 italic mt-1">"{req.notes}"</p>}
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'accepted')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                          >
                            Decline
                          </button>
                        </>
                      ) : req.status === 'accepted' ? (
                        <div className="flex space-x-2">
                          <Link
                            to="/chat"
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </Link>
                          <button
                            onClick={() => {
                              setScheduleExchangeId(req.id);
                              setSchedulePeerId(req.peer_id);
                              setSessionTopic(req.skill_requested);
                              setShowScheduleModal(true);
                            }}
                            className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg"
                          >
                            Schedule Session
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No incoming exchange requests at this time.</p>
            )}
          </Card>

          {/* Outgoing */}
          <Card title="Outgoing Proposals" subtitle="Requests you have sent to fellow peers">
            {requests.outgoing.length > 0 ? (
              <div className="space-y-3">
                {requests.outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800 text-sm">To: {req.peer_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested: <span className="font-semibold text-blue-600">{req.skill_requested}</span> • Offered: <span className="font-semibold text-slate-700">{req.skill_offered}</span>
                      </p>
                    </div>

                    {req.status === 'accepted' && (
                      <Link
                        to="/chat"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No outgoing exchange requests sent yet.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: SESSIONS */}
      {activeTab === 'sessions' && (
        <Card title="Live Learning Sessions" subtitle="Scheduled peer tutoring and milestone tracking">
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                        {sess.status.toUpperCase()}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">{sess.skill_topic}</h4>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(sess.scheduled_at).toLocaleString()} ({sess.duration_minutes} mins)</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <a
                      href={sess.meeting_link || 'https://meet.skillbridge.ai'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meeting</span>
                    </a>
                    {sess.status !== 'completed' && (
                      <button
                        onClick={() => setRatingSessionId(sess.id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                      >
                        Rate Session
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              No sessions scheduled yet. Accept an exchange request to schedule a peer session!
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: BROWSE MENTORS */}
      {activeTab === 'mentors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((peer, idx) => (
            <div
              key={idx}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{peer.peer_name}</h4>
                    <p className="text-xs text-slate-500">{peer.headline}</p>
                    <p className="text-[11px] text-slate-400">{peer.college} • {peer.department}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg">
                    ⭐ {peer.rating}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Skills Available to Teach:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {peer.skills_they_teach?.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
                      >
                        {item.skill_name} ({item.proficiency})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                to="/job-matcher"
                className="mt-5 w-full py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-xs transition text-center shadow-md"
              >
                Match via Job Gap
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Schedule Learning Session</h3>
            <form onSubmit={handleScheduleSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Topic / Target Skill
                </label>
                <input
                  type="text"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  required
                  placeholder="e.g. Docker Volumes & Compose Hands-on"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-md"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Feedback Modal */}
      {ratingSessionId && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Peer Session Feedback</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex space-x-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className={`text-2xl transition ${star <= ratingStars ? 'opacity-100 scale-110' : 'opacity-30'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Review Comment
                </label>
                <textarea
                  rows={3}
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  placeholder="Share how helpful the session was..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingSessionId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-500 shadow-md"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
