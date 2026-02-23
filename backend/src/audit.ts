import prisma from './prisma';

export interface AuditLogEntry {
    userId?: string;
    action: string;
    metadata?: any;
}

/**
 * Logs a security event
 */
export async function logEvent(entry: AuditLogEntry) {
    const { userId, action, metadata } = entry;

    try {
        await prisma.auditLog.create({
            data: {
                userId,
                eventType: action, // mapped to action
                // metadata: metadata || {} // Removed as schema doesn't support JSON metadata yet
                ipAddress: metadata?.ip || 'unknown',
                riskScore: metadata?.riskScore || null,
                decision: metadata?.decision || null
            }
        });
        console.log(`[AUDIT] Event: ${action}, User: ${userId || 'System'}`);
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
}
