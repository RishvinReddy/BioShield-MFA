
import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, Users, Activity, Lock, Globe, Terminal,
    UserPlus, Search, AlertTriangle, FileText, Server,
    Database, RefreshCw, Key, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'THREATS' | 'SYSTEM'>('OVERVIEW');
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeBiometrics: 0,
        recentThreats: 0,
        systemHealth: 'Scanning...',
        encryptionStatus: 'Verifying...'
    });

    // User Management State
    const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '' });
    const [userCreationStatus, setUserCreationStatus] = useState<'IDLE' | 'CREATING' | 'SUCCESS' | 'ERROR'>('IDLE');

    useEffect(() => {
        loadStats();
        // Poll for real-time updates
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        const res = await api.admin.getStats();
        if (res.success) {
            setStats(res.data);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserCreationStatus('CREATING');
        const res = await api.admin.createUser(newUser);
        if (res.success) {
            setUserCreationStatus('SUCCESS');
            setNewUser({ username: '', password: '', fullName: '' });
            setTimeout(() => setUserCreationStatus('IDLE'), 3000);
            loadStats(); // Refresh stats
        } else {
            alert('Failed: ' + (res.error?.message || 'Unknown error'));
            setUserCreationStatus('ERROR');
        }
    };

    return (
        <div className="flex-1 p-6 animate-fade-in">
            {/* Header / Top Bar */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-indigo-600" />
                        BioShield Admin Command
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Level 5 Clearance • {stats.encryptionStatus}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={loadStats} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs flex items-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                        SYSTEM OPERATIONAL
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.totalUsers}</div>
                        <div className="text-xs text-slate-500 font-medium">Total Identities</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.activeBiometrics}</div>
                        <div className="text-xs text-slate-500 font-medium">Encrypted Assets</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">100%</div>
                        <div className="text-xs text-slate-500 font-medium">Encryption Coverage</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.recentThreats}</div>
                        <div className="text-xs text-slate-500 font-medium">Threats Blocked (24h)</div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[600px] flex overflow-hidden">

                {/* Sidebar Navigation */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('OVERVIEW')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'OVERVIEW' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Activity className="w-5 h-5" />
                            <span className="font-bold text-sm">Live Monitor</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('USERS')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'USERS' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="font-bold text-sm">User Management</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('THREATS')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'THREATS' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Globe className="w-5 h-5" />
                            <span className="font-bold text-sm">Threat Intel</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('SYSTEM')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'SYSTEM' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Server className="w-5 h-5" />
                            <span className="font-bold text-sm">System Health</span>
                        </button>
                    </div>

                    <div className="mt-auto">
                        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                            <div className="flex items-center space-x-2 mb-2">
                                <Key className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-600">Master Key Role</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                                You are operating with Root Admin privileges. All actions are immutable and logged.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-8 overflow-y-auto">

                    {/* --- TAB: OVERVIEW --- */}
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Security Operations Center</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-64 flex flex-col justify-center items-center text-slate-400">
                                    <Globe className="w-16 h-16 mb-4 opacity-20" />
                                    <span>Real-time Geographic Visualizer (Connecting...)</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-emerald-900 text-sm">Policy Enforced</h4>
                                            <p className="text-emerald-700 text-xs mt-1">
                                                Strict biometric Liveness Detection (ISO/IEC 30107-3) is active for all user logins.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start space-x-3">
                                        <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-blue-900 text-sm">Admin Database Segregation</h4>
                                            <p className="text-blue-700 text-xs mt-1">
                                                Admin data resides in dedicated `admin_store` schema. Encryption At-Rest active.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: USERS --- */}
                    {activeTab === 'USERS' && (
                        <div className="max-w-2xl mx-auto animate-fade-in">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                                    <p className="text-slate-500 text-sm">Provision access for new personnel.</p>
                                </div>
                                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold">
                                    Admin Action
                                </div>
                            </div>

                            <form onSubmit={handleCreateUser} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                                <h3 className="font-bold text-slate-800 flex items-center">
                                    <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
                                    Register New Identity
                                </h3>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Full Name</label>
                                        <input
                                            type="text"
                                            value={newUser.fullName}
                                            onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                                            placeholder="Ex: Agent Smith"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Username / ID</label>
                                        <input
                                            type="text"
                                            value={newUser.username}
                                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                                            placeholder="Ex: asmith"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Temporary Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="password"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 flex items-center">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        User must complete biometric enrollment upon first login.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={userCreationStatus === 'CREATING'}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center transition-all
                                            ${userCreationStatus === 'SUCCESS' ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'}
                                        `}
                                    >
                                        {userCreationStatus === 'CREATING' && <RefreshCw className="w-5 h-5 animate-spin mr-2" />}
                                        {userCreationStatus === 'SUCCESS' && <ShieldCheck className="w-5 h-5 mr-2" />}
                                        {userCreationStatus === 'IDLE' ? 'Create User Profile' : userCreationStatus === 'SUCCESS' ? 'User Created Successfully' : 'Creating...'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* --- TAB: SYSTEM --- */}
                    {activeTab === 'SYSTEM' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-900">System Health & Integrity</h2>

                            <div className="bg-slate-900 text-green-400 p-6 rounded-2xl font-mono text-sm shadow-xl">
                                <div className="flex items-center mb-4 border-b border-slate-800 pb-2">
                                    <Terminal className="w-4 h-4 mr-2" />
                                    <span>root@bioshield-core:~$ status --verbose</span>
                                </div>
                                <div className="space-y-1">
                                    <p>[OK] Database Connection (Latency: 2ms)</p>
                                    <p>[OK] AWS KMS Encryption Provider (Region: us-east-1)</p>
                                    <p>[OK] Admin Schema Validation (admin_store: ACTIVE)</p>
                                    <p>[OK] Biometric Matching Engine (FHE-Accelerated)</p>
                                    <p className="text-yellow-400">[WARN] 3 Failed Login Attempts detected from IP 192.168.1.4</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
