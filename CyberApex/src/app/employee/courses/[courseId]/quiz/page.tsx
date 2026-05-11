'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChapterQuizPage() {
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!selectedOption) return;
        setIsSubmitted(true);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
            
            {/* LEFT COLUMN: Rules & Progress */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
                
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full"></div>
                    
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Chapter 2 Quiz</h2>
                    <p className="text-xs text-slate-600 mb-6">Phishing, Smishing & Vishing</p>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 border border-slate-200">
                            <span className="text-sm text-slate-700 flex items-center gap-2"><svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Questions</span>
                            <span className="text-sm font-bold text-slate-900">4</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 border border-slate-200">
                            <span className="text-sm text-slate-700 flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Pass Mark</span>
                            <span className="text-sm font-bold text-green-400">75%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 border border-slate-200">
                            <span className="text-sm text-slate-700 flex items-center gap-2"><svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Retakes</span>
                            <span className="text-sm font-bold text-slate-900">Allowed Once</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 border border-slate-200">
                            <span className="text-sm text-slate-700 flex items-center gap-2"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Time Limit</span>
                            <span className="text-sm font-bold text-slate-900">None</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col content-between flex-1">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900">Progress</h3>
                            <span className="text-cyan-400 font-bold text-sm">Question 2 of 4</span>
                        </div>
                        <div className="flex gap-2 mb-6">
                            <div className="h-2 w-full bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                            <div className="h-2 w-full bg-cyan-500/30 rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-cyan-500 animate-pulse w-1/2"></div></div>
                            <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                            <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <button className="w-full py-3 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-xl transition-colors border border-slate-300" onClick={() => router.back()}>
                            Save & Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Question Panel */}
            <div className="flex-1 rounded-2xl bg-white shadow-sm border border-slate-200 p-8 flex flex-col">
                <div className="mb-6">
                    <span className="px-3 py-1 rounded-full bg-cyan-900/30 text-cyan-400 text-xs font-bold border border-cyan-500/20 uppercase tracking-widest">Scenario Question</span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-4 leading-snug">You receive the email below from the IT Helpdesk. What is the MOST suspicious indicator that this could be a phishing attempt?</h2>
                </div>

                {/* Simulated Email */}
                <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-neutral-200 mb-8 max-w-2xl">
                    <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-3 pb-2 text-neutral-800">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">IT Helpdesk</span>
                                <span className="text-xs text-slate-500"><span className="bg-yellow-200/50 border border-yellow-300 px-1 rounded text-red-600 font-mono font-medium">support@acme-corp-helpdesk.com</span></span>
                            </div>
                            <span className="text-xs text-slate-500">10:45 AM</span>
                        </div>
                        <div className="text-sm">To: <span className="font-medium">alice.thompson@acme.com</span></div>
                        <div className="text-sm font-bold mt-2">URGENT: Your Microsoft 365 password expires tonight</div>
                    </div>
                    <div className="p-5 text-neutral-800 text-sm space-y-4">
                        <p>Dear Alice,</p>
                        <p>Your multi-factor authentication token and password for your Microsoft 365 office account will expire in 12 hours according to our new security policy.</p>
                        <p>Please click the button below to retain your current password. If you fail to do so, your account access will be automatically locked.</p>
                        <div className="py-2">
                            <span className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded hover:bg-blue-700 cursor-pointer text-sm font-medium">Keep My Password</span>
                        </div>
                        <p>Thank you,<br/>IT Security Team</p>
                    </div>
                </div>

                {/* Answer Options */}
                <div className="flex flex-col gap-3 mt-auto">
                    {[
                        { id: 'A', text: 'The email uses urgent and threatening language ("expire in 12 hours", "automatically locked").' },
                        { id: 'B', text: 'The sender domain is acme-corp-helpdesk.com instead of acme.com.' },
                        { id: 'C', text: 'The email does not contain your employee ID number.' },
                        { id: 'D', text: 'It prompts you to click a button to keep your existing password.' },
                    ].map(opt => {
                        const isSelected = selectedOption === opt.id;
                        let optionClass = "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ";
                        
                        if (isSubmitted) {
                            if (opt.id === 'B') {
                                optionClass += "bg-green-500/10 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]"; // B is correct
                            } else if (isSelected && opt.id !== 'B') {
                                optionClass += "bg-red-500/10 border-red-500/50 text-white"; // incorrect selection
                            } else {
                                optionClass += "bg-white shadow-sm border-slate-200 text-slate-600 opacity-50"; // unselected
                            }
                        } else {
                            if (isSelected) {
                                optionClass += "bg-cyan-500/10 border-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.2)]";
                            } else {
                                optionClass += "bg-white shadow-sm border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700";
                            }
                        }

                        return (
                            <div key={opt.id} className={optionClass} onClick={() => !isSubmitted && setSelectedOption(opt.id)}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isSelected && !isSubmitted ? 'bg-cyan-500 text-white' : isSubmitted && opt.id === 'B' ? 'bg-green-500 text-white' : isSubmitted && isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {opt.id}
                                </div>
                                <p className="mt-1 flex-1 leading-relaxed">{opt.text}</p>
                                
                                {isSubmitted && opt.id === 'B' && (
                                    <div className="flex-shrink-0 mt-1"><svg className="w-6 h-6 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                                )}
                                {isSubmitted && isSelected && opt.id !== 'B' && (
                                    <div className="flex-shrink-0 mt-1"><svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-end">
                    {!isSubmitted ? (
                        <button 
                            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${selectedOption ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                            onClick={handleSubmit}
                            disabled={!selectedOption}
                        >
                            Submit Answer
                        </button>
                    ) : (
                        <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 transition-all">
                            Next Question
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
