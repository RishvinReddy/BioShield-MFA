
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Activity, FileAudio, AlertTriangle, Fingerprint, Search, Cpu, BarChart3, Mic } from 'lucide-react';
import { ForensicSample } from '../types';

const MOCK_SAMPLES: ForensicSample[] = [
    { 
        id: 'evid-001', type: 'AUDIO', timestamp: '10:42:05', duration: 12, flaggedReason: 'Synthetic Voice Markers',
        meta: { frequencyCutoff: 16000, jitter: 0.05, shimmer: 0.02, compressionArtifacts: 0.95 }
    },
    { 
        id: 'evid-002', type: 'VIDEO', timestamp: '09:15:30', duration: 5, flaggedReason: 'Deepfake Glitch (Frame 42)',
        meta: { frequencyCutoff: 0, jitter: 0, shimmer: 0, compressionArtifacts: 0.88 }
    }
];

const ForensicAnalyzer: React.FC = () => {
    const [selectedSample, setSelectedSample] = useState<ForensicSample | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analyzing, setAnalyzing] = useState(false);
    
    // Visualization State
    const [bars, setBars] = useState<number[]>(new Array(64).fill(10));

    useEffect(() => {
        if (isPlaying || analyzing) {
            const interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.random() * 80 + 10));
            }, 50);
            return () => clearInterval(interval);
        } else {
             setBars(new Array(64).fill(10));
        }
    }, [isPlaying, analyzing]);

    const runAnalysis = () => {
        setAnalyzing(true);
        setAnalysisProgress(0);
        const interval = setInterval(() => {
            setAnalysisProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setAnalyzing(false);
                    return 100;
                }
                return prev + 1.5;
            });
        }, 50);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Sample List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <FileAudio className="w-4 h-4 mr-2 text-indigo-600" /> Evidence Locker
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {MOCK_SAMPLES.map(sample => (
                        <div 
                            key={sample.id}
                            onClick={() => { setSelectedSample(sample); setAnalysisProgress(0); }}
                            className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedSample?.id === sample.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sample.type === 'AUDIO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{sample.type}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{sample.timestamp}</span>
                            </div>
                            <div className="font-bold text-slate-800 text-sm mb-0.5">{sample.id}</div>
                            <div className="text-xs text-red-500 font-medium flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> {sample.flaggedReason}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Workbench */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col relative">
                {!selectedSample ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <Search className="w-16 h-16 mb-4 opacity-50" />
                        <p>Select evidence to analyze</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <div>
                                <h3 className="text-slate-100 font-bold flex items-center">
                                    <Cpu className="w-4 h-4 mr-2 text-cyan-400" /> Forensic Workbench
                                </h3>
                                <div className="text-xs text-slate-500 font-mono mt-1">Target: {selectedSample.id}</div>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors"
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Visualizer */}
                        <div className="flex-1 p-6 flex flex-col justify-center relative">
                            {/* Grid Line */}
                            <div className="absolute inset-0 border-b border-cyan-900/30 pointer-events-none" style={{ top: '50%' }}></div>
                            
                            <div className="flex items-end justify-center h-48 space-x-1">
                                {bars.map((h, i) => (
                                    <div 
                                        key={i}
                                        className={`w-2 rounded-t-sm transition-all duration-75 ${analyzing ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-cyan-500 shadow-[0_0_5px_cyan]'}`}
                                        style={{ height: `${h}%`, opacity: 0.6 + (h/200) }}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Metrics Panel */}
                        <div className="h-48 bg-slate-950 border-t border-slate-800 p-6 grid grid-cols-3 gap-6">
                             {/* AI Probability */}
                             <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-2 opacity-20">
                                     <Fingerprint className="w-12 h-12 text-white" />
                                 </div>
                                 <div className="text-xs text-slate-400 uppercase font-bold mb-2">Deepfake Probability</div>
                                 <div className={`text-3xl font-bold ${analysisProgress === 100 ? 'text-red-500' : 'text-slate-200'}`}>
                                     {analysisProgress === 100 ? '98.4%' : '--'}
                                 </div>
                                 {analysisProgress === 100 && (
                                     <div className="text-[10px] text-red-400 mt-1">HIGH CONFIDENCE MATCH</div>
                                 )}
                             </div>

                             {/* Spectral Data */}
                             <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                                  <div className="text-xs text-slate-400 uppercase font-bold mb-3">Spectral Artifacts</div>
                                  <div className="space-y-2">
                                      <div className="flex justify-between text-xs">
                                          <span className="text-slate-500">Jitter</span>
                                          <span className="text-cyan-400 font-mono">0.05%</span>
                                      </div>
                                      <div className="w-full bg-slate-800 h-1.5 rounded-full">
                                          <div className="bg-cyan-500 h-full w-[40%] rounded-full"></div>
                                      </div>
                                      <div className="flex justify-between text-xs mt-2">
                                          <span className="text-slate-500">HF Cutoff</span>
                                          <span className="text-orange-400 font-mono">16kHz</span>
                                      </div>
                                      <div className="w-full bg-slate-800 h-1.5 rounded-full">
                                          <div className="bg-orange-500 h-full w-[85%] rounded-full"></div>
                                      </div>
                                  </div>
                             </div>

                             {/* Actions */}
                             <div className="flex flex-col justify-center space-y-3">
                                 <button 
                                    onClick={runAnalysis}
                                    disabled={analyzing || analysisProgress === 100}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center"
                                 >
                                     {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                                     {analyzing ? 'Processing...' : 'Run Neural Analysis'}
                                 </button>
                             </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* Hidden Loader Helper */}
            {analyzing && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                     <div className="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md flex items-center space-x-3">
                         <Cpu className="w-5 h-5 animate-pulse text-cyan-400" />
                         <span className="font-mono text-sm">Processing Neural Layers... {Math.round(analysisProgress)}%</span>
                     </div>
                </div>
            )}
        </div>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default ForensicAnalyzer;
