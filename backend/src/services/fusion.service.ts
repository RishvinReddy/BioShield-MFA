/**
 * PHASE 4: MULTI-FUSION ENGINE
 * Core logic for Risk-Based Authentication (RBA).
 */

export type FusionDecision = "ALLOW" | "STEP_UP" | "DENY";

export interface FusionInput {
    passwordValid: boolean;
    otpValid: boolean;
    biometricScore: number; // Face
    voiceScore: number;     // Voice
    failedAttempts: number;
}

// 2️⃣ Weight Model (Locked)
// The weights are now embedded directly in the fusion formula.

/**
 * Evaluates the fusion score based on multiple signals.
 * @param input Normalized input signals
 * @returns Score (0-1) and Decision (ALLOW, STEP_UP, DENY)
 */
export function evaluateFusion(input: FusionInput): {
    score: number;
    decision: FusionDecision;
    breakdown: Record<string, number>;
} {
    // 3️⃣ Score Normalization Rules & 4️⃣ Fusion Score Formula

    const passwordScore = input.passwordValid ? 1.0 : 0.0;
    const otpScore = input.otpValid ? 1.0 : 0.0;
    const faceScore = input.biometricScore; // 0.0 - 1.0
    const voiceScore = input.voiceScore;    // 0.0 - 1.0

    // Risk Adjustment (simulated)
    // If failedAttempts > 0, risk increases, so adjustment decreases
    const riskAdj = Math.max(0, 1.0 - (input.failedAttempts * 0.1));

    // Weighted Fusion Formula
    // passwordScore * 0.15 + otpScore * 0.20 + faceScore * 0.25 + voiceScore * 0.20 + riskAdj * 0.20
    const totalScore =
        (passwordScore * 0.15) +
        (otpScore * 0.20) +
        (faceScore * 0.25) +
        (voiceScore * 0.20) +
        (riskAdj * 0.20);

    // Clamp result to [0,1] just in case
    const finalScore = Math.min(Math.max(totalScore, 0), 1);

    // 5️⃣ Decision Thresholds
    // ALLOW: High confidence (e.g. >= 0.85)
    // STEP_UP: Medium confidence (e.g. >= 0.65)
    // DENY: Low confidence
    const ALLOW_THRESHOLD = 0.85;
    const STEP_UP_THRESHOLD = 0.65;

    let decision: FusionDecision;

    if (finalScore >= ALLOW_THRESHOLD) {
        decision = "ALLOW";
    } else if (finalScore >= STEP_UP_THRESHOLD) {
        decision = "STEP_UP";
    } else {
        decision = "DENY";
    }

    return {
        score: Number(finalScore.toFixed(2)),
        decision,
        breakdown: {
            password: passwordScore * 0.15,
            otp: otpScore * 0.20,
            face: faceScore * 0.25,
            voice: voiceScore * 0.20,
            riskAdjustment: riskAdj * 0.20
        }
    };
}
