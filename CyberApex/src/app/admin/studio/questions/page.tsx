'use client';
import React, { useState } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const METRICS = [
    { label: 'Total Questions', value: '148', icon: '❓', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Used in Courses', value: '84', icon: '🔄', color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Correct Rate', value: '67%', icon: '🎯', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Flagged Questions', value: '6', icon: '🚩', color: 'text-red-400', bg: 'bg-red-500/10' },
];

const QUESTIONS = [
    { id: 1, text: 'Which of the following is a common indicator of a phishing email?', topic: 'Phishing', difficulty: 'Beginner', type: 'MCQ', usedIn: 3, correctRate: '82%' },
    { id: 2, text: 'You receive an urgent request from the CEO to wire funds. You should immediately comply.', topic: 'Social Engineering', difficulty: 'Beginner', type: 'True / False', usedIn: 5, correctRate: '91%' },
    { id: 3, text: 'Analyze the attached email headers and identify the spoofed domain.', topic: 'Email Security', difficulty: 'Advanced', type: 'Case Study', usedIn: 1, correctRate: '45%' },
    { id: 4, text: 'A coworker plugs an unfamiliar USB drive into their workstation. What is the immediate risk?', topic: 'Physical Security', difficulty: 'Intermediate', type: 'Scenario Question', usedIn: 2, correctRate: '76%' },
    { id: 5, text: 'What is the primary purpose of Multi-Factor Authentication (MFA)?', topic: 'Authentication', difficulty: 'Beginner', type: 'MCQ', usedIn: 4, correctRate: '88%' },
    { id: 6, text: 'Identify the flaw in the following password policy.', topic: 'Access Control', difficulty: 'Intermediate', type: 'Case Study', usedIn: 2, correctRate: '62%', flagged: true },
];

export default function QuestionBank() {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    const triggerAction = (modalType: string, question: any = null) => {
        setSelectedQuestion(question);
        setActiveModal(modalType);
    };

    const handleAction = (successModal: string, delay = 1000) => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setActiveModal(successModal);
            setTimeout(() => setActiveModal(null), 3000);
        }, delay);
    };

    return (
        <SuperAdminLayout title="Question Bank" subtitle="Manage reusable questions and assessments across all training courses.">
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full relative">

                {/* Header Actions */}
                <div className="flex justify-end items-center gap-3 border-b border-slate-200 pb-4">
                    <button onClick={() => triggerAction('import_csv')} className="px-4 py-2 bg-white shadow-sm border border-slate-200 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2">
                        <span>📥</span> Import CSV
                    </button>
                    <button onClick={() => triggerAction('new_question')} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">
                        + New Question
                    </button>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {METRICS.map((metric, i) => (
                        <div key={i} className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${metric.bg} ${metric.color}`}>
                                    {metric.icon}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">{metric.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                        <div className="relative w-80">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">🔍</span>
                            <input type="text" placeholder="Search questions by text or topic..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex gap-2">
                            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                <option value="">All Topics</option>
                                <option value="phishing">Phishing</option>
                                <option value="social">Social Engineering</option>
                            </select>
                            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                <option value="">All Difficulties</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider w-1/3">Question Text</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Topic</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Difficulty</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Type</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-center">Used In</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Correct Rate</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {QUESTIONS.map(q => (
                                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {q.flagged && <span className="text-red-500 text-xs" title="Flagged for review">🚩</span>}
                                                <p className="text-slate-900 text-xs truncate max-w-xs xl:max-w-md whitespace-normal leading-relaxed">{q.text}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-slate-700 font-medium">{q.topic}</span></td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${q.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-400' :
                                                    q.difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-red-500/10 text-red-400'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 border border-slate-300 bg-slate-100 text-slate-700 rounded text-xs font-mono">{q.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="w-6 h-6 inline-flex items-center justify-center bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-300">
                                                {q.usedIn}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${parseInt(q.correctRate) < 60 ? 'bg-red-500' : parseInt(q.correctRate) > 85 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: q.correctRate }}></div>
                                                </div>
                                                <span className="text-xs font-mono text-slate-700">{q.correctRate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button onClick={() => triggerAction('edit_question', q)} className="text-indigo-400 hover:text-indigo-300 font-semibold transition text-xs">Edit</button>
                                            <button onClick={() => triggerAction('duplicate_question', q)} className="text-slate-500 hover:text-slate-700 font-semibold transition text-xs">Duplicate</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Toast Notification (Simulated) */}
                {activeModal === 'toast_success' && (
                    <div className="absolute top-20 right-0 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right-5 fade-in duration-300 z-50">
                        <span className="text-xl">✓</span>
                        <div>
                            <p className="text-sm font-bold">Action Successful</p>
                            <p className="text-xs opacity-80">The question bank has been updated.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {activeModal === 'import_csv' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-lg">Bulk Import Questions</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 text-xl leading-none">×</button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-6">Upload a CSV file containing questions, answers, and metadata to bulk import into the bank.</p>

                            <div className="w-full h-32 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-600 cursor-pointer transition-colors group mb-4">
                                <span className="text-3xl mb-2 group-hover:scale-110 group-hover:text-indigo-400 transition-all">📊</span>
                                <span className="text-sm font-medium group-hover:text-slate-900 transition-colors">Drag & drop CSV here</span>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer underline">Download CSV Template</span>
                            </div>

                            <button onClick={() => handleAction('toast_success', 2000)} disabled={processing} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex justify-center items-center">
                                {processing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                        Parsing CSV...
                                    </>
                                ) : "Select CSV File"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(activeModal === 'new_question' || activeModal === 'edit_question' || activeModal === 'duplicate_question') && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-lg">
                                {activeModal === 'new_question' ? 'Create New Question' :
                                    activeModal === 'duplicate_question' ? 'Duplicate Question' : 'Edit Question'}
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 text-2xl pb-1">×</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">

                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-2 block">Question Text</label>
                                <textarea defaultValue={selectedQuestion ? selectedQuestion.text : ''} placeholder="Type the question prompt here..." className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"></textarea>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Question Type</label>
                                    <select defaultValue={selectedQuestion?.type || 'MCQ'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                        <option value="MCQ">Multiple Choice</option>
                                        <option value="True / False">True / False</option>
                                        <option value="Scenario Question">Scenario</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Topic</label>
                                    <select defaultValue={selectedQuestion?.topic || ''} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                        <option value="">Select Topic</option>
                                        <option value="Phishing">Phishing</option>
                                        <option value="Social Engineering">Social Engineering</option>
                                        <option value="Physical Security">Physical Security</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Difficulty</label>
                                    <select defaultValue={selectedQuestion?.difficulty || 'Beginner'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                                <label className="text-sm font-semibold text-slate-600 mb-3 block">Answer Options</label>
                                <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                                    {['A possible correct answer', 'A distractor option', 'Another incorrect option', ''].map((opt, i) => (
                                        <div key={i} className="flex gap-3 items-center">
                                            <input type="radio" name="correct_answer" defaultChecked={i === 0} className="mt-1 text-indigo-600 focus:ring-indigo-500" />
                                            <input type="text" defaultValue={opt} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-1.5 bg-white shadow-sm border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:border-indigo-500" />
                                            {i > 1 && <button className="text-neutral-600 hover:text-red-400 transition-colors">🗑️</button>}
                                        </div>
                                    ))}
                                    <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-2">+ Add Option</button>
                                </div>
                            </div>

                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                            <button onClick={() => handleAction('toast_success', 1000)} disabled={processing} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center">
                                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : 'Save Question'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
