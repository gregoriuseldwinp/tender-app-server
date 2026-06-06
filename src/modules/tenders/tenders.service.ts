import { db } from "../../config/database";
import { tenderProjects, proposals, accounts, users } from "../../db/schema";
import { eq, and, isNull, inArray, count } from "drizzle-orm";
import { createAuditLog } from "../../utils/audit";
import { CreateTenderInput, UpdateTenderInput } from "./tenders.schema";

// Buyer: create tender
export async function createTender(
  input: CreateTenderInput,
  buyerAccountId: string,
  createdByUserId: string
) {
  const [tender] = await db
    .insert(tenderProjects)
    .values({
      ...input,
      budgetEstimate: input.budgetEstimate?.toString(),
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      attachments: input.attachments ?? null,
      buyerAccountId,
      createdByUserId,
      status: "pending_review",
    })
    .returning();

  return tender;
}

// Buyer: list their own tenders
export async function getBuyerTenders(buyerAccountId: string) {
  return db
    .select()
    .from(tenderProjects)
    .where(and(eq(tenderProjects.buyerAccountId, buyerAccountId), isNull(tenderProjects.deletedAt)));
}

// Buyer: get their own tender by id
export async function getBuyerTenderById(id: string, buyerAccountId: string) {
  const [tender] = await db
    .select()
    .from(tenderProjects)
    .where(
      and(
        eq(tenderProjects.id, id),
        eq(tenderProjects.buyerAccountId, buyerAccountId),
        isNull(tenderProjects.deletedAt)
      )
    )
    .limit(1);

  if (!tender) {
    throw Object.assign(new Error("Tender not found"), { statusCode: 404 });
  }

  return tender;
}

// Buyer: update their own tender (only if draft or rejected)
export async function updateBuyerTender(
  id: string,
  input: UpdateTenderInput,
  buyerAccountId: string
) {
  const tender = await getBuyerTenderById(id, buyerAccountId);

  if (!["draft", "rejected"].includes(tender.status)) {
    throw Object.assign(new Error("Only draft or rejected tenders can be updated"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(tenderProjects)
    .set({
      ...input,
      budgetEstimate: input.budgetEstimate?.toString(),
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      attachments: input.attachments ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(tenderProjects.id, id))
    .returning();

  return updated;
}

// Buyer: soft delete their own tender
export async function deleteBuyerTender(id: string, buyerAccountId: string) {
  const tender = await getBuyerTenderById(id, buyerAccountId);

  if (tender.status === "published") {
    throw Object.assign(new Error("Cannot delete a published tender"), { statusCode: 400 });
  }

  await db
    .update(tenderProjects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(tenderProjects.id, id));
}

// Buyer: get proposals for their tender
export async function getBuyerTenderProposals(tenderId: string, buyerAccountId: string) {
  await getBuyerTenderById(tenderId, buyerAccountId);

  const rows = await db
    .select({
      proposal: proposals,
      supplier: {
        id: accounts.id,
        companyName: accounts.companyName,
        legalName: accounts.legalName,
        email: accounts.email,
        phone: accounts.phone,
      },
    })
    .from(proposals)
    .leftJoin(accounts, eq(proposals.supplierAccountId, accounts.id))
    .where(and(eq(proposals.tenderProjectId, tenderId), isNull(proposals.deletedAt)));

  return rows.map((r) => ({ ...r.proposal, supplier: r.supplier }));
}

// Supplier: list published tenders
export async function getPublishedTenders() {
  return db
    .select()
    .from(tenderProjects)
    .where(and(eq(tenderProjects.status, "published"), isNull(tenderProjects.deletedAt)));
}

// Supplier: get single published tender
export async function getPublishedTenderById(id: string) {
  const [tender] = await db
    .select()
    .from(tenderProjects)
    .where(
      and(
        eq(tenderProjects.id, id),
        eq(tenderProjects.status, "published"),
        isNull(tenderProjects.deletedAt)
      )
    )
    .limit(1);

  if (!tender) {
    throw Object.assign(new Error("Tender not found"), { statusCode: 404 });
  }

  return tender;
}

// Internal: list all tenders
export async function getAllTenders() {
  return db.select().from(tenderProjects).where(isNull(tenderProjects.deletedAt));
}

// Internal: list pending tenders
export async function getPendingTenders() {
  return db
    .select()
    .from(tenderProjects)
    .where(and(eq(tenderProjects.status, "pending_review"), isNull(tenderProjects.deletedAt)));
}

// Internal: get tender by id
export async function getInternalTenderById(id: string) {
  const [tender] = await db
    .select()
    .from(tenderProjects)
    .where(and(eq(tenderProjects.id, id), isNull(tenderProjects.deletedAt)))
    .limit(1);

  if (!tender) {
    throw Object.assign(new Error("Tender not found"), { statusCode: 404 });
  }

  const [proposalRows, [{ total }], [buyerAccount], [createdByUser]] = await Promise.all([
    db
      .select({
        proposal: proposals,
        supplier: {
          id: accounts.id,
          companyName: accounts.companyName,
          legalName: accounts.legalName,
          email: accounts.email,
          phone: accounts.phone,
        },
        submittedBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(proposals)
      .leftJoin(accounts, eq(proposals.supplierAccountId, accounts.id))
      .leftJoin(users, eq(proposals.submittedByUserId, users.id))
      .where(and(eq(proposals.tenderProjectId, id), isNull(proposals.deletedAt))),

    db
      .select({ total: count() })
      .from(proposals)
      .where(and(eq(proposals.tenderProjectId, id), isNull(proposals.deletedAt))),

    db
      .select({
        id: accounts.id,
        companyName: accounts.companyName,
        legalName: accounts.legalName,
        email: accounts.email,
        phone: accounts.phone,
        address: accounts.address,
      })
      .from(accounts)
      .where(eq(accounts.id, tender.buyerAccountId))
      .limit(1),

    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, tender.createdByUserId))
      .limit(1),
  ]);

  return {
    ...tender,
    buyer: buyerAccount ?? null,
    createdBy: createdByUser ?? null,
    proposalCount: total,
    proposals: proposalRows.map((r) => ({
      ...r.proposal,
      supplier: r.supplier,
      submittedBy: r.submittedBy,
    })),
  };
}

// Internal: approve tender → published
export async function approveTender(id: string, actorUserId: string, actorAccountId: string) {
  const tender = await getInternalTenderById(id);

  if (tender.status !== "pending_review") {
    throw Object.assign(new Error("Tender is not pending review"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(tenderProjects)
    .set({
      status: "published",
      approvedAt: new Date(),
      approvedBy: actorUserId,
      updatedAt: new Date(),
    })
    .where(eq(tenderProjects.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "tender:approve",
    entityType: "tender_project",
    entityId: id,
  });

  return updated;
}

// Internal: reject tender
export async function rejectTender(
  id: string,
  reason: string,
  actorUserId: string,
  actorAccountId: string
) {
  const tender = await getInternalTenderById(id);

  if (tender.status !== "pending_review") {
    throw Object.assign(new Error("Tender is not pending review"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(tenderProjects)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
      rejectedBy: actorUserId,
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(tenderProjects.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "tender:reject",
    entityType: "tender_project",
    entityId: id,
    metadata: { reason },
  });

  return updated;
}

// Internal: close tender
export async function closeTender(id: string, actorUserId: string, actorAccountId: string) {
  const tender = await getInternalTenderById(id);

  if (!["published"].includes(tender.status)) {
    throw Object.assign(new Error("Only published tenders can be closed"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(tenderProjects)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(tenderProjects.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "tender:close",
    entityType: "tender_project",
    entityId: id,
  });

  return updated;
}

// Internal: cancel tender
export async function cancelTender(id: string, actorUserId: string, actorAccountId: string) {
  const tender = await getInternalTenderById(id);

  if (["cancelled", "closed"].includes(tender.status)) {
    throw Object.assign(new Error("Tender is already cancelled or closed"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(tenderProjects)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(tenderProjects.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "tender:cancel",
    entityType: "tender_project",
    entityId: id,
  });

  return updated;
}
