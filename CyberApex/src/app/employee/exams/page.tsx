import React from 'react';
import Link from 'next/link';

export default function TakeExamPage() {
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Pending Exams</h2>
                    <p className="text-slate-600 text-sm">Select an available exam to complete your training and earn certifications.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { id: 'phish-01', title: 'Phishing, Smishing & Vishing', code: 'PHISH-01', duration: '15 mins', questions: 4, type: 'Certification Exam', color: 'cyan', ready: true },
                    { id: 'gdpr-01', title: 'GDPR & Data Protection Final Exam', code: 'GDPR-01', duration: '20 mins', questions: 10, type: 'Compliance Exam', color: 'blue', ready: false },
                    { id: 'it-01', title: 'Secure Dev & Cloud Security', code: 'IT-01', duration: '30 mins', questions: 15, type: 'Certification Exam', color: 'indigo', ready: false },
                ].map(exam => (
                    <div key={exam.id} className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden group hover:border-slate-300 transition-colors shadow-lg">
                        
                        {exam.ready && <div className={`absolute top-0 right-0 w-32 h-32 bg-${exam.color}-500/10 blur-[40px] rounded-full group-hover:bg-${exam.color}-500/20 transition-all`}></div>}
                        
                        <div className="relative z-10 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${exam.ready ? `bg-${exam.color}-500/10 text-${exam.color}-400 border border-${exam.color}-500/20` : 'bg-slate-100 text-slate-500 border border-slate-300'}`}>
                                    {exam.type}
                                </span>
                            </div>
                            
                            <h3 className={`text-lg font-bold mb-1 ${exam.ready ? 'text-slate-900' : 'text-slate-600'}`}>{exam.title}</h3>
                            <p className="text-xs font-mono text-slate-500 mb-6">{exam.code}</p>
                            
                            <div className="flex gap-4 mb-8">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Time Limit</span>
                                    <span className={`text-sm font-medium ${exam.ready ? 'text-slate-900' : 'text-slate-600'}`}>{exam.duration}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-100"></div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Questions</span>
                                    <span className={`text-sm font-medium ${exam.ready ? 'text-slate-900' : 'text-slate-600'}`}>{exam.questions}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            {exam.ready ? (
                                <Link href={`/employee/courses/${exam.id}/quiz`}>
                                    <button className={`w-full py-2.5 bg-${exam.color}-600 hover:bg-${exam.color}-500 text-slate-900 text-sm font-semibold rounded-lg transition-all shadow-[0_4px_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Take Exam Now
                                    </button>
                                </Link>
                            ) : (
                                <button className="w-full py-2.5 bg-slate-100 text-slate-500 text-sm font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Module Not Completed
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
