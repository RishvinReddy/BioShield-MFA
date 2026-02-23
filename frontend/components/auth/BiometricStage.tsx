
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Shield, Eye, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { detectFace, detectHeadTurn } from '../../utils/faceApi';
import { api } from '../../services/api';

interface BiometricStageProps {
    stageToken: string;
    userId: string;
    onSuccess: (token: string, fusionData: any) => void;
}

export const BiometricStage: React.FC<BiometricStageProps> = ({ stageToken, userId, onSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [livenessAction, setLivenessAction] = useState<'CENTER' | 'LEFT' | 'RIGHT'>('CENTER');
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing Biometric Sensor...');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Liveness Sequence
    const [completedActions, setCompletedActions] = useState<string[]>([]);
    const requiredActions = ['CENTER', 'LEFT', 'RIGHT'];

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    useEffect(() => {
        if (!stream) return;
        const interval = setInterval(processFrame, 200);
        return () => clearInterval(interval);
    }, [stream, livenessAction, completedActions]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
            setStatus('Position face in frame');
        } catch (err) {
            setError('Camera access denied. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const processFrame = async () => {
        if (isProcessing || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            const detection = await detectFace(video);

            if (detection) {
                const face = detection;
                const landmarks = face.landmarks; // correct property access

                const turnData = detectHeadTurn(landmarks);

                // Validate Current Challenge
                if (validateAction(turnData, livenessAction)) {
                    // Action Completed
                    const newCompleted = [...completedActions, livenessAction];
                    setCompletedActions(newCompleted);

                    // Progress
                    setProgress((newCompleted.length / requiredActions.length) * 100);

                    // Next Action or Finish
                    if (newCompleted.length < requiredActions.length) {
                        const nextAction = requiredActions[newCompleted.length] as any;
                        setLivenessAction(nextAction);
                        setStatus(`Liveness Check: Turn Head ${nextAction}`);
                    } else {
                        // All Complete - Submit to Backend
                        await handleSubmit(face.descriptor);
                    }
                }
            } else {
                setStatus('No face detected');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const validateAction = (turnData: { status: string, ratio: number }, target: string) => {
        if (target === 'CENTER' && turnData.status === 'CENTER') return true;

        if (target === 'LEFT' && (turnData.status === 'LEFT' || turnData.ratio < 0.85)) return true;
        if (target === 'RIGHT' && (turnData.status === 'RIGHT' || turnData.ratio > 1.15)) return true;

        return false;
    };

    const handleSubmit = async (descriptor: Float32Array) => {
        setIsProcessing(true);
        setStatus('Verifying Identity...');
        stopCamera();

        try {
            const embedding = Array.from(descriptor);
            // Use api object correctly
            const res = await api.loginStep3({ userId, biometricEmbedding: embedding, stageToken });

            if (res.success) {
                onSuccess(res.accessToken, res);
            } else {
                setError('Biometric Verification Failed. Access Denied.');
                setIsProcessing(false);
            }
        } catch (err: any) {
            setError('Verification Error: ' + (err.response?.data?.message || err.message));
            setIsProcessing(false);
        }
    };

    const getInstructionIcon = () => {
        switch (livenessAction) {
            case 'LEFT': return <ArrowLeft className="w-8 h-8 text-blue-600 animate-pulse" />;
            case 'RIGHT': return <ArrowRight className="w-8 h-8 text-blue-600 animate-pulse" />;
            case 'CENTER': return <Eye className="w-8 h-8 text-blue-600" />;
            default: return <Shield className="w-8 h-8 text-blue-600" />;
        }
    };

    return (
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl animate-fade-in relative overflow-hidden">

            <div className="text-center mb-6">
                <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">Security Check // Facial Geometry</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">Biometric Verification</h2>
                <p className="text-slate-500 text-sm">Position your face within the frame.</p>
            </div>

            {error ? (
                <div className="bg-red-50 p-6 rounded-xl text-center border border-red-100">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-red-800 font-bold mb-2">Verification Failed</h3>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200">
                        Retry Verification
                    </button>
                </div>
            ) : (
                <div className="relative mx-auto w-[320px] h-[320px] rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-100">
                    {/* Video Feed */}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={640} height={480} />

                    {/* HUD Overlay */}
                    {!isProcessing && (
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center space-x-3 z-10 border border-slate-200">
                            {getInstructionIcon()}
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Liveness Check</p>
                                <p className="text-sm font-bold text-slate-800">Turn Head {livenessAction}</p>
                            </div>
                        </div>
                    )}

                    {/* Scanning Animation */}
                    <div className="absolute inset-0 border-[3px] border-blue-500/30 rounded-full animate-pulse"></div>
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <span className="text-blue-800 font-bold">Verifying...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Progress Bar */}
            {!error && (
                <div className="mt-8">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                        <span>VERIFICATION PROGRESS</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
