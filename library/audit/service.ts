import { dbConnect } from "../db/mongoose";
import AuditLog from "../db/models/AuditLog";

export type AuditEventInput = {
  actorUserId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  /** Safe metadata. NEVER include passwords, tokens, API keys, or private keys. */
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Fire-and-forget audit log writer.
 * Never throws — errors are logged to stderr but do not fail the request.
 */
export function logAudit(event: AuditEventInput): void {
  void (async () => {
    try {
      await dbConnect();
      await AuditLog.create({
        actorUserId: event.actorUserId,
        actorRole: event.actorRole,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ?? null,
        metadata: event.metadata ?? {},
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error(
        "[AuditLog] Failed to write audit event:",
        event.action,
        err instanceof Error ? err.message : String(err),
      );
    }
  })();
}

/**
 * Extract a safe IP address from a request.
 * Checks x-forwarded-for first (for proxied environments), then falls back.
 */
export function getRequestIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
  );
}

/**
 * Extract user-agent from a request.
 */
export function getRequestUserAgent(request: Request): string | null {
  return request.headers.get("user-agent") ?? null;
}
