import { db } from "../../config/database";
import { proposals, tenderProjects, accounts, users } from "../../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createAuditLog } from "../../utils/audit";
import { CreateProposalInput, UpdateProposalInput } from "./proposals.schema";

// Supplier: submit proposal
export async function createProposal(
  input: CreateProposalInput,
  tenderId: string,
  supplierAccountId: string,
  submittedByUserId: string
) {
  // Verify tender is published
  const [tender] = await db
    .select()
    .from(tenderProjects)
    .where(
      and(
        eq(tenderProjects.id, tenderId),
        eq(tenderProjects.status, "published"),
        isNull(tenderProjects.deletedAt)
      )
    )
    .limit(1);

  if (!tender) {
    throw Object.assign(new Error("Tender not found or not published"), { statusCode: 404 });
  }

  // One proposal per supplier per tender
  const [existing] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(
      and(
        eq(proposals.tenderProjectId, tenderId),
        eq(proposals.supplierAccountId, supplierAccountId),
        isNull(proposals.deletedAt)
      )
    )
    .limit(1);

  if (existing) {
    throw Object.assign(new Error("You have already submitted a proposal for this tender"), { statusCode: 409 });
  }

  const [proposal] = await db
    .insert(proposals)
    .values({
      ...input,
      priceOffer: input.priceOffer?.toString(),
      attachments: input.attachments ?? null,
      tenderProjectId: tenderId,
      supplierAccountId,
      submittedByUserId,
      status: "submitted",
    })
    .returning();

  return proposal;
}

// Supplier: list their own proposals
export async function getSupplierProposals(supplierAccountId: string) {
  return db
    .select()
    .from(proposals)
    .where(and(eq(proposals.supplierAccountId, supplierAccountId), isNull(proposals.deletedAt)));
}

// Supplier: get their own proposal by id
export async function getSupplierProposalById(id: string, supplierAccountId: string) {
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.id, id),
        eq(proposals.supplierAccountId, supplierAccountId),
        isNull(proposals.deletedAt)
      )
    )
    .limit(1);

  if (!proposal) {
    throw Object.assign(new Error("Proposal not found"), { statusCode: 404 });
  }

  return proposal;
}

// Supplier: update their own proposal
export async function updateSupplierProposal(
  id: string,
  input: UpdateProposalInput,
  supplierAccountId: string
) {
  const proposal = await getSupplierProposalById(id, supplierAccountId);

  if (!["submitted"].includes(proposal.status)) {
    throw Object.assign(new Error("Proposal can only be updated when in submitted status"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(proposals)
    .set({
      ...input,
      priceOffer: input.priceOffer?.toString(),
      attachments: input.attachments ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, id))
    .returning();

  return updated;
}

// Supplier: withdraw proposal
export async function withdrawProposal(id: string, supplierAccountId: string) {
  const proposal = await getSupplierProposalById(id, supplierAccountId);

  if (["withdrawn", "accepted"].includes(proposal.status)) {
    throw Object.assign(new Error("Proposal cannot be withdrawn in its current status"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(proposals)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(eq(proposals.id, id))
    .returning();

  return updated;
}

// Buyer: get proposal by id (must belong to their tender)
export async function getBuyerProposalById(id: string, buyerAccountId: string) {
  const [proposal] = await db
    .select({ p: proposals, t: tenderProjects })
    .from(proposals)
    .innerJoin(tenderProjects, eq(proposals.tenderProjectId, tenderProjects.id))
    .where(
      and(
        eq(proposals.id, id),
        eq(tenderProjects.buyerAccountId, buyerAccountId),
        isNull(proposals.deletedAt)
      )
    )
    .limit(1);

  if (!proposal) {
    throw Object.assign(new Error("Proposal not found"), { statusCode: 404 });
  }

  // Fetch supplier account info — hide sensitive fields
  const [supplierAccount] = await db
    .select({
      id: accounts.id,
      companyName: accounts.companyName,
      legalName: accounts.legalName,
      email: accounts.email,
      phone: accounts.phone,
      address: accounts.address,
    })
    .from(accounts)
    .where(eq(accounts.id, proposal.p.supplierAccountId))
    .limit(1);

  // Fetch submitter user info — hide password and internal fields
  const [submittedBy] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, proposal.p.submittedByUserId))
    .limit(1);

  return {
    ...proposal.p,
    tender: proposal.t,
    supplier: supplierAccount ?? null,
    submittedBy: submittedBy ?? null,
  };
}

// Buyer: shortlist proposal
export async function shortlistProposal(id: string, buyerAccountId: string) {
  const proposal = await getBuyerProposalById(id, buyerAccountId);

  if (!["submitted", "under_review"].includes(proposal.status)) {
    throw Object.assign(new Error("Proposal cannot be shortlisted in its current status"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(proposals)
    .set({ status: "shortlisted", updatedAt: new Date() })
    .where(eq(proposals.id, id))
    .returning();

  return updated;
}

// Buyer: reject proposal
export async function rejectProposal(
  id: string,
  buyerAccountId: string,
  actorUserId: string,
  actorAccountId: string
) {
  const proposal = await getBuyerProposalById(id, buyerAccountId);

  if (["rejected", "accepted", "withdrawn"].includes(proposal.status)) {
    throw Object.assign(new Error("Proposal cannot be rejected in its current status"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(proposals)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(proposals.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "proposal:reject",
    entityType: "proposal",
    entityId: id,
  });

  return updated;
}

// Internal: get any proposal by id with full detail
export async function getInternalProposalById(id: string) {
  const [row] = await db
    .select({
      proposal: proposals,
      tender: tenderProjects,
      supplier: {
        id: accounts.id,
        companyName: accounts.companyName,
        legalName: accounts.legalName,
        email: accounts.email,
        phone: accounts.phone,
        address: accounts.address,
      },
      submittedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(proposals)
    .innerJoin(tenderProjects, eq(proposals.tenderProjectId, tenderProjects.id))
    .leftJoin(accounts, eq(proposals.supplierAccountId, accounts.id))
    .leftJoin(users, eq(proposals.submittedByUserId, users.id))
    .where(and(eq(proposals.id, id), isNull(proposals.deletedAt)))
    .limit(1);

  if (!row) {
    throw Object.assign(new Error("Proposal not found"), { statusCode: 404 });
  }

  return {
    ...row.proposal,
    tender: row.tender,
    supplier: row.supplier,
    submittedBy: row.submittedBy,
  };
}

// Buyer: accept proposal
export async function acceptProposal(
  id: string,
  buyerAccountId: string,
  actorUserId: string,
  actorAccountId: string
) {
  const proposal = await getBuyerProposalById(id, buyerAccountId);

  if (!["shortlisted", "under_review"].includes(proposal.status)) {
    throw Object.assign(new Error("Proposal cannot be accepted in its current status"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(proposals)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(proposals.id, id))
    .returning();

  await createAuditLog({
    actorUserId,
    actorAccountId,
    action: "proposal:accept",
    entityType: "proposal",
    entityId: id,
  });

  return updated;
}
