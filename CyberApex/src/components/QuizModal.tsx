'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/api';

interface Answer   { id: string; text: string; orderIndex: number }
interface Question { id: string; text: string; type: 'single_choice' | 'multi_choice' | 'true_false'; points: number; answers: Answer[] }
interface Quiz     { id: string; title: string; timeLimitSecs: number; passingScore: number; questions: Question[] }

interface QuizModalProps {
  quiz: Quiz;
  enrollmentId: string;
  onClose: () => void;
  onPassed: (score: number) => void;
}

type QuizPhase = 'intro' | 'taking' | 'result';

export function QuizModal({ quiz, enrollmentId, onClose, onPassed }: QuizModalProps) {
  const [phase,       setPhase]       = useState<QuizPhase>('intro');
  const [attemptId,   setAttemptId]   = useState<string | null>(null);
  const [selections,  setSelections]  = useState<Record<string, string[]>>({});
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitSecs || 0);
  const [result,      setResult]      = useState<{ score: number; passed: boolean; feedback?: unknown } | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  // Countdown timer
  useEffect(() => {
    if (phase !== 'taking' || !quiz.timeLimitSecs) return;
    if (secondsLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  });

  const startQuiz = async () => {
    setError('');
    try {
      const { data } = await apiClient.post(`/v1/quizzes/${quiz.id}/attempts`, {
        enrollmentId,
      });
      setAttemptId(data.data.id);
      setSecondsLeft(quiz.timeLimitSecs || 0);
      setPhase('taking');
    } catch (e: any) {
      setError(e.response?.data?.error?.message ?? e.message);
    }
  };

  const toggle = (questionId: string, answerId: string, type: Question['type']) => {
    setSelections((prev) => {
      const current = prev[questionId] ?? [];
      if (type === 'multi_choice') {
        return {
          ...prev,
          [questionId]: current.includes(answerId)
            ? current.filter((id) => id !== answerId)
            : [...current, answerId],
        };
      }
      return { ...prev, [questionId]: [answerId] };
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const answers = quiz.questions.map((q) => ({
        questionId:        q.id,
        selectedAnswerIds: selections[q.id] ?? [],
      }));
      const { data } = await apiClient.post(`/v1/quizzes/${quiz.id}/attempts/${attemptId}/submit`, {
        answers,
      });
      setResult(data.data);
      setPhase('result');
      if (data.data.passed) onPassed(data.data.score);
    } catch (e: any) {
      setError(e.response?.data?.error?.message ?? e.message);
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, quiz, selections, submitting, onPassed]);

  const q     = quiz.questions[currentIdx];
  const total = quiz.questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{quiz.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* ── INTRO PHASE ───────────────────────────────────────────────────── */}
        {phase === 'intro' && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-400">Questions</div>
                <div className="text-white font-semibold text-xl">{total}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-400">Passing Score</div>
                <div className="text-white font-semibold text-xl">{quiz.passingScore}%</div>
              </div>
              {quiz.timeLimitSecs > 0 && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400">Time Limit</div>
                  <div className="text-white font-semibold text-xl">{Math.ceil(quiz.timeLimitSecs / 60)} min</div>
                </div>
              )}
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={startQuiz}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition"
            >
              Start Quiz
            </button>
          </div>
        )}

        {/* ── TAKING PHASE ──────────────────────────────────────────────────── */}
        {phase === 'taking' && q && (
          <div className="p-6 space-y-5">
            {/* Progress + timer */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Question {currentIdx + 1} / {total}</span>
              {quiz.timeLimitSecs > 0 && (
                <span className={secondsLeft < 60 ? 'text-red-400 font-semibold' : ''}>
                  ⏱ {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-cyan-500 h-1.5 rounded-full transition-all"
                style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
              />
            </div>

            {/* Question */}
            <p className="text-white text-base font-medium">{q.text}</p>
            <p className="text-gray-500 text-xs">
              {q.type === 'multi_choice' ? 'Select all that apply' : 'Select one'}
            </p>

            {/* Answers */}
            <div className="space-y-2">
              {q.answers.map((a) => {
                const selected = (selections[q.id] ?? []).includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggle(q.id, a.id, q.type)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition text-sm ${
                      selected
                        ? 'border-cyan-500 bg-cyan-900/40 text-cyan-100'
                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {a.text}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {currentIdx > 0 && (
                <button
                  onClick={() => setCurrentIdx((i) => i - 1)}
                  className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition text-sm"
                >
                  ← Previous
                </button>
              )}
              {currentIdx < total - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-semibold transition text-sm"
                >
                  {submitting ? 'Submitting…' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── RESULT PHASE ──────────────────────────────────────────────────── */}
        {phase === 'result' && result && (
          <div className="p-6 text-center space-y-5">
            <div className={`text-6xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
              {result.score}%
            </div>
            <div className={`text-xl font-semibold ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
              {result.passed ? '🎉 Passed!' : '✗ Not Passed'}
            </div>
            <p className="text-gray-400 text-sm">
              {result.passed
                ? `Congratulations! You scored ${result.score}% — above the passing threshold of ${quiz.passingScore}%.`
                : `You scored ${result.score}%. You need ${quiz.passingScore}% to pass. Please try again.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={onClose} className="px-6 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition text-sm">
                Close
              </button>
              {!result.passed && (
                <button
                  onClick={() => { setPhase('intro'); setSelections({}); setAttemptId(null); setResult(null); }}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition text-sm"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
