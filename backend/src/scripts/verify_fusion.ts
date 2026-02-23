import { evaluateFusion, FusionInput } from '../services/fusion.service';
import * as fs from 'fs';
import * as path from 'path';

const testCases: { name: string; input: FusionInput }[] = [
    {
        name: "Standard Legitimate User (Password Only)",
        input: {
            passwordValid: true,
            otpValid: false,
            biometricScore: 0,
            failedAttempts: 0
        }
    },
    {
        name: "Full Security User (Pass + OTP + Bio)",
        input: {
            passwordValid: true,
            otpValid: true,
            biometricScore: 0.9,
            failedAttempts: 0
        }
    },
    {
        name: "Attacker (Password Only)",
        input: {
            passwordValid: true,
            otpValid: false,
            biometricScore: 0,
            failedAttempts: 0
        }
    },
    {
        name: "Brute Force Attempt (Password, High Failures)",
        input: {
            passwordValid: true,
            otpValid: false,
            biometricScore: 0,
            failedAttempts: 5
        }
    },
    {
        name: "Step-Up Scenario (Pass + OTP)",
        input: {
            passwordValid: true,
            otpValid: true,
            biometricScore: 0,
            failedAttempts: 0
        }
    }
];

const results = testCases.map(test => {
    const result = evaluateFusion(test.input);
    return {
        name: test.name,
        input: test.input,
        score: result.score,
        decision: result.decision,
        breakdown: result.breakdown
    };
});

const outputPath = path.join(__dirname, '..', '..', 'verification.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log(`Verification results written to ${outputPath}`);
