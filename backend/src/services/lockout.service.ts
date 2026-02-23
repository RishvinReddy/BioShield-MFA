/**
 * Service to handle account lockout logic to prevent brute force attacks.
 * Policy: Lock account for 15 minutes after 5 failed attempts.
 */

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function shouldLockAccount(failedAttempts: number): boolean {
    return failedAttempts >= MAX_ATTEMPTS;
}

export function lockUntilTime(): Date {
    return new Date(Date.now() + LOCKOUT_DURATION_MS);
}

export function isAccountLocked(lockUntil: Date | null): boolean {
    if (!lockUntil) return false;
    return new Date() < lockUntil;
}
