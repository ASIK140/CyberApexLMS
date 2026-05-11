'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/utils/api';

interface StudentMe {
    name: string;
    email: string;
    courses_count: number;
    completed_count: number;
    in_progress_count: number;
}

interface Course {
    course_id: string;
    title: string;
    status: string;
    progress: number;
    enrolled_at: string;
}

export default function StudentDashboard() {
    const [student,  setStudent]  = useState<StudentMe | null>(null);
    const [courses,  setCourses]  = useState<Course[]>([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        Promise.all([
            apiClient.get('/student/me').then(r => setStudent(r.data?.data || null)).catch(() => {}),
            apiClient.get('/student/courses').then(r => setCourses(r.data?.data || [])).catch(() => {}),
        ]).finally(() => setLoading(false));
    }, []);

    const firstName    = student?.name?.split(' ')[0] || 'Student';
    const coursesCount = student?.courses_count    || 0;
    const completed    = student?.completed_count  || 0;
    const inProgress   = student?.in_progress_count || 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">

            {/* Welcome Banner + Completion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-neutral-900 border border-cyan-700/30 p-6 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700"></div>
                    <div className="relative z-10">
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2 block">Student Portal</span>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {firstName}!</h2>
                        <p className="text-slate-300">
                            {coursesCount === 0
                                ? 'No courses assigned yet. Contact your administrator.'
                                : `You have ${coursesCount} course${coursesCount > 1 ? 's' : ''} assigned. Keep learning!`}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl mb-3">📚</div>
                    <h3 className="text-3xl font-bold text-slate-900">
                        {completed}<span className="text-xl text-slate-500"> / {coursesCount}</span>
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 font-medium">Courses Completed</p>
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700"
                            style={{ width: coursesCount > 0 ? `${Math.round((completed / coursesCount) * 100)}%` : '0%' }}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {coursesCount > 0 ? `${Math.round((completed / coursesCount) * 100)}% overall` : 'No courses yet'}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Assigned', value: coursesCount, icon: '📖', color: 'bg-blue-500/20 text-blue-500', note: 'Courses assigned by admin' },
                    { label: 'In Progress',    value: inProgress,   icon: '⏳', color: 'bg-orange-500/20 text-orange-500', note: 'Currently learning' },
                    { label: 'Completed',      value: completed,    icon: '✅', color: 'bg-green-500/20 text-green-500',  note: 'Courses finished' },
                ].map(k => (
                    <div key={k.label} className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-cyan-300 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-lg ${k.color} flex items-center justify-center`}>{k.icon}</div>
                            <p className="text-sm font-medium text-slate-600">{k.label}</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{k.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{k.note}</p>
                    </div>
                ))}
            </div>

            {/* Recent Courses */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">My Assigned Courses</h3>
                    <Link href="/student/courses">
                        <span className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors cursor-pointer">View All →</span>
                    </Link>
                </div>

                {courses.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
                        <p className="text-4xl mb-3">📭</p>
                        <h4 className="text-lg font-semibold text-slate-700">No Courses Yet</h4>
                        <p className="text-sm text-slate-500 mt-1">Your administrator hasn&apos;t assigned any courses to you yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.slice(0, 4).map(course => {
                            const pct         = course.progress || 0;
                            const isCompleted = course.status === 'completed';
                            const isActive    = course.status === 'in_progress';
                            const statusLabel = isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Not Started';
                            const statusColor = isCompleted
                                ? 'text-green-600 bg-green-50 border-green-200'
                                : isActive
                                ? 'text-cyan-600 bg-cyan-50 border-cyan-200'
                                : 'text-slate-500 bg-slate-50 border-slate-200';
                            const barColor = isCompleted ? 'bg-green-500' : 'bg-cyan-500';

                            return (
                                <div key={course.course_id} className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-2">
                                            <h4 className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors text-sm leading-snug">
                                                {course.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Progress</span>
                                            <span className="font-semibold text-slate-700">{pct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <Link href={`/student/courses/${course.course_id}`}>
                                            <button className="w-full text-xs font-semibold py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
                                                {isCompleted ? 'Review & Download Certificate' : isActive ? 'Continue Course' : 'Start Course'}
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
