interface RiskContext {
    userId: string;
    currentIp: string;
    currentDevice: string;
    typingSpeed?: number;
    mouseVariance?: number;
    failedAttempts: number;
}

interface RiskResult {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH";
    reasons: string[];
}

export class RiskService {
    async calculateRisk(context: RiskContext): Promise<RiskResult> {
        let score = 0;
        const reasons: string[] = [];

        // 1️⃣ Failed attempts
        if (context.failedAttempts > 3) {
            score += 15;
            reasons.push("Multiple failed login attempts");
        }

        // 2️⃣ IP check
        const isNewIp = await this.isNewIp(context.userId, context.currentIp);
        if (isNewIp) {
            score += 20;
            reasons.push("New IP address detected");
        }

        // 3️⃣ Device check
        const isNewDevice = await this.isNewDevice(context.userId, context.currentDevice);
        if (isNewDevice) {
            score += 25;
            reasons.push("Unrecognized device");
        }

        // 4️⃣ Behavioral check
        const behaviorRisk = await this.checkBehavior(context);
        score += behaviorRisk.score;
        reasons.push(...behaviorRisk.reasons);

        return {
            score,
            level: this.mapRiskLevel(score),
            reasons
        };
    }

    private mapRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" {
        if (score < 30) return "LOW";
        if (score < 70) return "MEDIUM";
        return "HIGH";
    }

    private async isNewIp(userId: string, ip: string): Promise<boolean> {
        // TODO: Query previous sessions from DB
        return true; // placeholder logic
    }

    private async isNewDevice(userId: string, device: string): Promise<boolean> {
        // TODO: Query previous sessions/devices from DB
        return true;
    }

    private async checkBehavior(context: RiskContext) {
        let score = 0;
        const reasons: string[] = [];

        if (!context.typingSpeed) return { score, reasons };

        // Compare with stored behavioral profile
        const deviation = 30; // placeholder

        if (deviation > 25) {
            score += 30;
            reasons.push("Typing behavior deviation");
        }

        return { score, reasons };
    }
}
