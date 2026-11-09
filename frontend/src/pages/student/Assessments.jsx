import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Award, CheckCircle2, XCircle, ArrowRight, Sparkles, Clock, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Assessments = () => {
  const [skillsList, setSkillsList] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('Docker');
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAvailableSkills();
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      loadQuiz(selectedSkill);
    }
  }, [selectedSkill]);

  const fetchAvailableSkills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments/skills');
      setSkillsList(res.data.skills || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async (skillName) => {
    try {
      setLoading(true);
      setResult(null);
      setAnswers({});
      const res = await api.get(`/assessments/skill/${skillName}`);
      setQuizData(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load quiz questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length < (quizData?.questions?.length || 5)) {
      showToast('Please answer all questions before submitting', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/assessments/submit', {
        skill_name: selectedSkill,
        answers: answers
      });
      setResult(res.data);
      if (res.data.passed) {
        showToast(res.data.message, 'success');
      } else {
        showToast(res.data.message, 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast('Error submitting assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !quizData) {
    return <LoadingSpinner size="lg" text="Loading Placement Verification Tests..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-emerald-950 rounded-3xl p-8 text-white shadow-xl shadow-navy-950/20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Award className="w-3.5 h-3.5" />
          <span>Skill Verification & Readiness Booster</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Technical Competency Assessment</h1>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          Verify skills acquired during peer tutoring sessions. Achieving $\ge 70\%$ automatically marks the skill as <span className="font-bold text-emerald-300">Verified</span> in MongoDB Atlas and boosts your placement readiness score!
        </p>

        {/* Skill Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          {skillsList.map((s) => (
            <button
              key={s.skill_name}
              onClick={() => setSelectedSkill(s.skill_name)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedSkill === s.skill_name
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              🎯 {s.skill_name} Test ({s.question_count} MCQs)
            </button>
          ))}
        </div>
      </div>

      {/* QUIZ INTERFACE OR RESULTS */}
      {!result ? (
        <Card title={`Assessment: ${selectedSkill}`} subtitle="Passing score: 70% (at least 4 out of 5 correct)">
          <form onSubmit={handleSubmit} className="space-y-6">
            {quizData?.questions?.map((q, idx) => (
              <div key={q.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="font-bold text-slate-900 text-sm">
                  {idx + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      onClick={() => handleSelectAnswer(q.id, optIdx)}
                      className={`flex items-center space-x-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                        answers[q.id] === optIdx
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        checked={answers[q.id] === optIdx}
                        onChange={() => {}}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500">
                Answered {Object.keys(answers).length} of {quizData?.questions?.length || 5} questions
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <span>Submit & Verify Skill</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>
      ) : (
        /* RESULTS VIEW */
        <div className="space-y-6 animate-fade-in">
          <Card className={result.passed ? 'border-2 border-emerald-500' : 'border-2 border-amber-500'}>
            <div className="text-center py-6">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {result.passed ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {result.passed ? 'Skill Successfully Verified!' : 'Verification Incomplete'}
              </h2>
              <p className="text-4xl font-extrabold text-navy-950 mt-2">{result.score_percentage}%</p>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">{result.message}</p>

              {result.passed && (
                <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Your profile verified skills count and technical placement score have been updated in MongoDB Atlas!</span>
                </div>
              )}

              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => loadQuiz(selectedSkill)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Test</span>
                </button>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-md"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </Card>

          {/* Detailed Question Review */}
          <Card title="Question Performance & Solutions">
            <div className="space-y-4">
              {result.feedback?.map((f, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    f.is_correct ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-slate-800 text-sm">
                      {i + 1}. {f.question}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      f.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {f.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-lg border border-slate-100">
                    💡 Explanation: {f.explanation}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
