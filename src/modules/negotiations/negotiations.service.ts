import { db } from "../../config/database";
import { proposalNegotiationComments, proposals, tenderProjects, users, accounts } from "../../db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { createAuditLog } from "../../utils/audit";
import { CreateCommentInput } from "./negotiations.schema";

type RawComment = typeof proposalNegotiationComments.$inferSelect;

async function enrichComments(comments: RawComment[]) {
  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c) => c.senderUserId))];
  const accountIds = [...new Set(comments.map((c) => c.senderAccountId))];

  const [senderUsers, senderAccounts] = await Promise.all([
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, userIds)),
    db
      .select({ id: accounts.id, companyName: accounts.companyName })
      .from(accounts)
      .where(inArray(accounts.id, accountIds)),
  ]);

  const userMap = Object.fromEntries(senderUsers.map((u) => [u.id, u]));
  const accountMap = Object.fromEntries(senderAccounts.map((a) => [a.id, a]));

  return comments.map((c) => ({
    ...c,
    sender: {
      userId: c.senderUserId,
      name: userMap[c.senderUserId]?.name ?? null,
      accountId: c.senderAccountId,
      companyName: accountMap[c.senderAccountId]?.companyName ?? null,
      accountType: c.senderAccountType,
    },
  }));
}

async function verifyBuyerAccess(proposalId: string, buyerAccountId: string) {
  const [row] = await db
    .select({ p: proposals, t: tenderProjects })
    .from(proposals)
    .innerJoin(tenderProjects, eq(proposals.tenderProjectId, tenderProjects.id))
    .where(
      and(
        eq(proposals.id, proposalId),
        eq(tenderProjects.buyerAccountId, buyerAccountId),
        isNull(proposals.deletedAt)
      )
    )
    .limit(1);

  if (!row) {
    throw Object.assign(new Error("Proposal not found or access denied"), { statusCode: 404 });
  }

  return { proposal: row.p, tender: row.t };
}

async function verifySupplierAccess(proposalId: string, supplierAccountId: string) {
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.id, proposalId),
        eq(proposals.supplierAccountId, supplierAccountId),
        isNull(proposals.deletedAt)
      )
    )
    .limit(1);

  if (!proposal) {
    throw Object.assign(new Error("Proposal not found or access denied"), { statusCode: 404 });
  }

  return proposal;
}

export async function getBuyerNegotiations(proposalId: string, buyerAccountId: string) {
  await verifyBuyerAccess(proposalId, buyerAccountId);

  const comments = await db
    .select()
    .from(proposalNegotiationComments)
    .where(
      and(
        eq(proposalNegotiationComments.proposalId, proposalId),
        isNull(proposalNegotiationComments.deletedAt)
      )
    );

  return enrichComments(comments);
}

export async function createBuyerComment(
  proposalId: string,
  input: CreateCommentInput,
  senderUserId: string,
  buyerAccountId: string
) {
  const { tender } = await verifyBuyerAccess(proposalId, buyerAccountId);

  const [comment] = await db
    .insert(proposalNegotiationComments)
    .values({
      proposalId,
      tenderProjectId: tender.id,
      senderUserId,
      senderAccountId: buyerAccountId,
      senderAccountType: "buyer",
      message: input.message,
    })
    .returning();

  await createAuditLog({
    actorUserId: senderUserId,
    actorAccountId: buyerAccountId,
    action: "negotiation:comment",
    entityType: "proposal_negotiation_comment",
    entityId: comment.id,
    metadata: { proposalId },
  });

  const [enriched] = await enrichComments([comment]);
  return enriched;
}

export async function getSupplierNegotiations(proposalId: string, supplierAccountId: string) {
  await verifySupplierAccess(proposalId, supplierAccountId);

  const comments = await db
    .select()
    .from(proposalNegotiationComments)
    .where(
      and(
        eq(proposalNegotiationComments.proposalId, proposalId),
        isNull(proposalNegotiationComments.deletedAt)
      )
    );

  return enrichComments(comments);
}

export async function createSupplierComment(
  proposalId: string,
  input: CreateCommentInput,
  senderUserId: string,
  supplierAccountId: string
) {
  const proposal = await verifySupplierAccess(proposalId, supplierAccountId);

  const [comment] = await db
    .insert(proposalNegotiationComments)
    .values({
      proposalId,
      tenderProjectId: proposal.tenderProjectId,
      senderUserId,
      senderAccountId: supplierAccountId,
      senderAccountType: "supplier",
      message: input.message,
    })
    .returning();

  await createAuditLog({
    actorUserId: senderUserId,
    actorAccountId: supplierAccountId,
    action: "negotiation:comment",
    entityType: "proposal_negotiation_comment",
    entityId: comment.id,
    metadata: { proposalId },
  });

  const [enriched] = await enrichComments([comment]);
  return enriched;
}

export async function getInternalNegotiations(proposalId: string) {
  const [proposal] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), isNull(proposals.deletedAt)))
    .limit(1);

  if (!proposal) {
    throw Object.assign(new Error("Proposal not found"), { statusCode: 404 });
  }

  const comments = await db
    .select()
    .from(proposalNegotiationComments)
    .where(
      and(
        eq(proposalNegotiationComments.proposalId, proposalId),
        isNull(proposalNegotiationComments.deletedAt)
      )
    );

  return enrichComments(comments);
}
