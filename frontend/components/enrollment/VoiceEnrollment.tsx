import React, { useState, useRef, useEffect } from 'react';
import Meyda from 'meyda';
import { api } from '../../services/api';
import { Mic, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface VoiceEnrollmentProps {
    userId: string;
    onComplete?: () => void;
}

export const VoiceEnrollment: React.FC<VoiceEnrollmentProps> = ({ userId, onComplete }) => {
    const [recording, setRecording] = useState(false);
    const [samples, setSamples] = useState<number[][]>([]);
    const [status, setStatus] = useState<string>('Ready to record');
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Cleanup
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
        return cleanupAudio;
    }, []);

    const normalizeVector = (vec: number[]) => {
        const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        return vec.map((v) => v / (norm || 1)); // Handle zero div
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

    const recordSample = async () => {
        setError(null);
        cleanupAudio(); // Ensure clean state

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // bufferSize: 256, 512, 1024, 2048, 4096, 8192, 16384
            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;

            const mfccFrames: number[][] = [];

            // Meyda Setup for raw extraction (if utilizing Meyda.extract directly on buffer)
            // Or we can attach Meyda to the source/node.
            // User snippet uses `Meyda.extract("mfcc", input, ...)` inside `onaudioprocess`.

            // Setup Meyda Config
            Meyda.bufferSize = bufferSize;
            Meyda.numberOfMFCCCoefficients = 20;

            processor.onaudioprocess = (event) => {
                const input = event.inputBuffer.getChannelData(0);

                // RMS for silence check
                const rms = Math.sqrt(input.reduce((sum, val) => sum + val * val, 0) / input.length);
                if (rms < 0.01) return; // Silence

                const mfcc = Meyda.extract("mfcc", input) as unknown as number[];

                if (mfcc) mfccFrames.push(Array.from(mfcc));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setRecording(true);
            setStatus('Recording... Say "My voice is my password"');

            // Stop after 3 seconds
            setTimeout(() => {
                cleanupAudio();
                setRecording(false);

                if (mfccFrames.length === 0) {
                    setError("No audio detected or too quiet.");
                    setStatus('Ready to record');
                    return;
                }

                const averaged = averageMFCC(mfccFrames);
                const normalized = normalizeVector(averaged);

                setSamples(prev => [...prev, normalized]);
                setStatus(`Sample ${samples.length + 1} recorded.`);
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setError("Microphone access denied or error.");
            setRecording(false);
        }
    };

    const submitEnrollment = async () => {
        setUploading(true);
        setError(null);
        try {
            const res = await api.enrollVoice(userId, samples);
            if (res.success) {
                setStatus("Enrollment Complete!");
                if (onComplete) onComplete();
            } else {
                setError(res.error?.message || "Enrollment failed");
            }
        } catch (err) {
            setError("Network error during enrollment");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-lg border border-slate-700 max-w-md mx-auto">
            <h3 className="text-xl text-white font-bold mb-4 flex items-center">
                <Mic className="mr-2 text-blue-400" /> Voice Enrollment
            </h3>

            <p className="text-slate-400 mb-6 font-mono text-sm">
                Phrase: "MY VOICE IS MY PASSWORD"
            </p>

            <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-800 p-3 rounded">
                    <span className="text-slate-300">Samples Collected</span>
                    <div className="flex space-x-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full ${samples.length >= i ? 'bg-green-500' : 'bg-slate-600'}`} />
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-800 text-red-200 text-sm rounded flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> {error}
                    </div>
                )}

                <div className="h-12 flex items-center justify-center">
                    {recording ? (
                        <span className="text-red-400 animate-pulse font-bold">Recording...</span>
                    ) : (
                        <span className="text-slate-500">{status}</span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={recordSample}
                        disabled={recording || samples.length >= 3 || uploading}
                        className={`flex-1 py-2 rounded font-bold text-white transition-all
                            ${recording ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-500'}
                            ${(samples.length >= 3 || uploading) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {recording ? 'Listening...' : 'Record Sample'}
                    </button>

                    {samples.length >= 3 && (
                        <button
                            onClick={submitEnrollment}
                            disabled={uploading}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : 'Submit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
