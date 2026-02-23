import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserPlus, Camera, Key, CheckCircle } from 'lucide-react';
import { FaceEnrollment } from '../components/enrollment/FaceEnrollment';
import { VoiceEnrollment } from '../components/enrollment/VoiceEnrollment';

// Inline Components for Form and OTP
const RegisterForm = ({ onComplete, formData, setFormData, isLoading, error }: any) => (
    <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800">Create Account</h2>
        {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">{error}</div>}
        <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 border rounded-xl"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 border rounded-xl"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-xl"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button
            onClick={onComplete}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
            {isLoading ? 'Creating Account...' : 'Continue to Verification'}
        </button>
    </div>
);

const RegisterOTP = ({ onVerify, isLoading, error }: { onVerify: (code: string) => void, isLoading: boolean, error: string }) => {
    const [otp, setOtp] = React.useState("");
    return (
        <div className="space-y-4 animate-fade-in text-center">
            <h2 className="text-xl font-bold text-slate-800">Email Verification</h2>
            <p className="text-slate-500">Enter the code sent to your email (Check server logs for DEV code)</p>
            {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">{error}</div>}
            <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border rounded-xl text-center text-2xl tracking-widest"
            />
            <button
                onClick={() => onVerify(otp)}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
        </div>
    );
};

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [stage, setStage] = useState<"FORM" | "OTP" | "FACE" | "VOICE" | "COMPLETE">("FORM");

    const [stageToken, setStageToken] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Temporary form data state for the inputs
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleRegister = async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await import('../services/api').then(m => m.api.register(formData));
            if (res.success) {
                setUserId(res.userId);
                setStageToken(res.stageToken);
                setStage("OTP");
            } else {
                setError(res.error?.message || "Registration failed");
            }
        } catch (e) {
            setError("Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerify = async (otp: string) => {
        setIsLoading(true);
        setError("");
        try {
            const res = await import('../services/api').then(m => m.api.loginStep2({
                userId,
                otp,
                stageToken
            }));

            if (res.success) {
                setStageToken(res.stageToken);
                setStage("FACE");
            } else {
                setError(res.error?.message || "Invalid OTP");
            }
        } catch (e) {
            setError("OTP Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFaceComplete = () => setStage("VOICE");
    const handleVoiceComplete = () => setStage("COMPLETE");

    const handleFinalize = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F3F5F9] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-slate-900 p-6 flex flex-col items-center">
                    <div className="bg-blue-600 p-3 rounded-xl mb-3 shadow-lg shadow-blue-500/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">BioShield ID</h1>
                    <p className="text-slate-400 text-sm">Secure Enrollment Protocol</p>

                    {/* Progress Steps */}
                    <div className="flex items-center space-x-2 mt-6">
                        <div className={`h-1.5 w-6 rounded-full transition-all ${['FORM', 'OTP', 'FACE', 'VOICE', 'COMPLETE'].includes(stage) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                        <div className={`h-1.5 w-6 rounded-full transition-all ${['OTP', 'FACE', 'VOICE', 'COMPLETE'].includes(stage) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                        <div className={`h-1.5 w-6 rounded-full transition-all ${['FACE', 'VOICE', 'COMPLETE'].includes(stage) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                        <div className={`h-1.5 w-6 rounded-full transition-all ${['VOICE', 'COMPLETE'].includes(stage) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                        <div className={`h-1.5 w-6 rounded-full transition-all ${['COMPLETE'].includes(stage) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {stage === 'FORM' && (
                        <RegisterForm
                            onComplete={handleRegister}
                            formData={formData}
                            setFormData={setFormData}
                            isLoading={isLoading}
                            error={error}
                        />
                    )}
                    {stage === 'OTP' && (
                        <RegisterOTP
                            onVerify={handleOtpVerify}
                            isLoading={isLoading}
                            error={error}
                        />
                    )}
                    {stage === 'FACE' && <FaceEnrollment userId={userId} onComplete={handleFaceComplete} />}
                    {stage === 'VOICE' && <VoiceEnrollment userId={userId} onComplete={handleVoiceComplete} />}

                    {stage === 'COMPLETE' && (
                        <div className="text-center animate-fade-in space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Registration Complete</h2>
                                <p className="text-slate-500 mt-2">Your biometric profile (Face + Voice) has been secured.</p>
                            </div>
                            <button
                                onClick={handleFinalize}
                                className="w-full bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition shadow-lg"
                            >
                                Proceed to Login
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <button onClick={() => navigate('/login')} className="text-sm text-slate-500 hover:text-blue-600 font-medium transition">
                        Already have an account? Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
