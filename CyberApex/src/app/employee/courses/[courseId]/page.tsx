import React from 'react';
import Link from 'next/link';

export default function CoursePlayerPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
            
            {/* LEFT COLUMN: Video & Notes */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* Custom Video Player UI */}
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xl relative group">
                    
                    {/* Mock Video Content */}
                    <div className="aspect-video bg-white shadow-sm relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 to-blue-900/20 mix-blend-overlay"></div>
                        <div className="text-center z-10">
                            <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center text-slate-900 mx-auto mb-4 shadow-[0_0_30px_rgba(6,182,212,0.6)] cursor-pointer hover:scale-105 transition-transform">
                                <svg className="w-10 h-10 ml-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            </div>
                            <p className="text-slate-900 font-medium text-lg tracking-wide">Email Phishing & AiTM</p>
                        </div>
                    </div>

                    {/* Video Controls Panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        
                        {/* Timeline */}
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-medium text-slate-900">04:12</span>
                            <div className="flex-1 h-1.5 bg-neutral-600 rounded-full cursor-pointer relative group/timeline">
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-cyan-500 rounded-full w-[45%]"></div>
                                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/timeline:scale-100 transition-transform" style={{ left: '45%' }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-600">10:30</span>
                        </div>
                        
                        {/* Controls Bottom Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-slate-900">
                                <button className="hover:text-cyan-400 transition-colors">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                </button>
                                <button className="hover:text-cyan-400 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-4 text-slate-900">
                                <div className="flex items-center gap-1 bg-white/10 rounded-md px-2 py-1 text-xs font-medium cursor-pointer hover:bg-white/20 transition-colors">
                                    <span className="text-slate-600">0.75x</span>
                                    <span className="text-slate-900">1x</span>
                                    <span className="text-slate-600">1.5x</span>
                                    <span className="text-slate-600">2x</span>
                                </div>
                                <button className="hover:text-cyan-400 transition-colors px-1" title="Closed Captions">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                                </button>
                                <button className="hover:text-cyan-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chapter Notes */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900">What is Attacker-in-the-Middle (AiTM)?</h3>
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg transition-colors border border-slate-300 hover:border-neutral-600 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download Notes PDF
                        </button>
                    </div>

                    <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
                        <p>AiTM phishing bypasses Multi-Factor Authentication (MFA) by proxying the login process in real-time. The attacker sits between you and the legitimate website, capturing your session cookie immediately after you verify your MFA prompt.</p>
                        
                        <div className="relative pl-4 border-l-2 border-cyan-500 bg-cyan-500/5 p-4 rounded-r-lg">
                            <p className="font-bold text-cyan-400 mb-1 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Key Tip</p>
                            <p className="text-cyan-100/80">Always verify the URL in your browser's address bar. AiTM proxies must use a domain that looks similar to the real one, but cannot be identical.</p>
                        </div>

                        <div className="relative pl-4 border-l-2 border-yellow-500 bg-yellow-500/5 p-4 rounded-r-lg">
                            <p className="font-bold text-yellow-400 mb-1 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> Real World Case Study</p>
                            <p className="text-yellow-100/80">In 2024, a major enterprise was breached when an employee clicked a realistic "Password Expiry" email link. The employee entered their credentials and approved the MFA prompt on their phone. Because the login was proxied through an AiTM server (Evilginx), the attacker intercepted the authenticated session cookie and bypassed the MFA entirely.</p>
                        </div>

                        <div className="relative pl-4 border-l-2 border-red-500 bg-red-500/5 p-4 rounded-r-lg">
                            <p className="font-bold text-red-400 mb-1 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Security Warning</p>
                            <p className="text-red-100/80">FIDO2 security keys (like YubiKey) or Windows Hello provide hardware-bound authentication that completely neutralizes AiTM attacks. SMS or Authenticator App Push notifications do not protect against this threat.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Course Progress & Chapters */}
            <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-6">
                
                {/* Course Progress */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Course Progress</h3>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-slate-900">3 / 5 chapters complete</span>
                        <span className="text-sm font-bold text-cyan-400">60%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                </div>

                {/* Chapter List */}
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[calc(100vh-280px)] lg:h-auto lg:flex-1">
                    <div className="p-4 border-b border-slate-200 bg-white shadow-sm/50">
                        <h3 className="font-bold text-slate-900">Curriculum</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        <div className="divide-y divide-neutral-800/50">
                            
                            {/* Completed Chapter */}
                            <div className="p-4 bg-green-500/5 border-l-2 border-green-500 flex items-start gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">1. What is Phishing</p>
                                    <p className="text-xs text-slate-500 mt-1">08:45 • Video</p>
                                </div>
                            </div>

                            {/* Active Chapter */}
                            <div className="p-4 bg-cyan-900/20 border-l-2 border-cyan-500 flex items-start gap-3 cursor-pointer">
                                <div className="mt-0.5 w-5 h-5 flex flex-shrink-0 relative">
                                    <div className="absolute inset-0 bg-cyan-500 rounded-full opacity-20 animate-ping"></div>
                                    <div className="relative w-5 h-5 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                                        <svg className="w-2.5 h-2.5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">2. Email Phishing & AiTM</p>
                                    <p className="text-xs text-cyan-400 mt-1 font-medium">10:30 • Currently Playing</p>
                                </div>
                            </div>

                            {/* Unfinished / Pending Chapter */}
                            <div className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 border border-slate-100 transition-colors group border-l-2 border-transparent hover:border-neutral-600">
                                <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-neutral-600 flex items-center justify-center flex-shrink-0 group-hover:border-neutral-400 transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-neutral-500"></span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">3. Smishing, Vishing & QR Quishing</p>
                                    <p className="text-xs text-neutral-600 mt-1 group-hover:text-slate-500 transition-colors">12:15 • Video</p>
                                </div>
                            </div>

                            {/* Locked Chapters */}
                            <div className="p-4 flex items-start gap-3 opacity-50 cursor-not-allowed border-l-2 border-transparent">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center flex-shrink-0 text-slate-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">4. AI Deepfakes</p>
                                    <p className="text-xs text-neutral-600 mt-1">15:00 • Video</p>
                                </div>
                            </div>

                            <div className="p-4 flex items-start gap-3 opacity-50 cursor-not-allowed border-l-2 border-transparent">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center flex-shrink-0 text-slate-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">5. What To Do</p>
                                    <p className="text-xs text-neutral-600 mt-1">05:40 • Video</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Chapter Quiz Panel Start */}
                    <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-md">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Chapter 2 Quiz</h4>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-slate-500 font-medium">4 questions</span>
                            <span className="text-xs font-bold text-cyan-400">2 / 4 Progress</span>
                        </div>
                        <Link href="/employee/courses/phish-01/quiz">
                            <button className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-900 text-sm font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Take Chapter Quiz
                            </button>
                        </Link>
                    </div>

                </div>
            </div>

        </div>
    );
}
