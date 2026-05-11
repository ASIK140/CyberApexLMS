'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function CreateCampaign() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        type: 'Email',
        template_id: 'password_reset',
        audience: 'all',
        schedule: 'immediate'
    });

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => s - 1);

    const handleLaunch = async () => {
        setLoading(true);
        try {
            // First create the campaign
            const res = await apiFetch('/ciso/phishing/create', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                // If immediate, simulate the trigger and send
                if (formData.schedule === 'immediate') {
                    await apiFetch('/ciso/phishing/send', {
                        method: 'POST',
                        body: JSON.stringify({ campaign_id: data.data.campaign_id })
                    });
                }
                alert('Campaign successfully launched!');
                router.push('/ciso/campaigns');
            } else {
                alert('Launch failed: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-[800px] mx-auto pb-10 text-slate-900">
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-3xl font-bold">New Phishing Campaign</h2>
                <div className="flex gap-2 mt-4 text-sm text-slate-600">
                    <span className={step >= 1 ? 'text-blue-500 font-bold' : ''}>1. Setup</span> {'>'}
                    <span className={step >= 2 ? 'text-blue-500 font-bold' : ''}>2. Template</span> {'>'}
                    <span className={step >= 3 ? 'text-blue-500 font-bold' : ''}>3. Audience</span> {'>'}
                    <span className={step >= 4 ? 'text-blue-500 font-bold' : ''}>4. Schedule</span>
                </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-8 shadow-xl min-h-[400px]">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800">Campaign Basic Info</h3>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-600">Campaign Name</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-slate-900 focus:border-blue-500 focus:outline-none" 
                                placeholder="e.g. Q2 Invoice Fraud Simulation"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-4 text-slate-600">Campaign Type</label>
                            <div className="grid grid-cols-3 gap-4">
                                {['Email', 'QR User Scan', 'Vishing'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setFormData({...formData, type: t === 'QR User Scan' ? 'QR' : t})}
                                        className={`p-4 border rounded-lg text-center transition ${formData.type === (t === 'QR User Scan' ? 'QR' : t) ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-300 hover:border-neutral-500'}`}
                                    >
                                        <div className="font-bold text-lg">{t.split(' ')[0]}</div>
                                        <div className="text-xs mt-1 text-slate-500">{t}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800">Select Template</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'password_reset', label: 'Password Reset', desc: 'Urgent IT support impersonation.' },
                                { id: 'invoice_fraud', label: 'Invoice Fraud', desc: 'Fake vendor payment request.' },
                                { id: 'ceo_fraud', label: 'CEO Fraud', desc: 'Executive wire-transfer request.' },
                                { id: 'qr_scam', label: 'QR MFA Scam', desc: 'Scan to authenticate device trap.' }
                            ].map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => setFormData({...formData, template_id: t.id})}
                                    className={`p-4 border rounded-lg text-left transition ${formData.template_id === t.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300 hover:border-neutral-500'}`}
                                >
                                    <div className={`font-bold ${formData.template_id === t.id ? 'text-blue-400' : 'text-slate-900'}`}>{t.label}</div>
                                    <div className="text-xs mt-1 text-slate-600">{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800">Target Audience</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${formData.audience === 'all' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-300'}`}>
                                <input type="radio" name="aud" checked={formData.audience === 'all'} onChange={() => setFormData({...formData, audience: 'all'})} />
                                <div>
                                    <span className="font-bold text-slate-900 block">All Staff</span>
                                    <span className="text-xs text-slate-500">Targets the entire employee directory</span>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${['Finance', 'Sales', 'HR', 'IT'].includes(formData.audience) ? 'border-orange-500 bg-orange-500/10' : 'border-slate-300'}`}>
                                <input type="radio" name="aud" checked={['Finance', 'Sales', 'HR', 'IT'].includes(formData.audience)} onChange={() => setFormData({...formData, audience: 'Finance'})} />
                                <div>
                                    <span className="font-bold text-slate-900 block">Department Level</span>
                                    <select 
                                        className="mt-2 bg-slate-50 border border-slate-300 rounded p-1 text-sm text-slate-700 focus:outline-none"
                                        value={formData.audience}
                                        onChange={e => setFormData({...formData, audience: e.target.value})}
                                    >
                                        <option value="Finance">Finance</option>
                                        <option value="Sales">Sales</option>
                                        <option value="HR">HR</option>
                                        <option value="IT">IT</option>
                                    </select>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800">Execution Schedule</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setFormData({...formData, schedule: 'immediate'})}
                                className={`p-4 border rounded-lg text-center transition ${formData.schedule === 'immediate' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-slate-300 text-white'}`}
                            >
                                <div className="font-bold text-lg">Immediate Launch</div>
                                <div className="text-xs mt-1 opacity-70">Execute immediately upon creation</div>
                            </button>
                            <button 
                                onClick={() => setFormData({...formData, schedule: '2026-05-01'})}
                                className={`p-4 border rounded-lg text-center transition ${formData.schedule !== 'immediate' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-slate-300 text-white'}`}
                            >
                                <div className="font-bold text-lg">Future Date</div>
                                <div className="text-xs mt-1 opacity-70">Schedule interval firing</div>
                                {formData.schedule !== 'immediate' && (
                                    <input type="date" className="mt-2 bg-slate-50 border border-slate-300 rounded p-1 text-sm text-slate-700 w-full" value="2026-05-01" readOnly />
                                )}
                            </button>
                        </div>
                    </div>
                )}

            </div>

            <div className="flex justify-between mt-2">
                <button
                    onClick={handlePrev}
                    disabled={step === 1}
                    className="px-6 py-2 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Back
                </button>
                
                {step < 4 ? (
                    <button 
                        onClick={handleNext}
                        disabled={step === 1 && !formData.name}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                    >
                        Next Step
                    </button>
                ) : (
                    <button 
                        onClick={handleLaunch}
                        disabled={loading}
                        className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white font-bold tracking-wide rounded-lg shadow-[0_0_15px_rgba(22,163,74,0.4)] transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Launching Simulator...' : 'Launch Campaign 🚀'}
                    </button>
                )}
            </div>
        </div>
    );
}
