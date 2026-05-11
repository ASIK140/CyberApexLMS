'use client';
import React, { useState } from 'react';
import RoleLayout, { NavSection } from '@/components/layout/RoleLayout';
import { apiFetch } from '@/utils/api';

const navSections: NavSection[] = [
    {
        title: 'OVERVIEW',
        items: [
            { label: 'Dashboard', href: '/tenant-admin/dashboard', icon: '📊' },
        ],
    },
    {
        title: 'USERS',
        items: [
            { label: 'User Management', href: '/tenant-admin', icon: '👥' },
            { label: 'Group Management', href: '/tenant-admin/groups', icon: '🏢' },
            { label: 'Import / SCIM Sync', href: '/tenant-admin/import', icon: '📤' },
        ],
    },
    {
        title: 'TRAINING',
        items: [
            { label: 'Courses', href: '/tenant-admin/courses', icon: '📚' },
            { label: 'Reports', href: '/tenant-admin/reports', icon: '📈' },
        ],
    },
    {
        title: 'PHISHING',
        items: [
            { label: 'Phishing Simulator', href: '/tenant-admin/phishing', icon: '🎣' },
            { label: 'Email Templates', href: '/tenant-admin/email-templates', icon: '✉️' },
        ],
    },
    {
        title: 'CONFIGURATION',
        items: [
            { label: 'Settings', href: '/tenant-admin/settings', icon: '⚙️' },
            { label: 'SSO Configuration', href: '/tenant-admin/sso', icon: '🔑' },
        ],
    },
];

const STEPS = [
    { id: 1, name: 'Attack Type', desc: 'Select vector' },
    { id: 2, name: 'Build Template', desc: 'Email/SMS content' },
    { id: 3, name: 'Landing Page', desc: 'Post-click behavior' },
    { id: 4, name: 'Audience & Schedule', desc: 'Targeting' },
    { id: 5, name: 'Debrief & Remedial', desc: 'Training assignment' },
    { id: 6, name: 'Preview & Launch', desc: 'Review setup' },
];

const ATTACK_TYPES = [
    { id: 'Email Phishing', name: 'Email Phishing', icon: '📧', category: 'Most Common', desc: 'Standard deceptive email mimicking trusted brands or internal comms.' },
    { id: 'SMS Smishing', name: 'SMS Smishing', icon: '📱', category: 'Mobile', desc: 'Text messages with urgent alerts or package delivery links.' },
    { id: 'QR Code', name: 'QR Code Attack (Quishing)', icon: '🔳', category: 'Physical/Digital', desc: 'Malicious QR codes placed in emails or physical spaces.' },
    { id: 'Vishing', name: 'Vishing (Voice)', icon: '📞', category: 'Advanced', desc: 'Automated voice calls requesting sensitive information.' },
    { id: 'Deepfake / AI', name: 'Deepfake / AI', icon: '🤖', category: 'Cutting Edge', desc: 'AI-generated personalized attacks using scraped data.' },
];

export default function TenantAdminPhishingBuilder() {
    const [currentStep, setCurrentStep] = useState(1);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Form States
    const [campaignName, setCampaignName] = useState('Q3 Platform Security Simulation');
    const [difficulty, setDifficulty] = useState('Advanced');
    
    // Step 1
    const [selectedAttack, setSelectedAttack] = useState('Email Phishing');
    
    // Step 2
    const [template, setTemplate] = useState({
        displayName: 'IT Support Team', fromEmail: 'it-admin@acmecorp-secure.com', replyTo: 'no-reply@acmecorp-secure.com',
        subject: 'MANDATORY: Verify your Office 365 Login', preHeader: 'Action required immediately to prevent account lockout.',
        urgency: 'High', body: '<p>Dear {{FirstName}},</p>\n<p>Please click the button below to verify your login.</p>\n<button>Verify Now</button>',
        redFlags: ['Lookalike domain', 'Urgency']
    });

    const toggleRedFlag = (flag: string) => setTemplate({ ...template, redFlags: template.redFlags.includes(flag) ? template.redFlags.filter(f => f !== flag) : [...template.redFlags, flag] });

    // Step 3
    const [landingPage, setLandingPage] = useState({
        type: 'Credential Harvest (Fake Login Page)', templateName: 'Microsoft 365', customDomain: 'login.microsoft-secure.io',
        sslDisplay: true, redirectUrl: 'https://acmecorp.com/intranet', assignTraining: true, alertSupervisor: false, alertCiso: true
    });

    // Step 4
    const [audience, setAudience] = useState({ targeting: 'All employees', exclusions: ['IT Team'], launchDate: '2026-03-22', timeWindow: '09:00 - 15:00', staggerSending: true });
    
    // Step 5
    const [debrief, setDebrief] = useState({ timing: 'Immediate', style: 'Annotated', tone: 'Educational', notifySupervisor: true, rewardUsers: true });

    // APIs
    const saveDraft = async (advance = false) => {
        setProcessing(true);
        try {
            let cid = campaignId;
            if (!cid) {
                const initRes = await apiFetch('/tenant/phishing/campaign/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: campaignName, attack_type: selectedAttack }) });
                const initData = await initRes.json();
                if (!initData.success) throw new Error(initData.message || 'Failed to initialize campaign');
                cid = initData.data.campaign_id;
                setCampaignId(cid);
            }
            const saveRes = await apiFetch('/tenant/phishing/campaign/save-draft', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaign_id: cid, attack_type: selectedAttack, name: campaignName,
                    template: { subject: template.subject, body: template.body, red_flags: template.redFlags },
                    landing_page: { type: landingPage.type, template_name: landingPage.templateName, redirect_url: landingPage.redirectUrl },
                    targets: [] // Dummy targets
                })
            });
            const saveData = await saveRes.json();
            if (!saveData.success) throw new Error(saveData.message || 'Failed to save draft details');

            if (advance) {
                setCurrentStep(prev => Math.min(STEPS.length, prev + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setActiveModal('save_draft');
                setTimeout(() => setActiveModal(null), 2000);
            }
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Error saving draft");
        } finally {
            setProcessing(false);
        }
    };

    const confirmLaunch = async () => {
        setProcessing(true);
        try {
            let cid = campaignId;
            if (!cid) {
                const initRes = await apiFetch('/tenant/phishing/campaign/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: campaignName, attack_type: selectedAttack }) });
                const initData = await initRes.json();
                if (!initData.success) throw new Error(initData.message || 'Failed to initialize campaign');
                cid = initData.data.campaign_id;
                setCampaignId(cid);
            }
            const launchRes = await apiFetch('/tenant/phishing/campaign/launch', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaign_id: cid, launch_date: audience.launchDate }) // Launches based on schedule
            });
            const launchData = await launchRes.json();
            if (!launchData.success) throw new Error(launchData.message || 'Failed to launch campaign');

            setActiveModal('launch_success');
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Error launching campaign");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <RoleLayout title="Phishing Simulator" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-20">

                <div className="flex justify-between items-center sm:flex-row flex-col gap-4 bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
                    <div>
                        <input
                            type="text"
                            value={campaignName}
                            onChange={e => setCampaignName(e.target.value)}
                            className="text-2xl font-bold text-slate-900 bg-transparent border-none focus:outline-none p-0 m-0 decoration-dashed underline-offset-4 hover:underline cursor-text w-full max-w-lg"
                        />
                        <p className="text-slate-500 text-sm mt-1">Configure and launch targeted social engineering campaigns.</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button onClick={() => saveDraft(false)} disabled={processing} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 shadow-md transition-colors">
                            {processing ? 'Saving...' : '💾 Save Draft'}
                        </button>
                        <button onClick={() => setActiveModal('launch_confirm')} disabled={processing} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all">
                            ▶ Launch Campaign
                        </button>
                    </div>
                </div>

                <div className="w-full py-5 border border-slate-200 bg-white shadow-sm rounded-2xl px-4 sticky top-6 z-40">
                    <div className="flex justify-between relative max-w-5xl mx-auto hidden md:flex">
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
                        <div className="absolute top-1/2 left-4 h-0.5 bg-purple-500 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>

                        {STEPS.map((step) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 z-10 w-24" onClick={() => setCurrentStep(step.id)}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all cursor-pointer ${isActive ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] scale-110' :
                                            isCompleted ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white shadow-sm border-slate-300 text-slate-500'}`}>
                                        {isCompleted ? '✓' : step.id}
                                    </div>
                                    <div className="text-center mt-1">
                                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-900' : isCompleted ? 'text-slate-700' : 'text-slate-500'}`}>{step.name}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl flex flex-col min-h-[600px] overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/20">
                        <h3 className="font-bold text-xl text-slate-900">Step {currentStep}: {STEPS[currentStep - 1].name}</h3>
                        {currentStep === 1 && (
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-slate-600 font-medium">Difficulty Level:</label>
                                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-300 flex items-center gap-2 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 text-red-400 font-bold bg-red-500/5 cursor-pointer appearance-none">
                                    <option className="bg-white shadow-sm text-slate-900">Entry Level</option>
                                    <option className="bg-white shadow-sm text-slate-900">Intermediate</option>
                                    <option className="bg-white shadow-sm text-slate-900">Advanced</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="p-8 flex-1">
                        {/* STEP 1: ATTACK TYPE */}
                        {currentStep === 1 && (
                            <div className="animate-in fade-in xl:px-12">
                                <p className="text-slate-600 mb-8 max-w-3xl">Select the primary vector for this simulation. Different vectors test different employee reflexes and require varying templates. <strong>Only ONE attack type is selectable per campaign instance.</strong></p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {ATTACK_TYPES.map(type => (
                                        <div key={type.id} onClick={() => setSelectedAttack(type.id)} className={`p-6 rounded-xl border-2 transition-all cursor-pointer relative group ${selectedAttack === type.id ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.15)]' : 'bg-slate-50 border-slate-200 hover:border-neutral-600'}`}>
                                            <div className="absolute top-5 right-5">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${selectedAttack === type.id ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>{type.category}</span>
                                            </div>
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-5 transition-colors ${selectedAttack === type.id ? 'bg-purple-500/20 text-white' : 'bg-slate-100'}`}>
                                                {type.icon}
                                            </div>
                                            <h4 className="font-bold text-slate-900 text-lg mb-2">{type.name}</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">{type.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: BUILD TEMPLATE */}
                        {currentStep === 2 && (
                            <div className="animate-in fade-in grid grid-cols-1 lg:grid-cols-5 gap-8 xl:px-4">
                                <div className="lg:col-span-3 space-y-6">
                                    <h4 className="text-lg font-bold text-slate-900">Email Spoofing Settings</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Display Name</label><input type="text" value={template.displayName} onChange={e=>setTemplate({...template, displayName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" /></div>
                                        <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">From Email (Spoofed)</label><input type="text" value={template.fromEmail} onChange={e=>setTemplate({...template, fromEmail: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" /></div>
                                        <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Reply-To</label><input type="text" value={template.replyTo} onChange={e=>setTemplate({...template, replyTo: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" /></div>
                                        <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Subject Line</label><input type="text" value={template.subject} onChange={e=>setTemplate({...template, subject: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" /></div>
                                    </div>

                                    <div className="pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Body Editor</label>
                                            <div className="flex gap-2">
                                                <button className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-900 border border-slate-300">HTML</button>
                                                <button className="px-2 py-1 bg-transparent rounded text-xs text-slate-500 border border-transparent">Plain Text</button>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-t-lg p-2 flex gap-2 overflow-x-auto">
                                            <button className="px-3 py-1 bg-white shadow-sm rounded border border-slate-300 text-[10px] text-slate-900 whitespace-nowrap opacity-50 cursor-default">+ Add Button (Phish Link)</button>
                                            <button className="px-3 py-1 bg-white shadow-sm rounded border border-slate-300 text-[10px] text-slate-900 whitespace-nowrap opacity-50 cursor-default">📎 Add Attachment</button>
                                            <button className="px-3 py-1 bg-white shadow-sm rounded border border-slate-300 text-[10px] text-slate-900 whitespace-nowrap opacity-50 cursor-default">🖼️ Add Logo</button>
                                            <select className="px-3 py-1 bg-white shadow-sm rounded border border-slate-300 text-[10px] text-slate-900 focus:outline-none">
                                                <option>Personalization</option><option>{`{{FirstName}}`}</option><option>{`{{Department}}`}</option>
                                            </select>
                                        </div>
                                        <textarea value={template.body} onChange={e=>setTemplate({...template, body: e.target.value})} className="w-full h-64 px-4 py-3 bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg text-sm text-slate-700 font-mono focus:outline-none focus:border-purple-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 block">Note: This system automatically generates and attaches a unique tracked Phishing Link configuration behind the scenes.</p>
                                </div>
                                <div className="lg:col-span-2">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2"><span className="text-xl">🚨</span> Critical Feature: Red Flag Indicators</h4>
                                        <p className="text-xs text-slate-600 mb-6">Select the psychological or technical red flags present in this template. These are highlighted to the user during the post-click debriefing to teach them what they missed.</p>
                                        
                                        <div className="space-y-3">
                                            {['Lookalike domain', 'Urgency', 'Generic greeting', 'Suspicious link', 'Grammar / Typos', 'Unexpected attachment'].map(flag => (
                                                <label key={flag} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white shadow-sm cursor-pointer hover:border-neutral-600 transition-colors">
                                                    <input type="checkbox" checked={template.redFlags.includes(flag)} onChange={() => toggleRedFlag(flag)} className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 bg-slate-50" />
                                                    <span className="text-sm font-semibold text-slate-900">{flag}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: LANDING PAGE */}
                        {currentStep === 3 && (
                            <div className="animate-in fade-in max-w-5xl mx-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['Credential Harvest (Fake Login Page)', 'Immediate Debrief', 'Silent Tracking'].map(lpType => (
                                        <div key={lpType} onClick={() => setLandingPage({...landingPage, type: lpType})} className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${landingPage.type === lpType ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.15)]' : 'bg-slate-50 border-slate-200'}`}>
                                            <h4 className="font-bold text-slate-900 text-sm">{lpType}</h4>
                                        </div>
                                    ))}
                                </div>

                                {landingPage.type === 'Credential Harvest (Fake Login Page)' && (
                                    <>
                                        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 space-y-6">
                                            <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Fake Login Templates</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                {['Microsoft 365', 'Google Workspace', 'DocuSign', 'Custom Portal'].map(tName => (
                                                    <button key={tName} onClick={() => setLandingPage({...landingPage, templateName: tName})} className={`py-3 px-4 rounded-lg text-sm font-semibold border ${landingPage.templateName === tName ? 'bg-purple-600 text-white border-purple-500' : 'bg-white shadow-sm border-slate-300 text-slate-600'}`}>
                                                        {tName}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Custom Domain</label><input type="text" value={landingPage.customDomain} onChange={e=>setLandingPage({...landingPage, customDomain: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" /></div>
                                                <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Redirect After Submit URL</label><input type="text" value={landingPage.redirectUrl} onChange={e=>setLandingPage({...landingPage, redirectUrl: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" /></div>
                                            </div>
                                            <label className="flex items-center gap-3"><input type="checkbox" checked={landingPage.sslDisplay} onChange={e=>setLandingPage({...landingPage, sslDisplay: e.target.checked})} className="w-4 h-4 rounded text-purple-600" /><span className="text-sm text-slate-900 font-medium">Render fake SSL Padlock in UI preview</span></label>
                                        </div>

                                        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                                            <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Post Actions (Triggered on Submit)</h4>
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-3"><input type="checkbox" checked={landingPage.assignTraining} onChange={e=>setLandingPage({...landingPage, assignTraining: e.target.checked})} className="w-4 h-4 rounded text-purple-600" /><span className="text-sm text-slate-900 font-medium">Assign Remedial Training</span></label>
                                                <label className="flex items-center gap-3"><input type="checkbox" checked={landingPage.alertSupervisor} onChange={e=>setLandingPage({...landingPage, alertSupervisor: e.target.checked})} className="w-4 h-4 rounded text-purple-600" /><span className="text-sm text-slate-900 font-medium">Alert Supervisor</span></label>
                                                <label className="flex items-center gap-3"><input type="checkbox" checked={landingPage.alertCiso} onChange={e=>setLandingPage({...landingPage, alertCiso: e.target.checked})} className="w-4 h-4 rounded text-purple-600" /><span className="text-sm text-slate-900 font-medium">Alert CISO (High Risk)</span></label>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* STEP 4: AUDIENCE & SCHEDULE */}
                        {currentStep === 4 && (
                            <div className="animate-in fade-in max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                                        <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">🎯 Target Audience</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Targeting Rules</label>
                                                <select value={audience.targeting} onChange={e=>setAudience({...audience, targeting: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500">
                                                    <option>All employees</option><option>Department-based</option><option>Custom list</option>
                                                </select>
                                            </div>
                                            <div className="pt-2">
                                                <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Exclusions</label>
                                                {['IT Team', 'Recent participants', 'Leave users'].map(ex => (
                                                    <label key={ex} className="flex items-center gap-3 mb-2"><input type="checkbox" checked={audience.exclusions.includes(ex)} onChange={(e)=>{
                                                        const nex = e.target.checked ? [...audience.exclusions, ex] : audience.exclusions.filter(x=>x!==ex);
                                                        setAudience({...audience, exclusions: nex});
                                                    }} className="w-4 h-4 rounded text-purple-600" /><span className="text-sm text-slate-900">{ex}</span></label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                                        <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">📊 Baseline Comparison</h4>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3"><input type="radio" name="baseline" className="w-4 h-4 text-purple-600" defaultChecked /><span className="text-sm text-slate-900">Compare with previous campaign</span></label>
                                            <label className="flex items-center gap-3"><input type="radio" name="baseline" className="w-4 h-4 text-purple-600" /><span className="text-sm text-slate-900">Compare with industry benchmark</span></label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                                        <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">📅 Scheduling Engine</h4>
                                        <div className="space-y-4">
                                            <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Launch Date</label><input type="date" value={audience.launchDate} onChange={e=>setAudience({...audience, launchDate: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 [color-scheme:dark]" /></div>
                                            <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Time Window (Local Time)</label><input type="text" value={audience.timeWindow} onChange={e=>setAudience({...audience, timeWindow: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" /></div>
                                            <label className="flex items-center gap-3 pt-2"><input type="checkbox" checked={audience.staggerSending} onChange={e=>setAudience({...audience, staggerSending: e.target.checked})} className="w-4 h-4 rounded text-purple-600" /><span className="text-sm text-slate-900 font-semibold">Stagger sending over 48 hours</span></label>
                                            <p className="text-xs text-slate-500">Staggering prevents the target departments from instantly alerting each other of the simulation.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: DEBRIEF & REMEDIAL */}
                        {currentStep === 5 && (
                            <div className="animate-in fade-in max-w-5xl mx-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                                        <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Debrief Settings</h4>
                                        <div className="space-y-4">
                                            <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Timing</label>
                                            <select value={debrief.timing} onChange={e=>setDebrief({...debrief, timing: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none"><option>Immediate</option><option>Delayed</option></select></div>
                                            <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Style</label>
                                            <select value={debrief.style} onChange={e=>setDebrief({...debrief, style: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none"><option>Annotated Format</option><option>Tips Format</option></select></div>
                                            <div><label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Tone</label>
                                            <select value={debrief.tone} onChange={e=>setDebrief({...debrief, tone: e.target.value})} className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none"><option>Educational</option><option>Strict</option></select></div>
                                        </div>
                                    </div>
                                    <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 h-full flex flex-col justify-center">
                                        <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">🏆 Positive Reinforcement</h4>
                                        <label className="flex items-start gap-4 p-4 rounded-xl border border-green-500/20 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition-colors">
                                            <input type="checkbox" checked={debrief.rewardUsers} onChange={e=>setDebrief({...debrief, rewardUsers: e.target.checked})} className="w-5 h-5 rounded text-green-500 mt-0.5 bg-white shadow-sm" />
                                            <div>
                                                <span className="text-sm text-green-400 font-bold block mb-1">Reward users who report phishing</span>
                                                <p className="text-xs text-slate-600">Users who hit the "Phish Report" button in their email client without clicking will receive an automated positive reinforcement certificate.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
                                    <h4 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">🤖 Core Automation Engine Rules</h4>
                                    <div className="space-y-3">
                                        <div className="p-4 rounded border-l-4 border-purple-500 bg-white shadow-sm font-mono text-sm text-slate-700">
                                            <span className="text-purple-400 font-bold">IF</span> Clicked <span className="text-purple-400 font-bold">→</span> Assign training module automatically
                                        </div>
                                        <div className="p-4 rounded border-l-4 border-red-500 bg-white shadow-sm font-mono text-sm text-slate-700">
                                            <span className="text-red-400 font-bold">IF</span> Credentials Entered <span className="text-red-400 font-bold">→</span> Mark HIGH RISK + Alert {landingPage.alertCiso ? 'CISO' : 'Admin'}
                                        </div>
                                        <div className="p-4 rounded border-l-4 border-orange-500 bg-white shadow-sm font-mono text-sm text-slate-700">
                                            <span className="text-orange-400 font-bold">IF</span> Repeated Failure <span className="text-orange-400 font-bold">→</span> Trigger HR Escalation workflow
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 6: PREVIEW & LAUNCH */}
                        {currentStep === 6 && (
                            <div className="animate-in fade-in max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">Campaign Summary</h3>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:border-neutral-600 transition-colors">
                                            <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Attack Type</p><p className="text-slate-900 font-medium flex items-center gap-2 text-sm">{ATTACK_TYPES.find(a => a.name === selectedAttack)?.icon} {selectedAttack}</p></div>
                                            <button onClick={() => setCurrentStep(1)} className="text-purple-400 text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                        </div>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:border-neutral-600 transition-colors">
                                            <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Template Engine</p><p className="text-slate-900 font-medium text-sm">Subject: {template.subject}</p></div>
                                            <button onClick={() => setCurrentStep(2)} className="text-purple-400 text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                        </div>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:border-neutral-600 transition-colors">
                                            <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Landing Page</p><p className="text-slate-900 font-medium text-sm">{landingPage.type}</p></div>
                                            <button onClick={() => setCurrentStep(3)} className="text-purple-400 text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                        </div>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:border-neutral-600 transition-colors">
                                            <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Audience & Schedule</p><p className="text-slate-900 font-medium text-sm">{audience.targeting} • Launch: {audience.launchDate}</p></div>
                                            <button onClick={() => setCurrentStep(4)} className="text-purple-400 text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                        </div>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:border-neutral-600 transition-colors">
                                            <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Difficulty Matrix</p><p className="text-red-400 font-bold uppercase text-sm">{difficulty}</p></div>
                                            <button onClick={() => setCurrentStep(1)} className="text-purple-400 text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">Pre-Launch Diagnostics</h3>
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 font-mono text-sm leading-relaxed">
                                        <div className="flex items-center gap-3 text-green-400"><span className="text-lg">✓</span> SPF/DKIM Configuration Verified</div>
                                        <div className="flex items-center gap-3 text-green-400"><span className="text-lg">✓</span> Landing Page SSL Certificates Active</div>
                                        <div className="flex items-center gap-3 text-green-400"><span className="text-lg">✓</span> Recipient List Clean (0 Bounces)</div>
                                        <div className="flex items-center gap-3 text-green-400"><span className="text-lg">✓</span> Legal & Compliance Checklist Passed</div>
                                        <div className="flex items-center gap-3 text-green-400"><span className="text-lg">✓</span> Automation Engine Webhooks Connected</div>
                                    </div>
                                    
                                    <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                        <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">System Actions</h4>
                                        <div className="flex gap-3">
                                            <button className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Send Test Email</button>
                                            <button onClick={() => saveDraft(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Save To Drafts</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <button onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1} className="px-8 py-3 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-bold tracking-wide rounded-xl shadow-md border border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            ← BACK
                        </button>

                        {currentStep < STEPS.length ? (
                            <button onClick={() => saveDraft(true)} disabled={processing} className="px-8 py-3 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-bold tracking-wide rounded-xl shadow-md border border-slate-300 transition-all flex items-center gap-2 group">
                                {processing ? 'SAVING...' : 'SAVE & CONTINUE →'}
                            </button>
                        ) : (
                            <button onClick={() => setActiveModal('launch_confirm')} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold tracking-wide rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all uppercase hover:scale-105 active:scale-95 origin-center">
                                Launch Campaign Now
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {activeModal === 'save_draft' && (
                <div className="fixed bottom-6 right-6 bg-white shadow-sm border border-slate-200 border-l-4 border-l-purple-500 text-slate-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl text-purple-400">💾</div>
                    <div>
                        <p className="font-bold text-sm">Draft Synced to Cloud</p>
                        <p className="text-xs text-slate-600 mt-0.5 max-w-[200px]">Network template configuration and funnel rules saved.</p>
                    </div>
                </div>
            )}

            {activeModal === 'launch_confirm' && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 text-red-500 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20"></span>
                            🚀
                        </div>
                        <h3 className="font-bold text-slate-900 text-2xl mb-2">Initialize Payload?</h3>
                        <p className="text-sm text-slate-600 mb-8 leading-relaxed">You are about to deploy <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded mx-1">{campaignName}</strong>. This executes the selected Attack Vector logic against the live employee pipeline immediately.</p>
                        <div className="flex gap-4 w-full">
                            <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-white shadow-sm hover:bg-slate-100 text-slate-700 text-sm font-bold tracking-wide uppercase rounded-xl border border-slate-200 transition-colors shadow-md">Abort</button>
                            <button onClick={confirmLaunch} disabled={processing} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold tracking-wide uppercase rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">
                                {processing ? 'Engaging...' : 'Authorize'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'launch_success' && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-10 text-center animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 text-green-400 shadow-[0_0_50px_rgba(34,197,94,0.3)] relative">
                            <span className="absolute inset-0 rounded-full bg-green-400 blur disabled:opacity-20 animate-pulse"></span>
                            ✓
                        </div>
                        <h3 className="font-bold text-slate-900 text-3xl mb-4">Simulation Live</h3>
                        <p className="text-base text-slate-600 mb-8 leading-relaxed">
                            <strong className="text-slate-900">{campaignName}</strong> engine is spun up. Automation rules are active and payloads are bridging. Check your analytical node to monitor live credential intercepts.
                        </p>
                        <button onClick={() => { setActiveModal(null); window.location.href = '/ciso/campaigns'; }} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all">
                            Engage Funnel Dashboard
                        </button>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}
