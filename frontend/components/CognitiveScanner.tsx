
import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Target, Zap, MousePointer2, Clock } from 'lucide-react';
import { BiometricStatus } from '../types';

interface CognitiveScannerProps {
  onComplete: (success: boolean) => void;
}

const CognitiveScanner: React.FC<CognitiveScannerProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<BiometricStatus>(BiometricStatus.IDLE);
  const [targets, setTargets] = useState<{id: number, x: number, y: number, size: number}[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastSpawnTime = useRef(Date.now());

  useEffect(() => {
    if (status === BiometricStatus.SCANNING) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            finalizeTest();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [status]);

  const startTest = () => {
    setStatus(BiometricStatus.SCANNING);
    spawnTarget();
  };

  const spawnTarget = () => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    
    const size = Math.random() * 30 + 40; // 40-70px
    const x = Math.random() * (width - size);
    const y = Math.random() * (height - size);
    
    setTargets([{ id: Date.now(), x, y, size }]);
    lastSpawnTime.current = Date.now();
  };

  const handleTargetClick = (id: number) => {
    const reaction = Date.now() - lastSpawnTime.current;
    setReactionTimes(prev => [...prev, reaction]);
    setScore(prev => prev + 1);
    setTargets([]); // Remove target
    
    // Rapid spawn next
    setTimeout(spawnTarget, Math.random() * 200 + 100);
  };

  const finalizeTest = () => {
    setStatus(BiometricStatus.VERIFYING);
    setTimeout(() => {
      setStatus(BiometricStatus.SUCCESS);
      setTimeout(() => onComplete(true), 1500);
    }, 1500);
  };

  const avgReaction = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
    : 0;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[600px] mx-auto bg-slate-900 p-1 rounded-3xl border border-cyan-900/50 shadow-2xl overflow-hidden relative">
      {/* HUD Header */}
      <div className="w-full p-4 bg-slate-900/90 backdrop-blur flex justify-between items-center border-b border-slate-800 z-10">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/50">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-100">Cognitive Response</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase">Neuro-Synaptic Calibration</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Latency</span>
                <span className="text-sm font-mono text-cyan-400">{avgReaction}ms</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Time</span>
                <span className={`text-sm font-mono ${timeLeft < 2 ? 'text-red-400' : 'text-slate-200'}`}>
                    {timeLeft.toFixed(1)}s
                </span>
            </div>
        </div>
      </div>

      {/* Interactive Area */}
      <div 
        ref={canvasRef}
        className="relative w-full h-[350px] bg-slate-950 overflow-hidden cursor-crosshair"
      >
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,_transparent_1px),_linear-gradient(90deg,#1e293b_1px,_transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
        
        {status === BiometricStatus.IDLE && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-20">
                 <button 
                    onClick={startTest}
                    className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(8,145,178,0.5)]"
                 >
                    <span className="flex items-center space-x-2">
                        <MousePointer2 className="w-5 h-5" />
                        <span>Initiate Sequence</span>
                    </span>
                    <div className="absolute inset-0 rounded-full ring-2 ring-white/20 animate-ping"></div>
                 </button>
             </div>
        )}

        {status === BiometricStatus.SCANNING && targets.map(target => (
            <button
                key={target.id}
                onClick={() => handleTargetClick(target.id)}
                className="absolute rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{
                    left: target.x,
                    top: target.y,
                    width: target.size,
                    height: target.size,
                    background: 'radial-gradient(circle, rgba(6,182,212,0.8) 0%, rgba(8,145,178,0) 70%)',
                    boxShadow: '0 0 15px #22d3ee',
                    border: '1px solid #a5f3fc'
                }}
            >
                <Target className="w-1/2 h-1/2 text-white animate-spin-slow" />
            </button>
        ))}

        {/* Analysis Overlay */}
        {status === BiometricStatus.VERIFYING && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur flex flex-col items-center justify-center text-center">
                <Clock className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <h4 className="text-xl font-bold text-white">Analyzing Reflex Pattern...</h4>
                <p className="text-slate-400 text-sm mt-2">Verifying motor-cortex timing signature</p>
            </div>
        )}

        {status === BiometricStatus.SUCCESS && (
             <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/50">
                    <Zap className="w-8 h-8 text-white fill-white" />
                </div>
                <h4 className="text-2xl font-bold text-white">Cognitive Hash Verified</h4>
                <p className="text-emerald-200 text-sm mt-2">Human Reflex Confirmed</p>
            </div>
        )}
      </div>

      {/* Footer / Stats */}
      <div className="w-full p-4 bg-slate-900 border-t border-slate-800 flex justify-between text-xs">
          <div className="flex items-center text-slate-500">
             <Target className="w-3 h-3 mr-1.5" />
             <span>Accuracy: {score > 0 ? '100%' : '--'}</span>
          </div>
           <div className="flex items-center text-slate-500">
             <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
             <span>Brainwave Emulation: Active</span>
          </div>
      </div>
    </div>
  );
};

export default CognitiveScanner;
