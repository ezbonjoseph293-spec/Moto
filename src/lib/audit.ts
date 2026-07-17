import { forPlatform } from "@/features/tenancy";

export type AuditLogInput = {
  /** Null for platform-level events (e.g. platform admin login) or when the actor is unauthenticated (e.g. failed login). */
  dealershipId?: string | null;
  /** Null when the action wasn't attributable to a known user (e.g. login attempt against a non-existent email). */
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
};

/**
 * Writes an AuditLog row. AuditLog has a nullable dealershipId (platform
 * events have none), so it's excluded from the tenant-scoped client — every
 * call site is responsible for passing the right dealershipId explicitly.
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  const db = forPlatform();
  await db.auditLog.create({
    data: {
      dealershipId: input.dealershipId ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: input.before === undefined ? undefined : (input.before as never),
      after: input.after === undefined ? undefined : (input.after as never),
      ipAddress: input.ipAddress ?? null,
    },
  });
}
