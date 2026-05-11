import React from 'react';

export default function LeaderboardPage() {
    const orgLeaderboard = [
        { rank: 1, name: 'Alice Thompson', dept: 'IT / Engineering', level: 7, xp: '1,240', badges: 7, isMe: true },
        { rank: 2, name: 'Marcus Jin', dept: 'Finance', level: 7, xp: '1,150', badges: 6, isMe: false },
        { rank: 3, name: 'Sarah O\'Connor', dept: 'HR', level: 6, xp: '980', badges: 5, isMe: false },
        { rank: 4, name: 'David Chen', dept: 'IT / Engineering', level: 6, xp: '920', badges: 5, isMe: false },
        { rank: 5, name: 'Priya Patel', dept: 'Sales', level: 5, xp: '750', badges: 4, isMe: false },
    ];

    const deptLeaderboard = [
        { rank: 1, name: 'Alice Thompson', xp: '1,240', completion: '100%', isMe: true },
        { rank: 2, name: 'David Chen', xp: '920', completion: '85%', isMe: false },
        { rank: 3, name: 'James Wilson', xp: '640', completion: '60%', isMe: false },
        { rank: 4, name: 'Elena Rodriguez', xp: '410', completion: '40%', isMe: false },
    ];

    const getMedal = (rank: number) => {
        if (rank === 1) return <span className="text-xl drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">🥇</span>;
        if (rank === 2) return <span className="text-xl drop-shadow-[0_0_8px_rgba(156,163,175,0.8)]">🥈</span>;
        if (rank === 3) return <span className="text-xl drop-shadow-[0_0_8px_rgba(180,83,9,0.8)]">🥉</span>;
        return <span className="text-slate-500 font-bold w-6 text-center inline-block">{rank}</span>;
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto">
            
            {/* Organisation Leaderboard */}
            <div className="flex-[2] flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Organisation Leaderboard</h2>
                    <p className="text-slate-600 text-sm">Top performers across the entire company.</p>
                </div>

                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-16 text-center">Rank</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Employee Name</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Department</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Level</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">XP</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center hidden sm:table-cell">Badges</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {orgLeaderboard.map((user) => (
                                    <tr key={user.name} className={`group hover:bg-slate-50 border border-slate-100 transition-colors ${user.isMe ? 'bg-cyan-900/10' : ''}`}>
                                        <td className="p-4 text-center align-middle">
                                            {getMedal(user.rank)}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.isMe ? 'bg-gradient-to-tr from-cyan-500 to-blue-400 text-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-100 text-slate-600 border border-slate-300'}`}>
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <span className={`font-semibold ${user.isMe ? 'text-cyan-400' : 'text-slate-900'}`}>{user.name}</span>
                                                    {user.isMe && <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase rounded tracking-wider align-middle">You</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle hidden md:table-cell">
                                            <span className="text-sm text-slate-600">{user.dept}</span>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700">
                                                {user.level}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <span className="text-sm font-bold text-yellow-500">{user.xp} XP</span>
                                        </td>
                                        <td className="p-4 align-middle text-center hidden sm:table-cell">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 border border-slate-300 text-xs font-medium text-slate-700">
                                                <span className="text-sm">🌟</span> {user.badges}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Department Leaderboard */}
            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Department</h2>
                    <p className="text-slate-600 text-sm">IT / Engineering Ranking</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-slate-200 overflow-hidden shadow-2xl relative">
                    {/* Subtle glow effect for department leader */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                    <div className="p-5 border-b border-slate-200 bg-white shadow-sm/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Employee</span>
                        <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                            <span className="w-16">XP</span>
                            <span className="w-16">Done</span>
                        </div>
                    </div>

                    <div className="divide-y divide-neutral-800/50">
                        {deptLeaderboard.map((user) => (
                            <div key={user.name} className={`p-5 flex items-center justify-between group hover:bg-slate-50 border border-slate-100 transition-colors ${user.isMe ? 'bg-cyan-900/5' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-6 text-center">
                                        {user.rank === 1 ? <span className="text-lg">👑</span> : <span className="text-sm font-bold text-slate-500">{user.rank}</span>}
                                    </div>
                                    <span className={`text-sm font-semibold ${user.isMe ? 'text-cyan-400' : 'text-slate-800'}`}>{user.name}</span>
                                </div>
                                <div className="flex gap-8 text-right items-center">
                                    <span className="w-16 text-sm font-bold text-yellow-500">{user.xp}</span>
                                    <span className={`w-16 text-sm font-bold ${user.completion === '100%' ? 'text-green-400' : 'text-slate-600'}`}>{user.completion}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-4 bg-white/40 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-500 font-medium">Keep learning to maintain your #1 spot!</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
