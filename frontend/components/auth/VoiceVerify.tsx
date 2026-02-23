import React, { useState, useRef, useEffect } from 'react';
import Meyda from 'meyda';
import { api } from '../../services/api'; // Use centralized API
import { Mic, Lock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface VoiceVerifyProps {
    userId: string;
    onVerify: (score: number, embedding?: number[]) => void;
}

export const VoiceVerify: React.FC<VoiceVerifyProps> = ({ userId, onVerify }) => {
    const [recording, setRecording] = useState(false);
    const [status, setStatus] = useState("Initializing...");
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const cleanupAudio = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    useEffect(() => {
        setStatus(`Please say: "MY VOICE IS MY PASSWORD"`);
        return cleanupAudio;
    }, []);

    const normalizeVector = (vec: number[]) => {
        const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        return vec.map((v) => v / (norm || 1));
    };

    const averageMFCC = (frames: number[][]) => {
        if (frames.length === 0) return [];
        const length = frames[0].length;
        const sum = new Array(length).fill(0);

        frames.forEach(frame => {
            frame.forEach((value, i) => sum[i] += value);
        });

        return sum.map(v => v / frames.length);
    };

    const processAndVerify = async (frames: number[][]) => {
        if (frames.length === 0) {
            setError("No audio detected. Try again.");
            setStatus("Failed. Retry?");
            return;
        }

        setVerifying(true);
        setStatus("Verifying Identity...");

        try {
            const averaged = averageMFCC(frames);
            const normalized = normalizeVector(averaged);

            const res = await api.verifyVoice(userId, normalized);

            if (res.verified) {
                setStatus("Voice Verified!");
                setTimeout(() => onVerify(res.score, normalized), 1000);
            } else {
                setError(`Voice mismatch (Score: ${(res.score * 100).toFixed(1)}%)`);
                setStatus("Access Denied");
                // Pass embedding even on failure so Fusion can decide
                setTimeout(() => onVerify(res.score, normalized), 1500);
            }

        } catch (err) {
            console.error(err);
            setError("Verification failed (Network/Server).");
            onVerify(0);
        } finally {
            setVerifying(false);
        }
    };

    const startRecording = async () => {
        setRecording(true);
        setError(null);
        setStatus("Listening...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;

            const mfccFrames: number[][] = [];
            Meyda.bufferSize = bufferSize;
            Meyda.numberOfMFCCCoefficients = 20;

            processor.onaudioprocess = (event) => {
                const input = event.inputBuffer.getChannelData(0);
                const rms = Math.sqrt(input.reduce((sum, val) => sum + val * val, 0) / input.length);
                if (rms < 0.01) return;

                const mfcc = Meyda.extract("mfcc", input) as unknown as number[];
                if (mfcc) mfccFrames.push(Array.from(mfcc));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            // Auto-stop after 3s
            setTimeout(() => {
                cleanupAudio();
                setRecording(false);
                processAndVerify(mfccFrames);
            }, 3000);

        } catch (err) {
            console.error(err);
            setError("Microphone access denied.");
            setRecording(false);
        }
    };

    return (
        <div className="text-center animate-fade-in">
            <div className="mb-6 relative w-32 h-32 mx-auto flex items-center justify-center bg-slate-800 rounded-full border-4 border-slate-700">
                {verifying ? (
                    <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                ) : (
                    <Mic className={`w-16 h-16 ${recording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                )}
            </div>

            <h3 className="text-xl font-bold text-slate-200 mb-2">Voice Verification</h3>
            <p className="text-slate-400 mb-6 font-mono text-sm">
                Say: "MY VOICE IS MY PASSWORD"
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded border border-red-800/50 flex items-center justify-center text-sm">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            <button
                onClick={startRecording}
                disabled={recording || verifying}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                    ${recording
                        ? 'bg-red-600 text-white shadow-red-900/50'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
                    }
                    ${verifying ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {recording ? "Listening..." : verifying ? "Processing..." : "Tap to Speak"}
            </button>

            <p className="mt-4 text-xs text-slate-500">{status}</p>
        </div>
    );
};
