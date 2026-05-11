import React from 'react';
import Link from 'next/link';

export default function MyCoursesPage() {
    const courses = [
        { 
            title: 'Phishing, Smishing & Vishing', 
            code: 'PHISH-01', 
            duration: '52 minutes', 
            score: '88%', 
            status: 'Certified', 
            chapters: 5,
            progress: 100,
            dateCompleted: 'Oct 23, 2025'
        },
        { 
            title: 'GDPR & Data Protection', 
            code: 'GDPR-01', 
            duration: '36 minutes', 
            score: '82%', 
            status: 'Certified', 
            chapters: 3,
            progress: 100,
            dateCompleted: 'Sep 15, 2025'
        },
        { 
            title: 'Secure Dev & Cloud Security', 
            code: 'IT-01', 
            duration: '60 minutes', 
            score: '91%', 
            status: 'Certified', 
            chapters: 6,
            progress: 100,
            dateCompleted: 'Yesterday'
        },
        { 
            title: 'Insider Threats & Physical Security', 
            code: 'PHYS-02', 
            duration: '45 minutes', 
            score: '-', 
            status: 'In Progress', 
            chapters: 4,
            progress: 40,
            dateCompleted: 'Due Nov 15, 2025'
        },
        { 
            title: 'AI Security & Deepfakes Overview', 
            code: 'AI-01', 
            duration: '30 minutes', 
            score: '-', 
            status: 'Not Started', 
            chapters: 2,
            progress: 0,
            dateCompleted: 'Due Dec 01, 2025'
        }
    ];

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Assigned Courses</h2>
                    <p className="text-sm text-slate-600 mt-1">Track your learning progress and download your earned certificates.</p>
                </div>
                
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white shadow-sm border border-slate-300 hover:border-neutral-600 text-sm font-medium text-slate-900 rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-white shadow-sm border border-slate-300 hover:border-neutral-600 text-sm font-medium text-slate-900 rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        Sort by Status
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.map(course => {
                    const isCertified = course.status === 'Certified';
                    const isInProgress = course.status === 'In Progress';
                    
                    const statusColor = isCertified ? 'text-green-400 bg-green-500/10 border-green-500/20' 
                                      : isInProgress ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                                      : 'text-slate-600 bg-slate-100 border-slate-300';

                    const barColor = isCertified ? 'bg-green-500' : isInProgress ? 'bg-cyan-500' : 'bg-neutral-700';

                    return (
                        <div key={course.code} className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200 shadow-xl group hover:border-slate-300 transition-colors relative overflow-hidden flex flex-col h-full">
                            
                            {/* Decorative background flare */}
                            {isCertified && <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full pointer-events-none"></div>}
                            {isInProgress && <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none"></div>}

                            <div className="flex-1 z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-2 items-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">{course.code}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                            {course.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-bold ${isCertified ? 'text-slate-900' : 'text-slate-500'}`}>{course.score}</span>
                                        <p className="text-xs text-slate-500">Exam Score</p>
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-cyan-400 transition-colors">{course.title}</h3>
                                
                                <div className="flex gap-4 text-sm text-slate-600 mb-6">
                                    <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{course.duration}</span>
                                    <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>{course.chapters} Chapters</span>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-medium mb-2">
                                        <span className="text-slate-700">Completion</span>
                                        <span className={isCertified ? 'text-green-400' : 'text-cyan-400'}>{course.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner flex">
                                        <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${course.progress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">{isCertified ? 'Completed on: ' : 'Target complete: '} <span className="text-slate-600">{course.dateCompleted}</span></p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100 z-10 w-full">
                                {isCertified ? (
                                    <>
                                        <Link href={`/employee/courses/${course.code.toLowerCase()}`} className="flex-1">
                                            <button className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg transition-colors border border-slate-300 hover:border-neutral-600 shadow-sm">Review</button>
                                        </Link>
                                        <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-900 text-sm font-semibold rounded-lg transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Certificate
                                        </button>
                                    </>
                                ) : (
                                    <Link href={`/employee/courses/${course.code.toLowerCase()}`} className="w-full">
                                        <button className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-900 text-sm font-semibold rounded-lg transition-all shadow-[0_4px_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                            {isInProgress ? 'Resume Course' : 'Start Course'}
                                        </button>
                                    </Link>
                                )}
                            </div>
                            
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
