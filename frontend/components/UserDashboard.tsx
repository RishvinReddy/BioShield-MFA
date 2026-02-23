
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Fingerprint, Globe, Smartphone, Wifi, Sun, MapPin, Watch, Laptop, Activity, AlertTriangle, Clock, Radio, Bluetooth, Skull, Lock, AlertOctagon, Wallet, CreditCard, FileCheck, Check, Award, HeartCrack, History, BrainCircuit, LogIn, Ghost, Mic, Wind, ScanFace, Database, Zap, Map, Siren, EyeOff, Eye } from 'lucide-react';
import FaceScanner from './FaceScanner';
import SwarmAuth from './SwarmAuth';
import { IdentityCard, SecurityTimelineEvent } from '../types';
import { SecureBackend } from '../services/secureBackend';

interface UserDashboardProps {
    trustScore?: number;
    onReauthenticate?: () => void;
}

// Real Data (for authenticated users)
const REAL_WALLET: IdentityCard[] = [
    { id: 'vc-1', issuer: 'Gov.Digital', type: 'GOV_ID', status: 'VERIFIED', expiryDate: '2028-12-31', trustLevel: 'L3' },
    { id: 'vc-2', issuer: 'BioShield Corp', type: 'CORPORATE', status: 'VERIFIED', expiryDate: '2026-05-15', trustLevel: 'L3' },
    { id: 'vc-3', issuer: 'Global Health', type: 'HEALTH', status: 'VERIFIED', expiryDate: '2025-11-01', trustLevel: 'L2' },
    { id: 'vc-4', issuer: 'SecureBank', type: 'BANKING', status: 'EXPIRED', expiryDate: '2024-01-01', trustLevel: 'L3' },
];

// Deceptive Data (for Duress Mode)
const HONEYPOT_WALLET: IdentityCard[] = [
    { id: 'vc-1-fake', issuer: 'Public Library', type: 'GOV_ID', status: 'VERIFIED', expiryDate: '2024-01-01', trustLevel: 'L1' },
    { id: 'vc-2-fake', issuer: 'Gym Membership', type: 'HONEYPOT', status: 'DECEPTIVE', expiryDate: '2025-01-01', trustLevel: 'L1' },
    { id: 'vc-3-fake', issuer: 'Student ID', type: 'HONEYPOT', status: 'DECEPTIVE', expiryDate: '2023-05-15', trustLevel: 'L1' },
];

const MOCK_TIMELINE_DATA: SecurityTimelineEvent[] = [
    {
        id: 'evt-0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toLocaleTimeString(),
        type: 'LOGIN',
        status: 'PASSED',
        description: 'Initial Session Authenticated',
        riskScore: 99.8,
        aiExplanation: 'Multi-factor consensus achieved. Device fingerprint matches known "MacBook Pro M2".'
    }
];

// --- HOLOGRAPHIC CARD COMPONENT ---
const HolographicCard: React.FC<{ card: IdentityCard }> = ({ card }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg tilt
        const rotateY = ((x - centerX) / centerX) * 10;

        setRotate({ x: rotateX, y: rotateY });
        setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
    };

    const handleMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
        setGlare({ x: 50, y: 50, opacity: 0 });
    };

    return (
        <div 
            className="perspective-1000" 
            style={{ perspective: '1000px' }}
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={`relative h-56 rounded-3xl p-6 transition-all duration-200 ease-out border shadow-xl overflow-hidden group select-none cursor-pointer ${
                    card.status === 'DECEPTIVE' ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200'
                }`}
                style={{
                    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.02, 1.02, 1.02)`,
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Holographic Foil Layer */}
                <div 
                    className="absolute inset-0 pointer-events-none z-10 mix-blend-color-dodge opacity-50"
                    style={{
                        background: `linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.4) 40%, rgba(255, 0, 150, 0.2) 45%, rgba(0, 200, 255, 0.2) 50%, rgba(255, 255, 255, 0.4) 60%, transparent 80%)`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: `${glare.x}% ${glare.y}%`,
                        opacity: glare.opacity
                    }}
                ></div>

                {/* Content */}
                <div className="relative z-20 h-full flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                         <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner">
                             {card.type === 'GOV_ID' ? <Globe className="w-6 h-6 text-blue-600" /> : <CreditCard className="w-6 h-6 text-indigo-600" />}
                         </div>
                         <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${
                             card.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                             card.status === 'DECEPTIVE' ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-amber-50 text-amber-600 border-amber-100'
                         }`}>
                             {card.status}
                         </div>
                     </div>
                     
                     <div>
                         <div className="flex items-center space-x-2 mb-1">
                             <h4 className="font-bold text-xl text-slate-900 tracking-tight">{card.issuer}</h4>
                             {card.trustLevel === 'L3' && <Award className="w-4 h-4 text-amber-500" />}
                         </div>
                         <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">{card.type} CREDENTIAL</p>
                     </div>

                     <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                         <div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase">ID Number</div>
                             <div className="font-mono text-sm text-slate-600">{card.id}</div>
                         </div>
                         <Fingerprint className="w-8 h-8 text-slate-100" />
                     </div>
                </div>
            </div>
        </div>
    );
};

const UserDashboard: React.FC<UserDashboardProps> = ({ trustScore: initialTrust = 99.8, onReauthenticate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'wallet' | 'timeline'>('overview');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationReason, setVerificationReason] = useState<'ROUTINE' | 'BEHAVIORAL' | 'INSIDER_THREAT' | 'WALK_AWAY_RETURN' | null>(null);
  const [timeSinceLastVerify, setTimeSinceLastVerify] = useState(0);
  const [liveTrustScore, setLiveTrustScore] = useState(initialTrust);
  const [sessionLocked, setSessionLocked] = useState<{locked: boolean, message: string}>({ locked: false, message: '' });
  const [timelineEvents, setTimelineEvents] = useState<SecurityTimelineEvent[]>(MOCK_TIMELINE_DATA);
  const [proximityDistance, setProximityDistance] = useState(1.2); 
  const [isBackendProcessing, setIsBackendProcessing] = useState(false);
  
  // Advanced Simulation States
  const [isWalkAwayActive, setIsWalkAwayActive] = useState(false);
  const [isNetworkAttack, setIsNetworkAttack] = useState(false);
  const [isGeoSpoof, setIsGeoSpoof] = useState(false);
  const [isDuressMode, setIsDuressMode] = useState(false); // Duress State
  
  // Stealth Mode State
  const [stealthMode, setStealthMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const VERIFY_INTERVAL = 300; 

  // Derived Data based on Duress Mode
  const displayedWallet = isDuressMode ? HONEYPOT_WALLET : REAL_WALLET;

  useEffect(() => {
    if (isVerifying || sessionLocked.locked) return;
    const timer = setInterval(() => {
      setTimeSinceLastVerify(prev => {
        if (prev >= VERIFY_INTERVAL) {
          triggerVerification('ROUTINE');
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isVerifying, sessionLocked]);

  // Handle Stealth Mode Mouse Tracking
  useEffect(() => {
    if (!stealthMode) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [stealthMode]);

  // Handle Simulations
  useEffect(() => {
     const interval = setInterval(() => {
         // Walk Away Simulation
         setProximityDistance(prev => {
             if (isWalkAwayActive) return Math.min(15, prev + 0.8);
             if (!isWalkAwayActive && prev > 1.2 && !sessionLocked.locked) return Math.max(1.2, prev - 1.5);
             return prev;
         });
         
         if (proximityDistance > 6 && !sessionLocked.locked) {
             handleSecurityEvent('LOCK', 'Bio-Tether Severed: User out of range (>6m)');
         }

         // Network Attack Simulation
         if (isNetworkAttack) {
             setLiveTrustScore(prev => Math.max(0, prev - 2.5));
             if (liveTrustScore < 60 && !sessionLocked.locked) {
                  handleSecurityEvent('LOCK', 'MITM Detected: Network Integrity Compromised');
                  setIsNetworkAttack(false);
             }
         } else if (!sessionLocked.locked && liveTrustScore < initialTrust) {
             setLiveTrustScore(prev => Math.min(initialTrust, prev + 0.5));
         }

         // Geo Spoof Simulation
         if (isGeoSpoof && !sessionLocked.locked) {
             handleSecurityEvent('LOCK', 'Impossible Travel: New York -> Tokyo in 1s');
             setIsGeoSpoof(false);
         }

     }, 1000);
     return () => clearInterval(interval);
  }, [proximityDistance, isWalkAwayActive, sessionLocked.locked, isNetworkAttack, isGeoSpoof, liveTrustScore]);

  const triggerVerification = (reason: any) => {
    setVerificationReason(reason);
    setIsVerifying(true);
  };

  const toggleDuressMode = () => {
      const enteringDuress = !isDuressMode;
      setIsDuressMode(enteringDuress);
      
      if (enteringDuress) {
          setTimelineEvents(prev => [{
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'SILENT_ALARM',
              status: 'CRITICAL',
              description: 'DURESS SIGNAL DETECTED: Deceptive Environment Loaded',
              riskScore: 100
          }, ...prev]);
      } else {
          setTimelineEvents(prev => [{
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'LOGIN',
              status: 'PASSED',
              description: 'Duress Protocol Deactivated',
              riskScore: 20
          }, ...prev]);
      }
  };

  const handleVerificationComplete = async (success: boolean) => {
    if (success) {
      setIsBackendProcessing(true);
      const authResult = await SecureBackend.verifyBiometricProof({ templateHash: 'mock', challengeResponse: 'mock', timestamp: Date.now() });
      setIsBackendProcessing(false);

      if (authResult.success) {
          setIsVerifying(false);
          setSessionLocked({ locked: false, message: '' });
          setLiveTrustScore(authResult.riskScore);
          if (proximityDistance > 3) { setProximityDistance(1.2); setIsWalkAwayActive(false); }
          setIsNetworkAttack(false);
          setIsGeoSpoof(false);
      }
    } else {
        setIsVerifying(false);
    }
  };

  const handleSecurityEvent = (type: 'LOCK' | 'UNLOCK' | 'WARNING', message: string) => {
      if (type === 'LOCK' && !sessionLocked.locked) {
          setSessionLocked({ locked: true, message });
          setTimelineEvents(prev => [{
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'SECURITY_LOCK',
              status: 'FAILED',
              description: message,
              riskScore: 0
          }, ...prev]);
      }
  };

  return (
    <div className={`p-6 max-w-6xl mx-auto relative ${isVerifying || sessionLocked.locked ? 'h-[80vh] overflow-hidden' : ''}`}>
      
      {/* STEALTH MODE OVERLAY */}
      {stealthMode && !sessionLocked.locked && !isVerifying && (
        <div 
          className="fixed inset-0 z-[100] cursor-none"
          style={{
             background: 'rgba(255, 255, 255, 0.05)',
             backdropFilter: 'blur(20px) grayscale(80%)',
             WebkitBackdropFilter: 'blur(20px) grayscale(80%)',
             maskImage: `radial-gradient(circle 120px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 40%, black 100%)`,
             WebkitMaskImage: `radial-gradient(circle 120px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 40%, black 100%)`,
             pointerEvents: 'none'
          }}
        >
             {/* We can place subtle hints here, but they will be masked (invisible) near the mouse */}
             <div className="absolute inset-0 flex items-center justify-center opacity-30">
                 <div className="flex flex-col items-center">
                    <EyeOff className="w-16 h-16 mb-4 text-slate-800" />
                    <div className="text-2xl font-bold text-slate-800 uppercase tracking-[0.5em]">Privacy Shield Active</div>
                 </div>
            </div>
        </div>
      )}

      {/* LOCK SCREEN - Clean Modal */}
      {sessionLocked.locked && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/90 backdrop-blur-xl rounded-3xl animate-fade-in border border-slate-200 shadow-2xl">
              <div className="p-8 text-center max-w-md">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Lock className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Locked</h2>
                  <p className="text-slate-500 mb-8">{sessionLocked.message}</p>
                  
                  <button 
                    onClick={() => { 
                        if (onReauthenticate) {
                            onReauthenticate();
                        } else {
                            triggerVerification('WALK_AWAY_RETURN'); 
                        }
                    }}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all"
                  >
                      Authenticate to Unlock
                  </button>
              </div>
          </div>
      )}

      {/* VERIFICATION OVERLAY */}
      {isVerifying && !sessionLocked.locked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-3xl animate-fade-in">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-slate-100">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Security Check</h2>
                    <p className="text-slate-500 text-sm mt-1">Verify identity to continue</p>
                </div>
                {isBackendProcessing ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Database className="w-12 h-12 text-blue-500 animate-bounce mb-4" />
                        <span className="text-sm font-medium text-slate-600">Verifying Proof...</span>
                    </div>
                ) : (
                    <FaceScanner onComplete={handleVerificationComplete} />
                )}
            </div>
        </div>
      )}

      {/* Identity Header */}
      <div className={`bg-white p-6 rounded-3xl border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden ${isVerifying || sessionLocked.locked ? 'blur-sm grayscale' : ''}`}>
        
        {/* Duress Indicator */}
        {isDuressMode && (
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse"></div>
        )}

        <div className="flex items-center space-x-6 w-full md:w-auto mb-4 md:mb-0">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-500 ${isDuressMode ? 'bg-slate-800 shadow-slate-200' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'}`}>
                {isDuressMode ? <EyeOff className="w-8 h-8 text-red-500" /> : <ShieldCheck className="w-8 h-8 text-white" />}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {isDuressMode ? 'Guest Session' : 'Identity Verified'}
                </h1>
                <div className="flex items-center space-x-3 text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded font-bold text-xs flex items-center ${isDuressMode ? 'bg-slate-100 text-slate-500' : 'text-emerald-600 bg-emerald-50'}`}>
                        <Activity className="w-3 h-3 mr-1" /> {isDuressMode ? 'LIMITED ACCESS' : 'ACTIVE'}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 text-xs">Session ID: {isDuressMode ? 'UNK-00' : '8X92-A1'}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center space-x-8">
            <div className="text-right hidden md:block">
                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Trust Score</div>
                <div className={`text-4xl font-bold transition-colors duration-500 ${liveTrustScore < 80 ? 'text-red-500' : 'text-slate-900'}`}>
                    {liveTrustScore.toFixed(0)}
                </div>
            </div>
             
             {/* Simulation Control Panel */}
             <div className="flex flex-col space-y-2">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chaos Engineering</div>
                 <div className="flex space-x-2">
                    <button 
                        onClick={() => setStealthMode(!stealthMode)}
                        className={`text-xs px-3 py-2 rounded-lg font-bold transition-colors border ${stealthMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        title="Stealth Mode (Privacy Screen)"
                    >
                        {stealthMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button 
                        onClick={() => setIsWalkAwayActive(!isWalkAwayActive)} 
                        className={`text-xs px-3 py-2 rounded-lg font-bold transition-colors border ${isWalkAwayActive ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        title="Simulate Walk Away"
                    >
                        <Wind className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setIsNetworkAttack(!isNetworkAttack)} 
                        className={`text-xs px-3 py-2 rounded-lg font-bold transition-colors border ${isNetworkAttack ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        title="Simulate Network Attack"
                    >
                        <Zap className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={toggleDuressMode} 
                        className={`text-xs px-3 py-2 rounded-lg font-bold transition-colors border ${isDuressMode ? 'bg-red-900 border-red-900 text-white animate-pulse' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        title="Simulate Duress Protocol"
                    >
                        <Siren className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex space-x-8 mb-8 border-b border-slate-200 pb-1 ${isVerifying || sessionLocked.locked ? 'blur-sm opacity-50' : ''}`}>
        {['overview', 'devices', 'wallet', 'timeline'].map(tab => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-bold capitalize transition-all border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                {tab}
            </button>
        ))}
      </div>

      <div className={`transition-all duration-300 ${isVerifying || sessionLocked.locked ? 'blur-md pointer-events-none opacity-50' : ''}`}>
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Fusion Factors</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center space-x-3">
                                <Fingerprint className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-slate-700">Biometrics</span>
                            </div>
                            <Check className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center space-x-3">
                                <Smartphone className="w-5 h-5 text-indigo-600" />
                                <span className="font-medium text-slate-700">Device Trust</span>
                            </div>
                            <Check className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Active Defense</h3>
                    <div className={`p-4 border rounded-2xl flex items-center mb-4 transition-colors ${isNetworkAttack ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm mr-4 ${isNetworkAttack ? 'bg-red-100 text-red-600' : 'bg-white text-emerald-600'}`}>
                            {isNetworkAttack ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div>
                             <h4 className="font-bold text-slate-800 text-sm">Threat Monitor</h4>
                             <p className="text-xs text-slate-500">
                                 {isNetworkAttack ? 'Anomaly Detected: Packet Injection' : 'No anomalies detected in current session.'}
                             </p>
                        </div>
                    </div>
                </div>
              </div>
          )}

          {activeTab === 'devices' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        <h3 className="text-slate-900 font-bold mb-8">Proximity Radar</h3>
                        <div className="relative w-64 h-64">
                            <div className="absolute inset-0 border border-slate-200 rounded-full"></div>
                            <div className="absolute inset-12 border border-slate-200 rounded-full"></div>
                            <div className="absolute inset-24 border border-slate-200 rounded-full bg-slate-50"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-500/10 rounded-full animate-spin"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-lg z-10 border-2 border-white"></div>
                            <div 
                                className={`absolute w-3 h-3 rounded-full transition-all duration-1000 z-20 ${proximityDistance > 5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ top: '50%', left: '50%', transform: `rotate(${Date.now() / 50}deg) translateX(${proximityDistance * 20}px)` }}
                            ></div>
                        </div>
                        <div className="mt-8 text-center font-mono text-slate-500 text-sm">
                            Distance: <strong className="text-slate-900">{proximityDistance.toFixed(1)}m</strong>
                        </div>
                   </div>
                   <SwarmAuth onSecurityEvent={handleSecurityEvent} />
              </div>
          )}

          {activeTab === 'wallet' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 perspective-1000">
                 {displayedWallet.map(card => (
                     <HolographicCard key={card.id} card={card} />
                 ))}
              </div>
          )}
          
          {activeTab === 'timeline' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900">Security Audit Log</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                      {timelineEvents.map((evt, i) => (
                          <div key={i} className={`p-4 hover:bg-slate-50 transition-colors flex items-start space-x-4 ${evt.type === 'SILENT_ALARM' ? 'bg-red-50/50' : ''}`}>
                              <div className={`mt-1 w-2 h-2 rounded-full ${
                                  evt.status === 'CRITICAL' ? 'bg-purple-600 animate-ping' :
                                  evt.status === 'FAILED' ? 'bg-red-500' : 'bg-emerald-500'
                              }`}></div>
                              <div>
                                  <div className="flex items-center space-x-2">
                                      <span className="text-sm font-bold text-slate-800">{evt.description}</span>
                                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{evt.type}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">{evt.timestamp} • Risk Score: {evt.riskScore}</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default UserDashboard;
