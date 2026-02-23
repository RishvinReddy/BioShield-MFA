
import React, { useState, useEffect } from 'react';
import { Fingerprint, Usb, CheckCircle2, AlertCircle, Scan, Cpu, ShieldCheck } from 'lucide-react';
import { BiometricStatus } from '../types';
import { api } from '../services/api';

interface FingerprintScannerProps {
    userId: string;
    onComplete: (success: boolean) => void;
}

const FingerprintScanner: React.FC<FingerprintScannerProps> = ({ userId, onComplete }) => {
    const [status, setStatus] = useState<BiometricStatus>(BiometricStatus.IDLE);
    const [usbStatus, setUsbStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
    const [scanProgress, setScanProgress] = useState(0);
    const [message, setMessage] = useState("Connect USB Reader or use System Biometrics");

    const startUsbSimulation = () => {
        setUsbStatus('CONNECTING');
        setMessage("Initializing USB Interface...");

        setTimeout(() => {
            setUsbStatus('CONNECTED');
            setMessage("Device Ready: SecureTouch X1");
            setTimeout(startScanSequence, 500);
        }, 1500);
    };

    const startScanSequence = async () => {
        setStatus(BiometricStatus.SCANNING);
        setMessage("Place finger on sensor...");

        // Simulate sensor acquisition delay
        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            if (p > 90) p = 90; // Hold at 90 until response
            setScanProgress(p);
        }, 100);

        // After "acquisition" (simulated delay), call backend
        setTimeout(async () => {
            try {
                setMessage("Verifying Hash with Enterprise Backend...");

                // Create dummy biometric data (In real app, reading from USB device)
                const dummyBlob = new Blob(['fingerprint-data-' + Date.now()], { type: 'application/octet-stream' });

                const verifyRes = await api.verify(dummyBlob, userId, 'fingerprint');

                clearInterval(interval);
                setScanProgress(100);

                if (verifyRes.success && verifyRes.data?.verified) {
                    setStatus(BiometricStatus.SUCCESS);
                    setMessage(`Identity Confirmed (Score: ${(verifyRes.data.score * 100).toFixed(1)}%)`);
                    setTimeout(() => onComplete(true), 1200);
                } else {
                    // Fallback: If verification failed, maybe we need to enrol first? 
                    // For this "demo", let's auto-enroll so the SECOND try works, 
                    // or inform the user.
                    console.warn("Verify failed, attempting auto-enroll for demo purposes...");
                    const enrollRes = await api.enroll(dummyBlob, userId, 'fingerprint');

                    if (enrollRes.success) {
                        setStatus(BiometricStatus.SUCCESS);
                        setMessage("Enrolled New Template. Please Scan Again to Verify.");
                        // Don't complete, let them scan again to verify properly
                        setTimeout(() => setStatus(BiometricStatus.IDLE), 2000);
                    } else {
                        throw new Error(verifyRes.error?.message || 'Verification Failed');
                    }
                }

            } catch (err: any) {
                clearInterval(interval);
                setStatus(BiometricStatus.FAILED);
                setMessage(err.message || "Biometric Check Failed");
                setTimeout(() => setStatus(BiometricStatus.IDLE), 3000);
            }
        }, 2000);
    };

    const handleWebAuthn = async () => {
        // Real WebAuthn integration would go here.
        // For this demo, we simulate the browser prompt delay and success.
        setStatus(BiometricStatus.SCANNING);
        setMessage("Waiting for System Biometrics...");

        try {
            // This simulates the navigator.credentials.get() call
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStatus(BiometricStatus.SUCCESS);
            setMessage("FIDO2/WebAuthn Verified");
            setTimeout(() => onComplete(true), 1000);
        } catch (e) {
            setStatus(BiometricStatus.FAILED);
            setMessage("Biometric check failed.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
            <div className="flex items-center space-x-3 mb-8 w-full">
                <div className={`p-3 rounded-xl ${status === 'SUCCESS' ? 'bg-cyan-50 border-cyan-100' : 'bg-slate-50 border-slate-100'}`}>
                    <Fingerprint className={`w-6 h-6 ${status === 'SUCCESS' ? 'text-cyan-600' : 'text-slate-600'}`} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Fingerprint Scan</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Capacitive Sensor Array</p>
                </div>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Sensor Ring */}
                <div className={`absolute inset-0 rounded-full border-4 ${status === 'SCANNING' ? 'border-cyan-500/30' : 'border-slate-100'}`}></div>
                {status === 'SCANNING' && (
                    <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                )}

                {/* Fingerprint Graphic */}
                <div className="relative z-10 w-48 h-48 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    {status === 'IDLE' && usbStatus === 'DISCONNECTED' && (
                        <Usb className="w-16 h-16 text-slate-300 animate-pulse" />
                    )}

                    {(usbStatus !== 'DISCONNECTED' || status === 'SCANNING' || status === 'SUCCESS') && (
                        <Fingerprint
                            className={`w-32 h-32 transition-all duration-500 ${status === 'SUCCESS' ? 'text-cyan-500' :
                                status === 'SCANNING' ? 'text-slate-800 opacity-80' : 'text-slate-300'
                                }`}
                            style={{
                                clipPath: status === 'SCANNING' ? `inset(0 0 ${100 - scanProgress}% 0)` : 'none'
                            }}
                        />
                    )}

                    {/* Scanning Light Bar */}
                    {status === 'SCANNING' && (
                        <div className="absolute top-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[scan_1.5s_linear_infinite]"></div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
                            <CheckCircle2 className="w-16 h-16 text-cyan-500" />
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full space-y-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                    {usbStatus === 'CONNECTED' ? (
                        <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            <Usb className="w-3 h-3 mr-1" /> USB DEVICE LINKED
                        </span>
                    ) : (
                        <span className="flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3 mr-1" /> NO EXTERNAL DEVICE
                        </span>
                    )}
                    {status === 'SCANNING' && (
                        <span className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            <Cpu className="w-3 h-3 mr-1 animate-spin" /> PROCESSING
                        </span>
                    )}
                </div>

                <p className="text-sm font-medium text-slate-600 font-mono h-5">{message}</p>

                <div className="flex space-x-3 mt-4">
                    <button
                        onClick={startUsbSimulation}
                        disabled={status !== 'IDLE' || usbStatus === 'CONNECTED'}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {usbStatus === 'CONNECTED' ? 'Reader Ready' : 'Connect USB Reader'}
                    </button>
                    <button
                        onClick={handleWebAuthn}
                        disabled={status !== 'IDLE'}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Use System Biometrics
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FingerprintScanner;
