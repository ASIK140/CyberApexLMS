import React from 'react';

export default function PhishingDebriefPage() {
    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            
            {/* Header Success Message */}
            <div className="rounded-2xl bg-gradient-to-r from-green-900/40 via-emerald-900/20 to-neutral-900 border border-green-500/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full"></div>
                
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(34,197,94,0.3)] flex-shrink-0">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">Great catch, Alice!</h2>
                        <p className="text-slate-700">You successfully identified and reported this phishing simulation.</p>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col items-center md:items-end bg-white/20 p-4 rounded-xl border border-green-500/20 min-w-[200px]">
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Rewards Earned</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⭐</span>
                            <span className="font-bold text-slate-900">+25 XP</span>
                        </div>
                        <div className="h-6 w-px bg-neutral-700"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">👁️‍🗨️</span>
                            <span className="font-bold text-slate-900 text-sm">Phishing Spotter</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* LEFT COLUMN: Email & Indicators */}
                <div className="flex-[2] flex flex-col gap-6">
                    
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Simulated Phishing Email</h3>
                        
                        {/* Simulated Email */}
                        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-neutral-200">
                            <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-3 pb-2 text-neutral-800 relative">
                                
                                {/* Indicators overlays */}
                                <div className="absolute right-4 top-2 bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm animate-pulse">Indicator 1</div>
                                
                                <div className="flex justify-between items-center mb-1 pr-24">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">IT Helpdesk</span>
                                        <span className="text-xs text-slate-500 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 text-red-700 font-mono">support@security-update-portal-auth.com</span>
                                    </div>
                                    <span className="text-xs text-slate-500">10:45 AM</span>
                                </div>
                                <div className="text-sm">To: <span className="font-medium">alice.thompson@tenant.com</span></div>
                                <div className="text-sm font-bold mt-2 text-red-600 flex items-center gap-2">
                                    URGENT: Your Microsoft 365 password expires tonight
                                    <span className="bg-red-100 border border-red-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm text-red-600 animate-pulse">Indicator 2</span>
                                </div>
                            </div>
                            
                            <div className="p-5 text-neutral-800 text-sm space-y-4 relative">
                                <p className="flex items-center gap-2 inline-flex">
                                    Dear employee,
                                    <span className="bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm animate-pulse inline-block">Indicator 3</span>
                                </p>
                                <p>Your multi-factor authentication token and password for your Microsoft 365 office account will expire in 12 hours according to our new security policy.</p>
                                <p>Please click the button below to retain your current password. If you fail to do so, your account access will be automatically locked.</p>
                                
                                <div className="py-2 relative inline-block">
                                    <span className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded text-sm font-medium opacity-80 cursor-not-allowed">Keep My Password</span>
                                    {/* Tooltip simulating hover */}
                                    <div className="absolute -bottom-8 left-0 whitespace-nowrap bg-slate-100 text-slate-900 text-xs px-2 py-1 rounded shadow-lg border border-neutral-600 z-10 flex items-center gap-2">
                                        <span className="text-red-400 font-bold text-[10px]">Indicator 4</span>
                                        <span>http://login-microsoft-secure.update-portal-auth.com/login/auth</span>
                                    </div>
                                </div>
                                
                                <p>Thank you,<br/>IT Security Team</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Security Learning Panel</h3>
                        <p className="text-sm text-slate-600 mb-6">Here is how you could identify that this email was a phishing simulation.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-400">Sender Domain Mismatch</h4>
                                    <p className="text-xs text-slate-700 mt-1">The email came from <code className="text-red-300 bg-red-500/20 px-1 rounded">security-update-portal-auth.com</code>, which is not an official company domain.</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-400">Urgency Language</h4>
                                    <p className="text-xs text-slate-700 mt-1">Attackers use words like "URGENT" and "expires tonight" to panic you into acting without thinking.</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-400">Generic Greeting</h4>
                                    <p className="text-xs text-slate-700 mt-1">Legitimate alerts usually address you by your full name, not as "Dear employee".</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-400">Suspicious Link Destination</h4>
                                    <p className="text-xs text-slate-700 mt-1">Hovering over the button reveals a long, deceptive link that does not lead to a real Microsoft domain.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: Best Practices & Stats */}
                <div className="flex-1 flex flex-col gap-6">
                    
                    <div className="rounded-2xl bg-gradient-to-br from-cyan-900/30 to-blue-900/10 border border-cyan-800/30 p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            What You Should Always Do
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                                <span className="text-sm text-slate-700"><strong>Check the sender email address</strong> carefully, not just the display name.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                                <span className="text-sm text-slate-700"><strong>Hover over links</strong> before clicking to see the actual destination URL.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                                <span className="text-sm text-slate-700"><strong>Never enter credentials</strong> via email links. Always navigate independently to the service.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                                <span className="text-sm text-slate-700"><strong>Report suspicious emails</strong> using the "Report Phishing" button in your email client.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Your Reporting Stats</h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-sm text-slate-600">Simulations Received</span>
                                <span className="font-bold text-slate-900">3</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                <span className="text-sm text-green-400 font-medium tracking-wide flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Reported Correctly</span>
                                <span className="font-bold text-green-400">3</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-sm text-slate-600 tracking-wide">Links Clicked</span>
                                <span className="font-bold text-slate-500">0</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-sm text-slate-600 tracking-wide">Credentials Submitted</span>
                                <span className="font-bold text-slate-500">0</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Badges Earned in Phishing</p>
                            <div className="flex gap-2">
                                <span className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 flex items-center gap-1.5"><span className="text-sm">👁️‍🗨️</span> Phishing Spotter</span>
                                <span className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-lg border border-yellow-500/20 flex items-center gap-1.5"><span className="text-sm">🔥</span> 3x Reporter</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}
