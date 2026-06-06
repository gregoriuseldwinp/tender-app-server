import { pgTable, uuid, text, pgEnum, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";
import { tenderProjects } from "./tenders";

export const proposalStatusEnum = pgEnum("proposal_status", [
  "submitted",
  "under_review",
  "shortlisted",
  "rejected",
  "accepted",
  "withdrawn",
]);

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenderProjectId: uuid("tender_project_id").notNull().references(() => tenderProjects.id),
  supplierAccountId: uuid("supplier_account_id").notNull().references(() => accounts.id),
  submittedByUserId: uuid("submitted_by_user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceOffer: decimal("price_offer", { precision: 15, scale: 2 }),
  estimatedDeliveryTime: text("estimated_delivery_time"),
  termsAndConditions: text("terms_and_conditions"),
  attachments: jsonb("attachments"),
  status: proposalStatusEnum("status").notNull().default("submitted"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
