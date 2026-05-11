import React from 'react';

export default function CertificatesPage() {
    const certificates = [
        {
            id: 'CERT-8492-AXL',
            course: 'Phishing, Smishing & Vishing',
            employee: 'Alice Thompson',
            score: '88%',
            passMark: '75%',
            framework: 'NIST CSF 2.0 (PR.AT-01)',
            issueDate: 'October 23, 2025',
            expiryDate: 'October 23, 2026',
            color: 'cyan'
        },
        {
            id: 'CERT-1049-GDPR',
            course: 'GDPR & Data Protection',
            employee: 'Alice Thompson',
            score: '82%',
            passMark: '80%',
            framework: 'GDPR Article 39',
            issueDate: 'September 15, 2025',
            expiryDate: 'September 15, 2026',
            color: 'blue'
        },
        {
            id: 'CERT-9921-SEC',
            course: 'Secure Dev & Cloud Security',
            employee: 'Alice Thompson',
            score: '91%',
            passMark: '75%',
            framework: 'ISO 27001:2022 (A.8)',
            issueDate: 'November 02, 2025',
            expiryDate: 'November 02, 2026',
            color: 'indigo'
        }
    ];

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">My Certificates</h2>
                    <p className="text-slate-600 text-sm">View, download, and share your earned security certifications.</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-white shadow-sm border border-slate-300 rounded-lg flex items-center gap-2 shadow-inner">
                        <span className="text-2xl">🏆</span>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Total Earned</p>
                            <p className="font-bold text-slate-900 leading-none">3 Certs</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {certificates.map(cert => (
                    <div key={cert.id} className="rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden shadow-2xl group relative hover:-translate-y-1 transition-transform duration-300">
                        
                        {/* Certificate Header Graphic */}
                        <div className={`h-32 bg-gradient-to-br border-b border-slate-200 relative overflow-hidden flex items-center justify-between px-8 z-0 
                            ${cert.color === 'cyan' ? 'from-cyan-900/60 to-blue-900/40 border-cyan-800' :
                              cert.color === 'blue' ? 'from-blue-900/60 to-indigo-900/40 border-blue-800' :
                              'from-indigo-900/60 to-purple-900/40 border-indigo-800'}`}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[50px] rounded-full"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-3xl shadow-xl">
                                    🛡️
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-black text-xl tracking-tight drop-shadow-lg">{cert.course}</h3>
                                    <p className="text-slate-900/70 text-xs font-semibold uppercase tracking-widest mt-0.5">Certificate of Completion</p>
                                </div>
                            </div>
                            <div className="hidden sm:block opacity-20 group-hover:opacity-40 transition-opacity">
                                <svg className="w-24 h-24 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                            </div>
                        </div>

                        {/* Certificate Details */}
                        <div className="p-8 flex-1 bg-gradient-to-b from-neutral-900 to-black z-10 relative">
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                                <span className="text-8xl font-black uppercase tracking-tighter -rotate-12">Verified</span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-8 relative z-10">
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Awarded to</p>
                                    <p className="text-lg font-bold text-slate-900">{cert.employee}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Performance</p>
                                    <p className="text-sm font-bold text-slate-900">Score: <span className="text-green-400">{cert.score}</span> <span className="text-neutral-600 font-normal ml-1">(Pass: {cert.passMark})</span></p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Compliance Framework</p>
                                    <p className="text-sm font-medium text-blue-400">{cert.framework}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Issue Date</p>
                                    <p className="text-sm font-medium text-slate-900">{cert.issueDate}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Valid Until</p>
                                    <p className="text-sm font-medium text-slate-900">{cert.expiryDate}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Certificate ID</p>
                                    <p className="text-xs font-mono text-slate-600">{cert.id}</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button className="p-2 bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-lg transition-colors border border-slate-300 hover:border-neutral-600" title="Verify Certificate">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </button>
                                    <button className="p-2 bg-slate-100 hover:bg-slate-100 text-[#0A66C2] rounded-lg transition-colors border border-slate-300 hover:border-neutral-600" title="Share on LinkedIn">
                                        {/* Simple LinkedIn Icon approximation */}
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                    </button>
                                    <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-900 text-xs font-semibold rounded-lg transition-all shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.4)] flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
}
