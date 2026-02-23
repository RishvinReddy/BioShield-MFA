
import React, { useEffect, useState } from 'react';
import { Shield, Lock, Cpu, Wifi, CheckCircle2, Terminal, AlertTriangle } from 'lucide-react';

interface SystemBootProps {
  onComplete: () => void;
}

const CHECKS = [
  { id: 1, label: 'Verifying Trusted Execution Environment (TEE)...', icon: Cpu, duration: 800 },
  { id: 2, label: 'Establishing TLS 1.3 Encrypted Tunnel...', icon: Lock, duration: 600 },
  { id: 3, label: 'Scanning for Root/Jailbreak Signatures...', icon: AlertTriangle, duration: 900 },
  { id: 4, label: 'Validating Biometric Sensor Integrity...', icon: Wifi, duration: 700 },
  { id: 5, label: 'Loading Post-Quantum Cryptography Modules...', icon: Shield, duration: 1000 },
];

const SystemBoot: React.FC<SystemBootProps> = ({ onComplete }) => {
  const [currentCheck, setCurrentCheck] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const runNextCheck = (index: number) => {
      if (index >= CHECKS.length) {
        setTimeout(onComplete, 800);
        return;
      }

      const check = CHECKS[index];
      setLogs(prev => [...prev, `[INIT] ${check.label}`]);

      timer = setTimeout(() => {
        setLogs(prev => {
          const newLogs = [...prev];
          newLogs[newLogs.length - 1] = `[OK]   ${check.label}`;
          return newLogs;
        });
        setCurrentCheck(index + 1);
        runNextCheck(index + 1);
      }, check.duration);
    };

    runNextCheck(0);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-slate-950 text-emerald-500 font-mono flex flex-col items-center justify-center p-4 z-[100]">
      <div className="w-full max-w-lg">
        <div className="flex items-center space-x-3 mb-8 border-b border-emerald-900/50 pb-4">
          <Terminal className="w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider text-emerald-400">BIOSHIELD SECURE BOOT</h1>
        </div>

        <div className="space-y-4 mb-8">
          {CHECKS.map((check, index) => (
            <div key={check.id} className={`flex items-center space-x-4 transition-opacity duration-500 ${index > currentCheck ? 'opacity-0' : 'opacity-100'}`}>
              <div className={`p-1 rounded ${index < currentCheck ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                {index < currentCheck ? <CheckCircle2 className="w-4 h-4" /> : <check.icon className="w-4 h-4" />}
              </div>
              <span className={`text-sm ${index < currentCheck ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        <div className="h-32 bg-slate-900/50 rounded-lg border border-emerald-900/30 p-4 overflow-hidden relative">
           <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(16,185,129,0.1)_50%,transparent_100%)] animate-[scan_2s_linear_infinite] pointer-events-none"></div>
           <div className="flex flex-col justify-end h-full">
             {logs.map((log, i) => (
               <div key={i} className="text-xs font-mono mb-1 truncate">
                 <span className="text-emerald-600 mr-2">{new Date().toISOString().split('T')[1].slice(0, -1)}</span>
                 {log}
               </div>
             ))}
           </div>
        </div>

        <div className="mt-8 text-center">
            <div className="text-xs text-emerald-700 animate-pulse">
                {currentCheck >= CHECKS.length ? 'SYSTEM READY' : 'INITIALIZING SECURITY SUBSYSTEMS...'}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SystemBoot;
