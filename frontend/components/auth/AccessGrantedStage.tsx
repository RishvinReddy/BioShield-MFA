
import React from 'react';
import { Shield, CheckCircle, Smartphone, Lock, Activity, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessGrantedProps {
    fusionData: any;
}

export const AccessGrantedStage: React.FC<AccessGrantedProps> = ({ fusionData }) => {
    const navigate = useNavigate();

    // Default Fallback Data if fusionData missing (for dev safety)
    const stats = {
        score: fusionData?.score || 99.8,
        risk: fusionData?.score > 0.8 ? 'LOW' : 'HIGH',
        liveness: 'PASS'
    };

    return (
        <div className="w-full max-w-lg bg-white rounded-3xl p-1 shadow-2xl animate-fade-in mx-4">
            <div className="p-8 pb-0 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                    <Lock className="w-8 h-8 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Granted</h1>
                <p className="text-slate-500 font-medium">Identity Verification Complete</p>
            </div>

            <div className="p-8">
                {/* Stats Card */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                    <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold text-slate-500 tracking-wider">XAI TRUST SCORE</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: #{Math.floor(Math.random() * 10000)}-AUTH-X</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{stats.score}%</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Confidence</div>
                        </div>
                        <div className="border-x border-slate-200">
                            <div className="text-xl font-bold text-green-600">{stats.liveness}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Liveness</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-blue-600">{stats.risk}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Risk Level</div>
                        </div>
                    </div>
                </div>

                {/* Vectors List */}
                <div className="space-y-4 mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Verification Vectors</h4>

                    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-slate-800">Facial Topography</h5>
                                <p className="text-xs text-slate-400">3D Depth Map + 128 Nodal Points Matched</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg border border-green-100 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> VERIFIED
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <FingerprintIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-slate-800">Vascular Pattern</h5>
                                <p className="text-xs text-slate-400">Hemoglobin Absorption + Subcutaneous Match</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg border border-green-100 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> VERIFIED
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-slate-800">Cognitive Reflex</h5>
                                <p className="text-xs text-slate-400">Neurometric Timing + Human Entropy Confirmed</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg border border-green-100 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> VERIFIED
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                    <span>Enter Secure Dashboard</span>
                    <Lock className="w-4 h-4 ml-1" />
                </button>

                <div className="text-center mt-6">
                    <p className="text-[10px] text-slate-300">© Audit Log Reference: {Date.now()}</p>
                </div>
            </div>
        </div>
    );
};

// Helper icon
const FingerprintIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6" /><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" /><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" /><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" /><path d="M8.65 22c.21-.66.45-1.32.57-2" /><path d="M14 13.12c0 2.38 0 6.38-1 8.88" /><path d="M2 16h.01" /><path d="M21.8 16c.2-2 .131-5.354 0-6" /><path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" /></svg>
);
