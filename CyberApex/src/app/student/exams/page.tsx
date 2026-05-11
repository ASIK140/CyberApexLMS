'use client';
import React, { useState, useEffect } from 'react';

interface Course {
    course_id: string;
    course_title: string;
    assigned_at: string;
    progress: number;
    status: string;
}

export default function StudentExamsPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { apiFetch } = await import('@/utils/api');
                const res = await apiFetch('/student/courses');
                const json = await res.json();
                if (json.success) setCourses(json.data);
            } catch { /* ignore */ } finally { setLoading(false); }
        };
        load();
    }, []);

    const eligibleForExam = courses.filter(c => c.progress >= 75);
    const notEligible = courses.filter(c => c.progress < 75);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Exams & Assessments</h2>
                <p className="text-sm text-slate-500 mt-1">Complete at least 75% of a course to unlock its final exam.</p>
            </div>

            {/* Eligible Exams */}
            {eligibleForExam.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-3">✅ Eligible to Take Exam</h3>
                    <div className="flex flex-col gap-4">
                        {eligibleForExam.map(course => {
                            const isCertified = course.status === 'Completed';
                            return (
                                <div key={course.course_id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isCertified && (
                                                <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full text-[10px] font-bold">✅ Exam Passed</span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-900">{course.course_title}</h4>
                                        <p className="text-xs text-slate-500 mt-1">Progress: <span className="font-semibold text-cyan-600">{course.progress}%</span></p>
                                    </div>
                                    <div className="flex gap-3">
                                        {isCertified ? (
                                            <button className="px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg opacity-75 cursor-default">
                                                🏆 Completed
                                            </button>
                                        ) : (
                                            <button className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg">
                                                🎯 Take Final Exam
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Not Yet Eligible */}
            {notEligible.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">🔒 Complete More to Unlock</h3>
                    <div className="flex flex-col gap-4">
                        {notEligible.map(course => (
                            <div key={course.course_id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-70">
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-700">{course.course_title}</h4>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                                            <div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">{course.progress}% / 75% needed</span>
                                    </div>
                                </div>
                                <button className="px-6 py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-lg cursor-not-allowed border border-slate-200" disabled>
                                    🔒 Locked
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!courses.length && (
                <div className="p-16 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
                    <p className="text-5xl mb-4">📝</p>
                    <h3 className="text-xl font-bold text-slate-700">No Courses Available</h3>
                    <p className="text-slate-500 mt-2">You need assigned courses to take exams.</p>
                </div>
            )}
        </div>
    );
}
