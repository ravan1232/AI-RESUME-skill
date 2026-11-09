import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { BotMessageSquare, Sparkles, Send, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

export const MockInterview = () => {
  const [domain, setDomain] = useState('Backend & Systems');
  const [role, setRole] = useState('Full-Stack Software Engineer');
  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    startInterview();
  }, [domain]);

  const startInterview = async () => {
    try {
      setLoading(true);
      setEvaluation(null);
      setAnswer('');
      const res = await api.post('/ai/mock-interview/start', {
        role: role,
        domain: domain,
        difficulty: 'intermediate'
      });
      setQuestionData(res.data);
    } catch (err) {
      console.error(err);
      showToast('Error generating interview question', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      showToast('Please provide an answer before submitting', 'warning');
      return;
    }

    try {
      setEvaluating(true);
      const res = await api.post('/ai/mock-interview/submit', {
        question: questionData.question,
        answer: answer.trim()
      });
      setEvaluation(res.data);
      showToast(`Interview answer evaluated! Score: ${res.data.score}/10`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to evaluate answer', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-amber-950 rounded-3xl p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <BotMessageSquare className="w-3.5 h-3.5" />
          <span>Groq LLaMA Mock Interview Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Placement Mock Interview</h1>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          Simulate real campus placement technical rounds with instant AI evaluation of your architectural depth, communication clarity, and problem-solving method.
        </p>

        {/* Domain Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          {['Backend & Systems', 'Frontend & Architecture', 'DevOps & Cloud'].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDomain(d);
                setRole(d === 'Frontend & Architecture' ? 'React Developer' : d === 'DevOps & Cloud' ? 'DevOps Engineer' : 'Full-Stack Software Engineer');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                domain === d
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              🎤 {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Generating Technical Scenario..." />
      ) : (
        <div className="space-y-6">
          {/* Question Card */}
          <Card title="Interview Question" subtitle={`Target Role: ${role}`}>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                "{questionData?.question}"
              </p>
              {questionData?.hints && (
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200/80 italic">
                  💡 Interviewer Hint: {questionData.hints}
                </p>
              )}
            </div>

            {/* Answer Input */}
            {!evaluation ? (
              <form onSubmit={handleSubmitAnswer} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Your Response (Explain step-by-step using STAR format):
                  </label>
                  <textarea
                    rows={6}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    required
                    placeholder="Structure your answer: Explain high-level architecture, chosen data structures, algorithmic complexity, trade-offs, and edge case handling..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="submit"
                    disabled={evaluating}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {evaluating ? (
                      <span>Evaluating Response...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for AI Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Evaluation Results */
              <div className="mt-6 space-y-5 animate-fade-in border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">Interviewer Assessment</h4>
                    <p className="text-xs text-amber-800 mt-0.5">{evaluation.feedback}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-amber-800 uppercase block">Score</span>
                    <span className="text-3xl font-extrabold text-amber-900">{evaluation.score}/10</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <h5 className="font-bold text-xs uppercase text-emerald-800 mb-2">Strengths Demonstrated</h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {evaluation.strengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl">
                    <h5 className="font-bold text-xs uppercase text-rose-800 mb-2">Areas for Improvement</h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {evaluation.improvements?.map((imp, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={startInterview}
                    className="px-5 py-2 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-md flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Another Question</span>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
