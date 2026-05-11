'use client';
import React, { useState } from 'react';

const evidencePacks = [
    { fw: 'ISO 27001', description: 'A.6.3 Security Awareness Evidence Pack', includes: ['User Certificates (74)', 'Training Completion Logs', 'Exam Score Register', 'Phishing Campaign Reports'], size: '4.2 MB', color: 'blue' },
    { fw: 'DORA', description: 'Article 13 ICT Security Evidence Pack', includes: ['ICT Training Records', 'Drills & Exercises Log', 'Completion Certificates', 'Gap Analysis Report'], size: '2.8 MB', color: 'red' },
    { fw: 'PCI DSS', description: 'Requirement 12.6 Evidence Package', includes: ['Annual Training Records', 'User Acknowledgements', 'Certificates of Completion', 'Phishing Simulation Results'], size: '3.5 MB', color: 'yellow' },
    { fw: 'SOC2', description: 'CC9.2 Risk Communication Evidence Pack', includes: ['Training Completion Logs', 'Risk Communication Records', 'Certificates', 'Exam Results'], size: '1.9 MB', color: 'purple' },
];

export default function EvidencePackPage() {
    const [msg, setMsg] = useState('');
    const act = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    return (
        <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Evidence Pack</h2>
                    <p className="text-sm text-slate-600 mt-1">Downloadable compliance audit evidence packages per framework.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { alert('Initiating bulk download of all compliance evidence archives.'); act('📥 Downloading all evidence packs as ZIP…'); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-md">Download All Packs</button>
                </div>
            </div>

            {msg && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">{msg}</div>}

            {/* FRAMEWORK PACKS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {evidencePacks.map((pack, i) => (
                    <div key={i} className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 shadow-lg hover:-translate-y-1 transition-transform">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className={`text-xs font-mono font-black text-${pack.color}-400 bg-${pack.color}-500/10 border border-${pack.color}-500/20 px-2 py-0.5 rounded`}>{pack.fw}</span>
                                <h3 className="text-base font-bold text-slate-900 mt-2">{pack.description}</h3>
                            </div>
                            <span className="text-xs text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">{pack.size}</span>
                        </div>

                        <div className="mb-5">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Includes</p>
                            <ul className="space-y-1">
                                {pack.includes.map((item, j) => (
                                    <li key={j} className="flex items-center gap-2 text-sm text-slate-700">
                                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-200">
                            <button onClick={() => { alert('Compiling and downloading full evidence package ZIP for ' + pack.fw); act(`📦 Downloading ${pack.fw} Evidence ZIP…`); }} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download {pack.fw} ZIP
                            </button>
                            <button onClick={() => { alert('Generating executive evidence summary PDF for ' + pack.fw); act(`📄 Generating ${pack.fw} PDF evidence report…`); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg border border-slate-300 shadow-md transition-colors">PDF</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* INDIVIDUAL EXPORTS */}
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 shadow-lg">
                <h3 className="font-bold text-slate-900 mb-4">Individual Document Exports</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'All Certificates PDF', icon: '🏆', desc: '218 valid certificates' },
                        { label: 'Training Completion Logs', icon: '📚', desc: 'All 340 employees' },
                        { label: 'Exam Score Register', icon: '📝', desc: 'All exam attempts' },
                    ].map(item => (
                        <button key={item.label} onClick={() => act(`📥 Exporting: ${item.label}…`)} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500/30 hover:bg-slate-100 transition-colors text-left group">
                            <span className="text-2xl block mb-2">{item.icon}</span>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-300 transition-colors">{item.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
