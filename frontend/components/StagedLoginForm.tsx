import React, { useState } from 'react';
import { api } from '../services/api';
import { Key, Lock, Fingerprint, Activity, ShieldCheck, AlertTriangle, Mic } from 'lucide-react';
import BiometricVerify from './BiometricVerify';
import { VoiceVerify } from './auth/VoiceVerify';

interface StagedLoginFormProps {
    onLoginSuccess: (user: any, token: string) => void;
}

export const StagedLoginForm: React.FC<StagedLoginFormProps> = ({ onLoginSuccess }) => {
    const [stage, setStage] = useState<'PASSWORD' | 'OTP' | 'BIOMETRIC' | 'VOICE' | 'SUCCESS'>('PASSWORD');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [stageToken, setStageToken] = useState<string | null>(null);
    const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null); // Store temporarily
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // --- STEP 1: PASSWORD ---
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await api.loginStep1({ email, password });

            if (data.success) {
                setUserId(data.userId);
                setStageToken(data.stageToken);
                if (data.requiresOTP) {
                    setStage('OTP');
                } else if (data.requiresBiometric) {
                    setStage('BIOMETRIC'); // Should typically be OTP first
                } else {
                    // Direct login (rare/admin?)
                    handleSuccess(data);
                }
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2: OTP ---
    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!userId || !stageToken) throw new Error("Session state invalid");

            const data = await api.loginStep2({ userId, otp, stageToken });

            if (data.success) {
                setStageToken(data.stageToken); // Update token with new state
                if (data.requiresBiometric) {
                    setStage('BIOMETRIC');
                } else {
                    handleSuccess(data);
                }
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('OTP Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 3: BIOMETRIC (Face) ---
    const handleBiometricVerify = async (embedding: Float32Array | number[]) => {
        setError(null);
        try {
            setFaceEmbedding(Array.from(embedding));
            setStage('VOICE'); // Move to Voice
        } catch (err) {
            setError('Biometric Processing Failed.');
        }
    };

    // --- STEP 4: VOICE ---
    const handleVoiceVerify = async (score: number, success: boolean, embedding?: number[]) => {
        // In a real app we'd pass the embedding. For now assume VoiceVerify verifies independently 
        // OR we pass the embedding to the backend for final fusion.
        // The prompt says "Login -> ... -> Fusion -> JWT".
        // The backend loginStep3 now expects both embeddings.
        // `VoiceVerify` component currently calls `api.verifyVoice` internally which returns a score.
        // However, `loginStep3` does the fusion.
        // We should modify `VoiceVerify` to optionally return the embedding INSTEAD of calling verify, 
        // OR we just use the score if we trust the client (we shouldn't).
        // BUT, `VoiceVerify.tsx` implementation I just wrote calls `api.verifyVoice`.
        // To be secure and follow the "Fusion" pattern, we should probably pass the raw voice embedding here.
        // I'll update `StagedLoginForm` to accept the embedding from `VoiceVerify` (I'll need to modify VoiceVerify slightly to expose it or just re-capture).
        // Actually, `VoiceVerify` as implemented verifies internally.
        // Let's adjust `StagedLoginForm` to call `loginStep3` with `faceEmbedding` and the `voiceEmbedding` came from the component.
        // I will assume `VoiceVerify` triggers `onVerify`.
        // Wait, `VoiceVerify` implementation: `onVerify(res.score, isMatch)`. It doesn't pass back embedding.
        // I should have made `VoiceVerify` pass back the embedding.
        // For now, I will update `VoiceVerify` to pass back embedding in `onVerify` or add a new prop `onEmbedding`.
        // To save time/cost, I will assume I can modify `VoiceVerify` in `StagedLoginForm`'s context or just use what I have.
        // Actually, the `loginStep3` backend does the verification.
        // So I need the embedding.
        // I'll modify `StagedLoginForm` to use a slightly different "VoiceCapture" mode or modify `VoiceVerify` in the next tool call if needed.
        // Actually, `VoiceVerify` calls `api.verifyVoice`.
        // If I want `loginStep3` to do fusion, I need to send both.
        // I will MODIFY `VoiceVerify.tsx` to return embedding.
        // For this step, I will draft the `handleVoiceVerify` assuming it receives `embedding`.
    };

    const submitFusion = async (voiceEmb: number[]) => {
        setError(null);
        setLoading(true);
        try {
            if (!userId || !stageToken || !faceEmbedding) throw new Error("Session state invalid");

            const data = await api.loginStep3({
                userId,
                biometricEmbedding: faceEmbedding,
                voiceEmbedding: voiceEmb,
                stageToken
            });

            if (data.success) {
                handleSuccess(data);
            } else {
                if (data.stepUpRequired) {
                    setError('Fusion Engine: Risk too high. Access Denied.');
                } else {
                    setError(data.error?.message || data.message || 'Authentication Failed');
                }
            }
        } catch (err) {
            setError('Fusion Verification Failed.');
        } finally {
            setLoading(false);
        }
    }

    const handleSuccess = (data: any) => {
        setStage('SUCCESS');
        localStorage.setItem('auth_token', data.token); // Store token

        setTimeout(() => {
            onLoginSuccess(data.user, data.token);
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4">
            <div className="w-full max-w-md bg-gray-900 border border-green-800 p-8 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)]">

                <div className="text-center mb-8">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-green-400" />
                    <h1 className="text-2xl font-bold tracking-wider text-green-400">BIOSHIELD MFA</h1>
                    <div className="text-xs text-green-700 mt-1">SECURE ACCESS TERMINAL</div>
                </div>

                {stage === 'PASSWORD' && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-green-600">Identity</label>
                            <div className="flex items-center bg-black border border-green-900 rounded px-3 py-2">
                                <Activity className="w-4 h-4 mr-2 text-green-700" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="OPERATOR ID (EMAIL)"
                                    className="bg-transparent border-none outline-none w-full text-green-400 placeholder-green-900 focus:ring-0"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-green-600">Credential</label>
                            <div className="flex items-center bg-black border border-green-900 rounded px-3 py-2">
                                <Key className="w-4 h-4 mr-2 text-green-700" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="ACCESS CODE"
                                    className="bg-transparent border-none outline-none w-full text-green-400 placeholder-green-900 focus:ring-0"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-900 hover:bg-green-800 text-green-100 py-3 rounded text-sm font-bold tracking-widest transition-all mt-4 border border-green-700 uppercase"
                        >
                            {loading ? 'Authenticating...' : 'Initialize Sequence'}
                        </button>
                    </form>
                )}

                {stage === 'OTP' && (
                    <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center mb-4">
                            <div className="text-xs text-green-500 mb-2">SECOND FACTOR REQUIRED</div>
                            <div className="text-xs text-gray-500">Enter the code sent to your device</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-green-600">One-Time Pad</label>
                            <div className="flex items-center bg-black border border-green-900 rounded px-3 py-2">
                                <Lock className="w-4 h-4 mr-2 text-green-700" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="******"
                                    className="bg-transparent border-none outline-none w-full text-green-400 placeholder-green-900 focus:ring-0 text-center tracking-[0.5em] font-bold"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-900 hover:bg-green-800 text-green-100 py-3 rounded text-sm font-bold tracking-widest transition-all mt-4 border border-green-700 uppercase"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                )}

                {stage === 'BIOMETRIC' && (
                    <div className="relative min-h-[300px]">
                        <BiometricVerify
                            onVerify={handleBiometricVerify}
                            onCancel={() => {
                                setError("Biometric scan cancelled. Authentication aborted.");
                                setStage('PASSWORD'); // Reset
                            }}
                        />
                    </div>
                )}

                {stage === 'VOICE' && (
                    <div className="relative min-h-[300px] flex flex-col items-center justify-center">
                        <div className="text-center mb-4 text-green-400">Voice Verification</div>
                        <VoiceVerify
                            userId={userId || ''}
                            onVerify={(score, embedding) => {
                                // We need the embedding here. I will fix VoiceVerify to return it.
                                if (embedding) {
                                    submitFusion(embedding);
                                } else {
                                    // Fallback if component not updated yet (should not happen if I do it right)
                                    setError("Voice capture failed");
                                }
                            }}
                        />
                    </div>
                )}

                {stage === 'SUCCESS' && (
                    <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center mx-auto border border-green-500">
                            <ShieldCheck className="w-10 h-10 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">ACCESS GRANTED</h2>
                        <div className="text-xs text-green-600">Redirecting to Secure Dashboard...</div>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-3 bg-red-900/20 border border-red-900/50 rounded flex items-start space-x-2 animate-in slide-in-from-bottom-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="text-xs text-red-400">{error}</div>
                    </div>
                )}

            </div>

            <div className="mt-8 text-[10px] text-green-900 uppercase tracking-widest">
                Restricted System // FOUO // Level 5 Clearance
            </div>
        </div>
    );
};
