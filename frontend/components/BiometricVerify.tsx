import React, { useRef, useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, User, ScanFace } from 'lucide-react';
import { loadModels, extractEmbedding } from '../utils/faceApi';

interface BiometricVerifyProps {
    onVerify: (embedding: Float32Array | number[]) => void;
    onCancel: () => void;
}

const BiometricVerify: React.FC<BiometricVerifyProps> = ({ onVerify, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'LOADING' | 'READY' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState("Initializing Secure Face ID...");

    useEffect(() => {
        const init = async () => {
            const loaded = await loadModels();
            if (loaded) {
                startVideo();
            } else {
                setStatus('ERROR');
                setMessage("Biometric models failed to load.");
            }
        };
        init();
        return () => stopVideo();
    }, []);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStatus('READY');
                setMessage("Align face within the frame");
            }
        } catch (err) {
            setStatus('ERROR');
            setMessage("Camera access required for Step-Up Authentication");
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
        setMessage("Verifying Liveness & Features...");

        try {
            const embedding = await extractEmbedding(videoRef.current);

            if (!embedding) {
                throw new Error("No face detected. Ensure good lighting.");
            }

            setStatus('SUCCESS');
            setMessage("Face ID Captured");

            // Short delay for visual feedback
            setTimeout(() => {
                onVerify(embedding);
            }, 800);

        } catch (e: any) {
            setStatus('ERROR');
            setMessage(e.message || "Verification failed");
            setTimeout(() => {
                setStatus('READY');
                setMessage("Align face within the frame");
            }, 2500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-black/40 p-8 rounded-3xl border border-cyan-500/30 shadow-2xl max-w-sm w-full relative overflow-hidden">
                {/* Scanning overlay effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 animate-scan-fast z-10 pointer-events-none"></div>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-cyan-500/30">
                        <ScanFace className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-wide">Security Check</h3>
                    <p className="text-cyan-200/60 text-sm mt-1">Additional verification required</p>
                </div>

                <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-slate-700/50 shadow-inner bg-black mb-6 group">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />

                    {/* Status Overlays */}
                    {status === 'PROCESSING' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-cyan-900/40">
                            <div className="w-48 h-48 border-2 border-cyan-400 rounded-full animate-ping opacity-20 absolute"></div>
                            <div className="w-32 h-32 border-2 border-cyan-400 rounded-full animate-pulse opacity-40 absolute"></div>
                        </div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-20 h-20 text-emerald-400 drop-shadow-lg scale-110" />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className={`text-center py-2 px-4 rounded-lg text-sm font-mono border ${status === 'ERROR' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                            status === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                                'bg-cyan-950/30 border-cyan-500/20 text-cyan-300'
                        }`}>
                        {message}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        {status === 'READY' && (
                            <button
                                onClick={handleCapture}
                                className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
                            >
                                Verify
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BiometricVerify;
