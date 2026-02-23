import React, { useRef, useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, User, Shield, Fingerprint, Mic } from 'lucide-react';
import { loadModels, extractEmbedding } from '../utils/faceApi';
import { api } from '../services/api';
import { VoiceEnrollment } from './enrollment/VoiceEnrollment';

interface BiometricEnrollProps {
    userId: string;
    onComplete: () => void;
}

const BiometricEnroll: React.FC<BiometricEnrollProps> = ({ userId, onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [message, setMessage] = useState("Loading Biometric Models...");
    const [status, setStatus] = useState<'LOADING' | 'READY' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [activeTab, setActiveTab] = useState<'FACE' | 'VOICE'>('FACE');

    useEffect(() => {
        const init = async () => {
            if (activeTab === 'FACE') {
                const loaded = await loadModels();
                if (loaded) {
                    setModelLoaded(true);
                    startVideo();
                } else {
                    setStatus('ERROR');
                    setMessage("Failed to load biometric models. Check /public/models.");
                }
            } else {
                stopVideo();
            }
        };
        init();
        return () => stopVideo();
    }, [activeTab]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStatus('READY');
                setMessage("Position your face in the frame");
            }
        } catch (err) {
            setStatus('ERROR');
            setMessage("Camera access denied");
        }
    };

    const stopVideo = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    const handleCapture = async () => {
        if (!videoRef.current || status !== 'READY') return;

        setStatus('PROCESSING');
        setMessage("Analyzing facial features...");
        setCapturing(true);

        try {
            const embedding = await extractEmbedding(videoRef.current);

            if (!embedding) {
                throw new Error("No face detected. Try again.");
            }

            setMessage("Encrypting & Enrolling...");
            const res = await api.enrollBiometrics(userId, [embedding]);

            if (res.success) {
                setStatus('SUCCESS');
                setMessage("Biometric Enrollment Complete");
                setTimeout(onComplete, 1500);
            } else {
                throw new Error(res.error?.message || "Enrollment failed");
            }

        } catch (e: any) {
            setStatus('ERROR');
            setMessage(e.message);
            setTimeout(() => {
                setStatus('READY');
                setMessage("Position your face in the frame");
            }, 3000);
        } finally {
            setCapturing(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-6 bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md mx-auto">
            <div className="flex items-center space-x-2 mb-4 text-cyan-400">
                <Shield className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wider">Biometric Enforcement</h3>
            </div>

            <div className="flex space-x-4 mb-6 w-full">
                <button
                    onClick={() => setActiveTab('FACE')}
                    className={`flex-1 py-2 px-4 rounded text-center transition-colors flex items-center justify-center ${activeTab === 'FACE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <Fingerprint className="inline-block mr-2 w-4 h-4" /> Face
                </button>
                <button
                    onClick={() => setActiveTab('VOICE')}
                    className={`flex-1 py-2 px-4 rounded text-center transition-colors flex items-center justify-center ${activeTab === 'VOICE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <Mic className="inline-block mr-2 w-4 h-4" /> Voice
                </button>
            </div>

            {activeTab === 'FACE' && (
                <>
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-slate-600 shadow-2xl bg-black mb-6">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                        />

                        {/* Overlay UI */}
                        {status === 'PROCESSING' && (
                            <div className="absolute inset-0 bg-cyan-900/30 flex items-center justify-center">
                                <div className="w-full h-1 bg-cyan-400 absolute top-1/2 animate-scan"></div>
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center backdrop-blur-sm">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-4 w-full">
                        <div className={`text-sm font-mono py-2 rounded ${status === 'ERROR' ? 'text-red-400 bg-red-900/20' :
                            status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-900/20' :
                                'text-cyan-300 bg-cyan-900/20'
                            }`}>
                            {status === 'ERROR' && <AlertTriangle className="inline w-4 h-4 mr-2" />}
                            {message}
                        </div>

                        {status === 'READY' && (
                            <button
                                onClick={handleCapture}
                                disabled={capturing}
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/50 flex items-center justify-center"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                CAPTURE FACE
                            </button>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'VOICE' && (
                <VoiceEnrollment userId={userId} onComplete={onComplete} />
            )}
        </div>
    );
};

export default BiometricEnroll;
