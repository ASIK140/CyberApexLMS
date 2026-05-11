'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/utils/api';

interface Course {
    enrollment_id: string;
    course_id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    duration_minutes?: number;
    status: string;
    progress: number;
    due_date?: string | null;
    enrolled_at: string;
    started_at?: string | null;
    completed_at?: string | null;
}

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/student/courses')
            .then(res => setCourses(res.data?.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Assigned Courses</h2>
                    <p className="text-sm text-slate-600 mt-1">Track your learning progress and earn certificates.</p>
                </div>
            </div>

            {!courses.length ? (
                <div className="p-16 rounded-2xl bg-white border border-dashed border-slate-300 text-center shadow-sm">
                    <p className="text-5xl mb-4">📭</p>
                    <h3 className="text-xl font-bold text-slate-700">No Courses Assigned</h3>
                    <p className="text-slate-500 mt-2">Your administrator hasn&apos;t assigned any courses yet. Please contact them.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {courses.map(course => {
                        const isCompleted  = course.status === 'completed';
                        const isInProgress = course.status === 'in_progress';

                        const statusLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started';
                        const statusColor = isCompleted
                            ? 'text-green-400 bg-green-500/10 border-green-500/20'
                            : isInProgress
                            ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                            : 'text-slate-600 bg-slate-100 border-slate-300';
                        const barColor = isCompleted ? 'bg-green-500' : isInProgress ? 'bg-cyan-500' : 'bg-neutral-300';

                        return (
                            <div key={course.course_id} className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors relative overflow-hidden flex flex-col h-full group">
                                {isCompleted  && <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full pointer-events-none"></div>}
                                {isInProgress && <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none"></div>}

                                <div className="flex-1 z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                        {course.due_date && (
                                            <span className="text-xs text-slate-500">
                                                Due: {new Date(course.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">
                                        {course.title}
                                    </h3>

                                    {course.description && (
                                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</p>
                                    )}

                                    <div className="flex gap-4 text-sm text-slate-600 mb-6">
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {course.duration_minutes ? `${course.duration_minutes} min` : 'Self-paced'}
                                        </span>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs font-medium mb-2">
                                            <span className="text-slate-700">Completion</span>
                                            <span className={isCompleted ? 'text-green-500' : 'text-cyan-500'}>{course.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                                            <div className={`h-full ${barColor} rounded-full transition-all duration-1000`}
                                                style={{ width: `${course.progress}%` }}></div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Enrolled: <span className="text-slate-600">{new Date(course.enrolled_at).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100 z-10 w-full">
                                    {isCompleted ? (
                                        <>
                                            <Link href={`/student/courses/${course.course_id}`} className="flex-1">
                                                <button className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold rounded-lg transition-colors border border-slate-300">
                                                    Review
                                                </button>
                                            </Link>
                                            <Link href="/student/certificates" className="flex-1">
                                                <button className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2">
                                                    Certificate
                                                </button>
                                            </Link>
                                        </>
                                    ) : (
                                        <Link href={`/student/courses/${course.course_id}`} className="w-full">
                                            <button className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_4px_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                                {isInProgress ? 'Resume Course' : 'Start Course'}
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
