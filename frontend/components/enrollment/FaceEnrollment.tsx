import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { loadModels, detectFace, isBlinking, detectHeadTurn, calculateEAR } from '../../utils/faceApi';
import { API_BASE } from '../../services/api';

interface FaceEnrollmentProps {
    onComplete: () => void;
    userId?: string;
}

const REQUIRED_SAMPLES = 4; // Center, Blink, Left, Right
const CHALLENGES = ['CENTER', 'BLINK', 'LEFT', 'RIGHT'];

export const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({ onComplete, userId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [samples, setSamples] = useState<number[][]>([]);
    const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
    const [message, setMessage] = useState("Initializing Face Engine...");
    const [error, setError] = useState<string | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showManualCapture, setShowManualCapture] = useState(false);
    const challengeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const init = async () => {
            console.log("Starting FaceAPI Model Load...");
            try {
                const loaded = await loadModels();
                console.log("Model Load Result:", loaded);
                if (loaded) {
                    setModelsLoaded(true);
                    startCamera();
                } else {
                    setError("Failed to load biometric models. Check console for details.");
                }
            } catch (error) {
                console.error("Critical Error during init:", error);
                setError(`Init Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        };
        init();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Camera access denied.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // Continuous Detection Loop
    useEffect(() => {
        if (!modelsLoaded || !stream || !videoRef.current) return;

        const interval = setInterval(async () => {
            if (processing || samples.length >= REQUIRED_SAMPLES) return;

            const detection = await detectFace(videoRef.current!);

            if (detection) {
                const landmarks = detection.landmarks as unknown as faceapi.FaceLandmarks68; // Type assertion fix
                const descriptor = Array.from(detection.descriptor);

                // Draw Liveness HUD
                if (canvasRef.current && videoRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }

                    const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
                    faceapi.draw.drawDetections(canvasRef.current, faceapi.resizeResults(detection, dims));
                    faceapi.draw.drawFaceLandmarks(canvasRef.current, faceapi.resizeResults(detection, dims));
                }

                validateChallenge(landmarks, descriptor);
            } else {
                console.log("No face detected in enrollment loop");
                setMessage("No face detected. Align properly.");
            }
        }, 500); // Check every 500ms

        return () => clearInterval(interval);
    }, [modelsLoaded, stream, currentChallengeIndex, processing]);

    const validateChallenge = (landmarks: faceapi.FaceLandmarks68, descriptor: number[]) => {
        const challenge = CHALLENGES[currentChallengeIndex];
        let success = false;

        switch (challenge) {
            case 'CENTER':
                const resC = detectHeadTurn(landmarks);
                // setMessage(`Look straight. Ratio: ${resC.ratio.toFixed(2)}`);
                if (resC.status === 'CENTER') success = true;
                break;
            case 'BLINK':
                setMessage("Blink your eyes now.");
                const blinking = isBlinking(landmarks);
                if (blinking) success = true;
                break;
            case 'LEFT':
                const resL = detectHeadTurn(landmarks);
                setMessage(`Turn LEFT. Ratio: ${resL.ratio.toFixed(2)} (Need < 0.85)`);
                if (resL.status === 'LEFT') success = true;
                break;
            case 'RIGHT':
                const resR = detectHeadTurn(landmarks);
                setMessage(`Turn RIGHT. Ratio: ${resR.ratio.toFixed(2)} (Need > 1.15)`);
                if (resR.status === 'RIGHT') success = true;
                break;
        }

        if (success) {
            setProcessing(true);
            setTimeout(() => { // Small delay to visualize success
                const newSamples = [...samples, descriptor];
                setSamples(newSamples);
                setCurrentChallengeIndex(prev => prev + 1);
                setShowManualCapture(false);
                setProcessing(false);

                if (newSamples.length >= REQUIRED_SAMPLES) {
                    finalizeEnrollment(newSamples);
                }
            }, 500);
        }
    };

    // Reset timeout when challenge changes
    useEffect(() => {
        setShowManualCapture(false);
        if (challengeTimeoutRef.current) clearTimeout(challengeTimeoutRef.current);

        challengeTimeoutRef.current = setTimeout(() => {
            setShowManualCapture(true);
        }, 8000); // Show manual button after 8 seconds of struggle

        return () => {
            if (challengeTimeoutRef.current) clearTimeout(challengeTimeoutRef.current);
        }
    }, [currentChallengeIndex]);

    const manualCapture = async () => {
        if (!videoRef.current) return;
        setProcessing(true);
        const detection = await detectFace(videoRef.current);
        if (detection) {
            const descriptor = Array.from(detection.descriptor);
            const newSamples = [...samples, descriptor];
            setSamples(newSamples);

            // Advance challenge
            setCurrentChallengeIndex(prev => prev + 1);
            setShowManualCapture(false);
            setProcessing(false);

            if (newSamples.length >= REQUIRED_SAMPLES) {
                finalizeEnrollment(newSamples);
            }
        } else {
            setProcessing(false);
            setMessage("Face not detected for manual capture");
        }
    };

    const finalizeEnrollment = async (finalSamples: number[][]) => {
        setMessage("Encrypting & Storing Biometric Data...");
        try {
            const res = await fetch(`${API_BASE}/biometric/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId || 'temp-user-id', // In real flow, userId comes from previous step
                    embeddings: finalSamples
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setTimeout(() => onComplete(), 1500);
            } else {
                setError(data.message || "Enrollment failed.");
            }
        } catch (err) {
            setError("Network error during enrollment.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-center max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-slate-800">Biometric Liveness Check</h2>

            <div className="relative w-96 h-72 mx-auto bg-black rounded-2xl overflow-hidden border-4 border-slate-200 shadow-xl">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400">
                        <AlertTriangle className="w-12 h-12 mb-2" />
                        <span className="text-sm">{error}</span>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full transform scale-x-[-1]"
                        />
                    </>
                )}

                {/* Challenge Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-3 text-white text-sm font-mono tracking-wide">
                    {processing ? "CAPTURING..." : message}
                </div>
            </div>

            <div className="flex justify-center space-x-4">
                {CHALLENGES.map((target, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < samples.length ? 'bg-green-500 text-white' :
                            i === currentChallengeIndex ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                            }`}>
                            {i < samples.length ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className="text-[10px] uppercase mt-1 text-slate-500 font-bold">{target}</span>
                    </div>
                ))}
            </div>

            {samples.length >= REQUIRED_SAMPLES && (
                <div className="text-green-600 font-bold bg-green-50 p-3 rounded-xl animate-bounce">
                    All Samples Secured.
                </div>
            )}

            {showManualCapture && samples.length < REQUIRED_SAMPLES && (
                <button
                    onClick={manualCapture}
                    className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                >
                    Manual Capture (Skip Gesture)
                </button>
            )}
        </div>
    );
};
