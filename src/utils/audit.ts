import { db } from "../config/database";
import { auditLogs } from "../db/schema";

interface AuditParams {
  actorUserId?: string;
  actorAccountId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  await db.insert(auditLogs).values({
    actorUserId: params.actorUserId,
    actorAccountId: params.actorAccountId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata ?? null,
  });
}
