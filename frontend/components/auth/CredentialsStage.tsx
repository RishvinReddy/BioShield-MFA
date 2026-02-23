
import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface CredentialsStageProps {
    onSuccess: (token: string, userId: string) => void;
}

export const CredentialsStage: React.FC<CredentialsStageProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.loginStep1({ email, password });
            if (res.success && res.stageToken) {
                onSuccess(res.stageToken, res.userId);
            } else {
                setError('Authentication failed. Please check your credentials.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Connection refused.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] animate-fade-in">
            {/* Left Panel - Trust Monitor */}
            <div className="md:w-5/12 bg-slate-50 p-8 flex flex-col justify-center border-r border-slate-100">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 tracking-wider">SESSION TRUST</span>
                        <Shield className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-end space-x-2 mb-2">
                        <span className="text-4xl font-bold text-slate-800">89</span>
                        <span className="text-sm text-slate-400 mb-1">/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="w-[89%] h-full bg-blue-600 rounded-full" />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                        <span className="text-slate-500">Typing Cadence</span>
                        <span className="text-green-600 font-medium">Consistent</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Environment Secure</h4>
                        <p className="text-xs text-slate-500">No bot anomalies detected</p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <h5 className="text-sm font-bold text-slate-800 mb-2">Real-time Protection</h5>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        BioShield continuously analyzes behavioral biometrics to ensure it's really you.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to BioShield</h1>
                    <p className="text-slate-500">Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register Now</a></p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-6 border-b border-slate-100 mb-8">
                    <button className="pb-2 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">Credentials</button>
                    <button className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600 font-medium text-sm transition">Passkey / QR</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email or User ID</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-800"
                                placeholder="Enter your email"
                                required
                            />
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-800"
                                placeholder="Enter your password"
                                required
                            />
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-slate-500">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Sign In'}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-300 text-xs">OR</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <button type="button" className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition flex items-center justify-center space-x-2">
                        <Shield className="w-5 h-5 text-slate-800" />
                        <span>Sign in with Passkey</span>
                    </button>
                </form>
            </div>
        </div>
    );
};
