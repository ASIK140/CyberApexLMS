import React from 'react';
import Link from 'next/link';

export default function EmployeeDashboard() {
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            
            {/* 1. Welcome & Streak Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-neutral-900 border border-cyan-700/30 p-6 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, Alice 👋</h2>
                        <p className="text-slate-600">You're one of the top performers in your organisation. Keep it up!</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-bl from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl mb-3 shadow-[0_0_15px_rgba(249,115,22,0.3)]">🔥</div>
                    <h3 className="text-xl font-bold text-slate-900">14-Day Streak</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">You've logged in and learned every day for 2 weeks. Don't break it!</p>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full" style={{ width: '46%' }}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Next milestone: <span className="text-orange-400">30 days</span></p>
                </div>
            </div>

            {/* 2. XP Level Progress */}
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    <span className="text-3xl font-black text-slate-900">L7</span>
                </div>
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-sm font-bold text-cyan-400 tracking-wider uppercase">Level 7 — Cyber Defender</p>
                            <p className="text-xs text-slate-600 mt-1">Next Level: Level 8 — Security Expert</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900">1240 <span className="text-slate-500">/ 1480 XP</span></span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full relative" style={{ width: '83.7%' }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. KPI Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">🛡️</div>
                        <p className="text-sm font-medium text-slate-600">Risk Score</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">18</p>
                    <p className="text-xs font-medium text-green-400">Low — Excellent</p>
                </div>
                
                <div className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">📚</div>
                        <p className="text-sm font-medium text-slate-600">Courses Complete</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">3 <span className="text-xl text-slate-500">/ 3</span></p>
                    <p className="text-xs font-medium text-blue-400">100% completion</p>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">🏆</div>
                        <p className="text-sm font-medium text-slate-600">Certificates</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">2</p>
                    <p className="text-xs font-medium text-slate-500">1 expiring in 6 months</p>
                </div>

                <div className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">🎣</div>
                        <p className="text-sm font-medium text-slate-600">Phishing Reports</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">3</p>
                    <p className="text-xs font-medium text-slate-500">Reported all 3 simulations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 4. My Courses Section */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">My Courses</h3>
                        <Link href="/employee/courses"><span className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">View All</span></Link>
                    </div>
                    
                    {[
                        { title: 'Phishing, Smishing & Vishing', code: 'PHISH-01', duration: '52 minutes', score: '88%', status: 'Certified', chapters: 5 },
                        { title: 'GDPR & Data Protection', code: 'GDPR-01', duration: '36 minutes', score: '82%', status: 'Certified', chapters: 3 },
                        { title: 'Secure Dev & Cloud Security', code: 'IT-01', duration: '60 minutes', score: '91%', status: 'Certified', chapters: 6 },
                    ].map(course => (
                        <div key={course.code} className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-300 transition-all">
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex gap-2 items-center mb-1">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{course.code}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">{course.status}</span>
                                        </div>
                                        <h4 className="font-semibold text-slate-900 group-hover:text-cyan-400 transition-colors">{course.title}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-slate-900">{course.score}</span>
                                        <p className="text-xs text-slate-500">Score</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 mt-3 text-xs text-slate-600">
                                    <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{course.duration}</span>
                                    <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>{course.chapters} Chapters</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <Link href={`/employee/courses/${course.code.toLowerCase()}`}>
                                    <button className="flex-1 md:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg transition-colors border border-slate-300 hover:border-neutral-600">Review Course</button>
                                </Link>
                                <button className="flex-1 md:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg transition-colors border border-slate-300 hover:border-neutral-600 flex items-center justify-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Certificate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 5. My Badges & 6. Recent Activity */}
                <div className="flex flex-col gap-6">
                    
                    {/* Badges */}
                    <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-slate-900">My Badges</h3>
                            <Link href="/employee/achievements/badges"><span className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">View All</span></Link>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="aspect-square rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 flex flex-col items-center justify-center text-center p-2 group shadow-[0_4px_15px_rgba(234,179,8,0.1)] hover:shadow-[0_4px_25px_rgba(234,179,8,0.2)] transition-shadow">
                                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🌟</span><span className="text-[9px] font-bold text-yellow-400 leading-tight">Top Performer</span>
                            </div>
                            <div className="aspect-square rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 flex flex-col items-center justify-center text-center p-2 group shadow-[0_4px_15px_rgba(239,68,68,0.1)] hover:shadow-[0_4px_25px_rgba(239,68,68,0.2)] transition-shadow">
                                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">👁️‍🗨️</span><span className="text-[9px] font-bold text-red-400 leading-tight">Phishing Spotter</span>
                            </div>
                            <div className="aspect-square rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 flex flex-col items-center justify-center text-center p-2 group shadow-[0_4px_15px_rgba(34,197,94,0.1)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.2)] transition-shadow">
                                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">💯</span><span className="text-[9px] font-bold text-green-400 leading-tight">100% Completion</span>
                            </div>
                            <div className="aspect-square rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20 flex flex-col items-center justify-center text-center p-2 group shadow-[0_4px_15px_rgba(249,115,22,0.1)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.2)] transition-shadow">
                                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🔥</span><span className="text-[9px] font-bold text-orange-400 leading-tight">14-Day Streak</span>
                            </div>
                            <div className="aspect-square rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex flex-col items-center justify-center text-center p-2 group shadow-[0_4px_15px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.2)] transition-shadow">
                                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🛡️</span><span className="text-[9px] font-bold text-blue-400 leading-tight">GDPR Champion</span>
                            </div>
                            <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 flex flex-col items-center justify-center text-center p-2 group shadow-[0_4px_15px_rgba(168,85,247,0.1)] hover:shadow-[0_4px_25px_rgba(168,85,247,0.2)] transition-shadow">
                                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">☁️</span><span className="text-[9px] font-bold text-purple-400 leading-tight">Cloud Defender</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col h-full">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
                        <div className="flex-1 relative border-l border-slate-200 ml-3 space-y-6 pb-2">
                            
                            <div className="relative pl-6">
                                <div className="absolute w-3 h-3 bg-cyan-500 rounded-full -left-[6.5px] top-1.5 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                                <p className="text-sm font-medium text-slate-900 mb-0.5">Logged in — streak maintained</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Today, 09:00 AM</span>
                                    <span className="font-bold text-green-400">+5 XP</span>
                                </div>
                            </div>
                            
                            <div className="relative pl-6">
                                <div className="absolute w-3 h-3 bg-neutral-700 rounded-full border-2 border-neutral-900 -left-[6.5px] top-1.5"></div>
                                <p className="text-sm font-medium text-slate-900 mb-0.5">Completed IT-01 — scored 91%</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Yesterday, 14:30 PM</span>
                                    <span className="font-bold text-green-400">+180 XP</span>
                                </div>
                            </div>

                            <div className="relative pl-6">
                                <div className="absolute w-3 h-3 bg-neutral-700 rounded-full border-2 border-neutral-900 -left-[6.5px] top-1.5"></div>
                                <p className="text-sm font-medium text-slate-900 mb-0.5">Reported phishing simulation</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Oct 24, 11:15 AM</span>
                                    <span className="font-bold text-green-400">+25 XP</span>
                                </div>
                            </div>

                            <div className="relative pl-6">
                                <div className="absolute w-3 h-3 bg-neutral-700 rounded-full border-2 border-neutral-900 -left-[6.5px] top-1.5"></div>
                                <p className="text-sm font-medium text-slate-900 mb-0.5">Completed PHISH-01 — scored 88%</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Oct 23, 16:45 PM</span>
                                    <span className="font-bold text-green-400">+160 XP</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
