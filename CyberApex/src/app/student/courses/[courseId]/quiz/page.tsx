'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/utils/api';

export default function StudentQuizPage() {
    const { courseId } = useParams();
    const searchParams  = useSearchParams();
    const lessonId      = searchParams.get('lessonId');
    const router        = useRouter();

    const [quiz,                 setQuiz]                 = useState<any>(null);
    const [loading,              setLoading]              = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers,              setAnswers]              = useState<Record<number, number>>({});
    const [quizFinished,         setQuizFinished]         = useState(false);
    const [score,                setScore]                = useState(0);

    useEffect(() => {
        if (!lessonId) { setLoading(false); return; }
        apiClient.get(`/student/courses/${courseId}`)
            .then(res => {
                const data = res.data?.data ?? res.data;
                let foundQuiz: any = null;
                (data.curriculum ?? data.modules ?? []).forEach((mod: any) => {
                    mod.lessons?.forEach((lesson: any) => {
                        if (lesson.id === lessonId) {
                            const q = lesson.quiz || (lesson.quizzes && lesson.quizzes[0]);
                            if (q) foundQuiz = q;
                        }
                    });
                });
                if (foundQuiz) setQuiz(foundQuiz);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [courseId, lessonId]);

    const handleSelectOption = (qIndex: number, optionIndex: number) => {
        setAnswers({ ...answers, [qIndex]: optionIndex });
    };

    const handleNext = () => {
        if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleFinishQuiz();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
    };

    const handleFinishQuiz = async () => {
        let correctCount = 0;
        quiz.questions.forEach((q: any, idx: number) => {
            if (answers[idx] === q.correct_answer) correctCount++;
        });
        const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
        setScore(finalScore);
        setQuizFinished(true);

        const passMark = quiz.pass_mark || 70;
        if (finalScore >= passMark) {
            try {
                await apiClient.patch('/student/progress', {
                    course_id:  courseId,
                    lesson_id:  lessonId,
                    progress:   100,
                });
            } catch (err) {
                console.error('Progress update failed:', err);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="p-16 rounded-2xl bg-white border border-dashed border-slate-300 text-center max-w-2xl mx-auto">
                <p className="text-5xl mb-4">🚫</p>
                <h3 className="text-xl font-bold text-slate-700">Quiz Not Found</h3>
                <p className="text-slate-500 mt-2">No quiz questions are available for this chapter.</p>
                <button onClick={() => router.back()} className="mt-6 px-6 py-2 bg-cyan-600 text-white rounded-lg">Go Back</button>
            </div>
        );
    }

    if (quizFinished) {
        const passed = score >= (quiz.pass_mark || 70);
        return (
            <div className="max-w-3xl mx-auto p-12 rounded-3xl bg-white shadow-xl border border-slate-200 text-center">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg ${passed ? 'bg-green-100 text-green-500 shadow-green-500/20' : 'bg-red-100 text-red-500 shadow-red-500/20'}`}>
                    {passed ? (
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{passed ? 'Congratulations!' : 'Keep Trying!'}</h2>
                <p className="text-lg text-slate-600 mb-8">
                    You scored <span className={`font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>{score}%</span> (Pass mark: {quiz.pass_mark || 70}%)
                </p>

                <div className="flex gap-4 justify-center">
                    {!passed && (
                        <button onClick={() => { setQuizFinished(false); setCurrentQuestionIndex(0); setAnswers({}); }}
                            className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors">
                            Retake Quiz
                        </button>
                    )}
                    <button onClick={() => router.push(`/student/courses/${courseId}`)}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all">
                        {passed ? 'Continue Course' : 'Review Course Material'}
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progressPct     = (currentQuestionIndex / quiz.questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{quiz.title}</h2>
                    <p className="text-slate-500 mt-1">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
                </div>
                <button onClick={() => router.back()} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                    Exit Quiz
                </button>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 mb-10 overflow-hidden">
                <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-10 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500"></div>
                <h3 className="text-xl font-bold text-slate-800 leading-relaxed mb-8">
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                </h3>

                <div className="space-y-4">
                    {currentQuestion.options?.map((opt: string, idx: number) => {
                        const isSelected = answers[currentQuestionIndex] === idx;
                        return (
                            <button key={idx} onClick={() => handleSelectOption(currentQuestionIndex, idx)}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                    isSelected
                                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900'
                                        : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300'}`}>
                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                </div>
                                <span className={`font-medium ${isSelected ? 'font-bold' : ''}`}>{opt}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <button onClick={handlePrevious} disabled={currentQuestionIndex === 0}
                    className={`px-6 py-3 font-bold rounded-xl transition-all ${
                        currentQuestionIndex === 0
                            ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                >
                    Previous
                </button>

                <button onClick={handleNext} disabled={answers[currentQuestionIndex] === undefined}
                    className={`px-8 py-3 font-bold rounded-xl transition-all shadow-lg ${
                        answers[currentQuestionIndex] === undefined
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30 hover:scale-105'
                    }`}
                >
                    {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                </button>
            </div>
        </div>
    );
}
