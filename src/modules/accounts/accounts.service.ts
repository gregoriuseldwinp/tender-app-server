import { db } from "../../config/database";
import { accounts, users } from "../../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createAuditLog } from "../../utils/audit";

export async function getPendingAccounts() {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.status, "pending"), isNull(accounts.deletedAt)));
}

export async function getAllAccounts() {
  return db.select().from(accounts).where(isNull(accounts.deletedAt));
}

export async function getAccountById(id: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .limit(1);

  if (!account) {
    throw Object.assign(new Error("Account not found"), { statusCode: 404 });
  }

  const accountUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(and(eq(users.accountId, id), isNull(users.deletedAt)));

  return { ...account, users: accountUsers };
}

export async function approveAccount(id: string, actorUserId: string, actorAccountId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .limit(1);

  if (!account) {
    throw Object.assign(new Error("Account not found"), { statusCode: 404 });
  }

  if (account.status !== "pending") {
    throw Object.assign(new Error("Account is not in pending status"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(accounts)
    .set({
      status: "approved",
      approvedAt: new Date(),
      approvedBy: actorUserId,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "account:approve",
    entityType: "account",
    entityId: id,
  });

  return updated;
}

export async function rejectAccount(
  id: string,
  reason: string,
  actorUserId: string,
  actorAccountId: string
) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .limit(1);

  if (!account) {
    throw Object.assign(new Error("Account not found"), { statusCode: 404 });
  }

  if (account.status !== "pending") {
    throw Object.assign(new Error("Account is not in pending status"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(accounts)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
      rejectedBy: actorUserId,
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "account:reject",
    entityType: "account",
    entityId: id,
    metadata: { reason },
  });

  return updated;
}

export async function suspendAccount(id: string, actorUserId: string, actorAccountId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .limit(1);

  if (!account) {
    throw Object.assign(new Error("Account not found"), { statusCode: 404 });
  }

  if (account.accountType === "internal") {
    throw Object.assign(new Error("Cannot suspend internal accounts"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(accounts)
    .set({ status: "suspended", updatedAt: new Date() })
    .where(eq(accounts.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "account:suspend",
    entityType: "account",
    entityId: id,
  });

  return updated;
}
