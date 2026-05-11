import React from 'react';

export default function BadgesAndXPPage() {
    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            
            {/* Header & Current Level */}
            <div className="rounded-2xl bg-gradient-to-r from-neutral-900 to-black border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl group">
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000"></div>
                
                {/* Level Badge Icon */}
                <div className="relative z-10 w-32 h-32 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] flex-shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <div className="absolute inset-2 border-2 border-white/20 rounded-2xl"></div>
                    <div className="flex flex-col items-center justify-center text-slate-900">
                        <span className="text-xl font-bold opacity-80 uppercase tracking-widest">Level</span>
                        <span className="text-5xl font-black">7</span>
                    </div>
                </div>

                {/* Level Details & Progress */}
                <div className="relative z-10 flex-1 w-full text-center md:text-left text-slate-900 flex flex-col justify-center">
                    <p className="text-cyan-400 font-bold uppercase tracking-widest text-sm mb-1">Current Ranking</p>
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Cyber Defender</h2>
                    
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-slate-600">Next: Level 8 — Security Expert</span>
                        <span className="text-lg font-bold">1,240 <span className="text-slate-500 text-sm">/ 1,480 XP</span></span>
                    </div>
                    
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner flex">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full h-full relative" style={{ width: '83.7%' }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            {/* Reflection line for polish */}
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/10 rounded-t-full"></div>
                        </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-1.5 justify-center md:justify-start">
                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        240 XP needed to level up
                    </p>
                </div>
            </div>

            {/* Earned Badges Area */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Earned Badges</h3>
                        <p className="text-xs text-slate-600 mt-1">Badges you have successfully unlocked.</p>
                    </div>
                    <span className="px-3 py-1 bg-cyan-900/40 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/20">4 Earned</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { title: 'Top Performer', icon: '🌟', color: 'yellow', xp: '+500 XP' },
                        { title: 'Phishing Spotter', icon: '👁️‍🗨️', color: 'red', xp: '+100 XP' },
                        { title: '100% Completion', icon: '💯', color: 'green', xp: '+250 XP' },
                        { title: '14-Day Streak', icon: '🔥', color: 'orange', xp: '+150 XP' },
                    ].map(badge => (
                        <div key={badge.title} className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center group hover:-translate-y-1 hover:border-neutral-600 transition-all shadow-lg hover:shadow-2xl">
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${badge.color}-500/20 to-${badge.color}-600/5 flex flex-col items-center justify-center text-center p-2 mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-${badge.color}-500/30`}>
                                <span className="text-4xl drop-shadow-lg">{badge.icon}</span>
                            </div>
                            <h4 className={`text-sm font-bold text-${badge.color}-400 mb-1`}>{badge.title}</h4>
                            <p className="text-xs text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">{badge.xp}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Locked Badges Area */}
            <div>
                <div className="flex items-center justify-between mb-6 pt-6 border-t border-slate-200">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Locked Badges</h3>
                        <p className="text-xs text-slate-600 mt-1">Complete more challenges to unlock these.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Security Expert', icon: '🛡️', requirement: 'Reach Level 8' },
                        { title: '30-Day Streak', icon: '🔥', requirement: 'Learn 30 days straight' },
                        { title: 'Department Champion', icon: '🏆', requirement: 'Top 1 in Department' },
                        { title: 'Global Top 10', icon: '🌍', requirement: 'Top 10 in Platform' },
                    ].map(badge => (
                        <div key={badge.title} className="bg-white shadow-sm/50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center border-dashed relative overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                            {/* Lock Icon overlay */}
                            <div className="absolute top-3 right-3 text-neutral-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>

                            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-center p-2 mb-4 grayscale">
                                <span className="text-3xl opacity-50">{badge.icon}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-600 mb-1">{badge.title}</h4>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{badge.requirement}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
