import * as faceapi from 'face-api.js';

// Configuration
const MODEL_URL = '/models';

// Load all required models
export const loadModels = async () => {
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log('FaceAPI Models Loaded');
        return true;
    } catch (error) {
        console.error('Error loading FaceAPI models:', error);
        return false;
    }
};

// Detect face and landmarks
export const detectFace = async (video: HTMLVideoElement) => {
    const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
    ).withFaceLandmarks().withFaceDescriptor();

    return detection;
};

// Extract face embedding (descriptor)
export const extractEmbedding = async (video: HTMLVideoElement) => {
    const detection = await detectFace(video);
    if (!detection) return null;
    return Array.from(detection.descriptor);
};

// Calculate Eye Aspect Ratio (EAR) for blink detection
// EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
export const calculateEAR = (eye: faceapi.Point[]) => {
    // 6 points per eye
    const p1 = eye[0];
    const p2 = eye[1];
    const p3 = eye[2];
    const p4 = eye[3];
    const p5 = eye[4];
    const p6 = eye[5];

    const dist26 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
    const dist35 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
    const dist14 = Math.hypot(p1.x - p4.x, p1.y - p4.y);

    const ear = (dist26 + dist35) / (2.0 * dist14);
    return ear;
};

// Detect Head Turn (Yaw) using nose position relative to eyes
export const detectHeadTurn = (landmarks: faceapi.FaceLandmarks68) => {
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();

    const noseTip = nose[3]; // Tip of the nose
    const leftJaw = jaw[0];
    const rightJaw = jaw[16];

    // Calculate ratio of nose distance to left/right jaw
    const distToLeft = Math.abs(noseTip.x - leftJaw.x);
    const distToRight = Math.abs(noseTip.x - rightJaw.x);

    // If ratio is far from 1, head is turned
    // Ratio > 2.0 implies looking Left (nose closer to right jaw in camera mirror? No, let's test)
    // Actually:
    // Turn Right -> Nose moves Right -> Closer to Right Edge -> distToRight decreases
    // Turn Left -> Nose moves Left -> Closer to Left Edge -> distToLeft decreases

    const ratio = distToLeft / (distToRight + 0.01); // avoid div by 0

    // Debug logging for tuning
    // console.log(`Head Turn Ratio: ${ratio.toFixed(2)} | Left: ${distToLeft.toFixed(0)} | Right: ${distToRight.toFixed(0)}`);

    // Normalized turn value
    let status: 'LEFT' | 'RIGHT' | 'CENTER' = 'CENTER';

    if (ratio < 0.85) status = 'LEFT';
    else if (ratio > 1.15) status = 'RIGHT';

    return { status, ratio };
};

export const isBlinking = (landmarks: faceapi.FaceLandmarks68) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);

    const avgEAR = (leftEAR + rightEAR) / 2.0;

    // Threshold (tune based on testing)
    const BLINK_THRESHOLD = 0.25;
    return avgEAR < BLINK_THRESHOLD;
};
