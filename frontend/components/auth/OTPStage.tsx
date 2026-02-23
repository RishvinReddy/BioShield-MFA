
import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface OTPStageProps {
    stageToken: string;
    userId: string;
    onSuccess: (nextToken: string) => void;
}

export const OTPStage: React.FC<OTPStageProps> = ({ stageToken, userId, onSuccess }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-focus first input
    useEffect(() => {
        document.getElementById('otp-0')?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-advance
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }

        // Auto-submit if full
        if (index === 5 && value) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleVerify = async (code: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.loginStep2({ userId, otp: code, stageToken });
            if (res.success && res.stageToken) {
                onSuccess(res.stageToken);
            } else {
                setError('Invalid OTP Code');
            }
        } catch (err: any) {
            setError('Verification failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 text-center shadow-2xl animate-fade-in border border-slate-800">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-blue-900/40">
                <KeyRound className="w-8 h-8 text-blue-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Access Verification</h2>
            <p className="text-slate-400 text-sm mb-8">
                Enter the 6-digit secure code sent to your registered device.
            </p>

            {error && (
                <div className="mb-6 p-3 bg-red-900/30 text-red-200 text-sm rounded-lg border border-red-800 flex items-center justify-center">
                    {error}
                </div>
            )}

            <div className="flex justify-center space-x-3 mb-8">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 bg-slate-800 border-2 border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all caret-blue-500"
                    />
                ))}
            </div>

            <button
                onClick={() => handleVerify(otp.join(''))}
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <span>verify_identity_sequence</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>

            <button className="mt-6 text-slate-500 text-xs hover:text-white transition-colors">
                Resend Secure Code via Email in 30s
            </button>
        </div>
    );
};
