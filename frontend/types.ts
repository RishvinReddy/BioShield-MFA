
export enum AuthStage {
  LOGIN = 'LOGIN',
  FACE_SCAN = 'FACE_SCAN',
  PALM_SCAN = 'PALM_SCAN',
  FINGERPRINT_SCAN = 'FINGERPRINT_SCAN',
  VOICE_VERIFY = 'VOICE_VERIFY',
  COGNITIVE = 'COGNITIVE',
  XAI_REVIEW = 'XAI_REVIEW',
  DASHBOARD = 'DASHBOARD',
  USER_SETTINGS = 'USER_SETTINGS',
  ADMIN = 'ADMIN'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  event: string;
  riskScore: number;
  location: string;
  status: 'SUCCESS' | 'FAILED' | 'FLAGGED';
}

export interface RiskAnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  recommendations: string[];
}

export enum BiometricStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  FAILED = 'FAILED'
}

export interface BehavioralMetrics {
  typingVariance: number;
  mousePathEfficiency: number;
  interactionTime: number;
  trustScore: number;
  keystrokes?: { key: string; dwell: number; flight: number }[];
  mouseEvents?: { x: number; y: number; time: number }[];
}

export interface ThreatEvent {
  id: string;
  type: 'SYNTHETIC_VOICE' | 'GAN_FACE' | 'REPLAY_ATTACK' | 'INJECTION' | 'ADVERSARIAL_NOISE' | 'DURESS_SIGNAL';
  source: string;
  severity: 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export interface PrivacySetting {
  id: string;
  label: string;
  enabled: boolean;
  description: string;
  category: 'ESSENTIAL' | 'OPTIONAL' | 'ANALYTICS';
}

export interface BiometricAsset {
  id: string;
  type: 'FACE' | 'VOICE' | 'PALM' | 'BEHAVIORAL' | 'FINGERPRINT';
  status: 'ENROLLED' | 'REVOKED';
  enrolledDate: string;
  lastUsed: string;
  dataHash: string;
}

export interface DataAccessLog {
  id: string;
  timestamp: string;
  actor: string;
  action: 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';
  resource: string;
  purpose: string;
}

export interface SwarmDevice {
  id: string;
  name: string;
  type: 'WATCH' | 'PHONE' | 'TABLET' | 'LAPTOP' | 'IOT';
  status: 'TRUSTED' | 'VERIFYING' | 'COMPROMISED' | 'OFFLINE';
  battery: number;
  signalStrength: number;
}

export interface PolicyEvent {
  id: string;
  timestamp: string;
  trigger: string;
  action: string;
  status: 'APPLIED' | 'PENDING';
}

export interface IdentityCard {
  id: string;
  issuer: string;
  type: 'GOV_ID' | 'CORPORATE' | 'HEALTH' | 'BANKING' | 'HONEYPOT';
  status: 'VERIFIED' | 'EXPIRED' | 'REVOKED' | 'DECEPTIVE';
  expiryDate: string;
  trustLevel: 'L1' | 'L2' | 'L3';
}

export interface PrivacyTransaction {
  id: string;
  action: string;
  cost: number;
  timestamp: string;
}

export interface TrustContact {
  id: string;
  name: string;
  relation: string;
  status: 'ACTIVE' | 'PENDING' | 'LOCKED';
  lastVerified: string;
}

export interface WearableTelemetry {
  heartRate: number;
  skinTemp: number;
  isWearing: boolean;
  accelerometer: { x: number, y: number, z: number };
  rssi: number; // Signal strength
}

export interface SecurityTimelineEvent {
  id: string;
  timestamp: string;
  type: 'LIVENESS_CHECK' | 'CHALLENGE' | 'ANOMALY' | 'LOGIN' | 'DEVICE_PAIRING' | 'SECURITY_LOCK' | 'SILENT_ALARM';
  status: 'PASSED' | 'FAILED' | 'WARNING' | 'CRITICAL';
  description: string;
  riskScore: number;
  aiExplanation?: string;
}

export interface ForensicSample {
  id: string;
  type: 'AUDIO' | 'VIDEO' | 'BEHAVIOR';
  timestamp: string;
  duration: number;
  flaggedReason: string;
  meta: {
    frequencyCutoff?: number;
    jitter?: number;
    shimmer?: number;
    compressionArtifacts?: number;
  }
}
