'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/utils/api';

interface Course {
    enrollment_id: string;
    course_id: string;
    title: string;
    status: string;
    progress: number;
    enrolled_at: string;
    completed_at?: string | null;
}

export default function StudentCertificatesPage() {
    const [courses,     setCourses]     = useState<Course[]>([]);
    const [studentName, setStudentName] = useState('Student');
    const [loading,     setLoading]     = useState(true);

    useEffect(() => {
        Promise.all([
            apiClient.get('/student/courses').then(r => setCourses(r.data?.data || [])).catch(() => {}),
            apiClient.get('/student/me').then(r => setStudentName(r.data?.data?.name || 'Student')).catch(() => {}),
        ]).finally(() => setLoading(false));
    }, []);

    const completed   = courses.filter(c => c.status === 'completed');
    const inProgress  = courses.filter(c => c.status !== 'completed');

    const handleDownload = (course: Course) => {
        const win = window.open('', '_blank');
        if (!win) return;
        const completedDate = course.completed_at
            ? new Date(course.completed_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

        win.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>Certificate - ${course.title}</title>
    <style>
        body { font-family: Georgia, serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .cert { background: white; border: 8px solid #0891b2; padding: 60px; max-width: 750px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.1); position: relative; }
        .cert::before { content: ''; position: absolute; inset: 10px; border: 2px solid #e0f2fe; pointer-events: none; }
        .logo { font-size: 28px; font-weight: bold; color: #0891b2; letter-spacing: 2px; margin-bottom: 8px; }
        .title { font-size: 42px; font-weight: bold; color: #0f172a; margin: 20px 0 10px; }
        .sub { color: #64748b; font-size: 16px; margin-bottom: 30px; }
        .name { font-size: 34px; font-weight: bold; color: #0891b2; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
        .course { font-size: 22px; font-weight: bold; color: #1e293b; margin: 20px 0; }
        .date { color: #64748b; font-size: 14px; margin-top: 30px; }
        .seal { font-size: 60px; margin: 20px 0; }
        @media print { body { background: white; } }
    </style>
</head>
<body>
    <div class="cert">
        <div class="logo">🎓 CYBERAPEX LMS</div>
        <div class="title">Certificate of Completion</div>
        <div class="sub">This is to certify that</div>
        <div class="name">${studentName}</div>
        <div class="sub">has successfully completed the course</div>
        <div class="course">${course.title}</div>
        <div class="seal">🏆</div>
        <div class="date">Issued on: ${completedDate}</div>
        <div class="date" style="margin-top:8px;font-size:12px;color:#94a3b8;">CyberApex LMS • Enterprise Cybersecurity Training Platform</div>
    </div>
    <script>window.print();</script>
</body>
</html>`);
    };

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
                <h2 className="text-xl font-bold text-slate-900">My Certificates</h2>
                <p className="text-sm text-slate-500 mt-1">
                    {completed.length} certificate{completed.length !== 1 ? 's' : ''} earned
                </p>
            </div>

            {!completed.length ? (
                <div className="p-16 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
                    <p className="text-5xl mb-4">🏅</p>
                    <h3 className="text-xl font-bold text-slate-700">No Certificates Yet</h3>
                    <p className="text-slate-500 mt-2">Complete a course to earn your certificate.</p>
                    <Link href="/student/courses">
                        <button className="mt-6 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors">
                            Go to My Courses
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completed.map(course => (
                        <div key={course.course_id}
                            className="p-6 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-400/10 blur-[40px] rounded-full"></div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg">🏆</div>
                                <span className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-bold">Certified</span>
                            </div>

                            <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">{course.title}</h3>
                            {course.completed_at && (
                                <p className="text-xs text-slate-500">
                                    Completed: {new Date(course.completed_at).toLocaleDateString()}
                                </p>
                            )}
                            <p className="text-xs text-green-600 font-semibold mt-1">✅ 100% Completed</p>

                            <div className="mt-5 pt-4 border-t border-cyan-200 flex gap-3">
                                <button
                                    onClick={() => handleDownload(course)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Certificate
                                </button>
                                <button
                                    onClick={() => handleDownload(course)}
                                    className="px-4 py-2.5 bg-white border border-slate-300 hover:border-cyan-400 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                                    Print
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Progress towards next certificate */}
            {inProgress.length > 0 && (
                <div className="mt-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Earn More Certificates</h3>
                    <div className="flex flex-col gap-3">
                        {inProgress.map(course => (
                            <Link key={course.course_id} href={`/student/courses/${course.course_id}`}>
                                <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-300 transition-colors flex items-center gap-4 cursor-pointer group">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-700 group-hover:text-cyan-600 transition-colors">{course.title}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                <div className="bg-cyan-400 h-2 rounded-full transition-all duration-700" style={{ width: `${course.progress}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 w-16 text-right">{course.progress}% done</span>
                                        </div>
                                    </div>
                                    <span className="text-2xl opacity-30">🏅</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
