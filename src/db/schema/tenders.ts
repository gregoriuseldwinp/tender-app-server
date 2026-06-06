import { pgTable, uuid, text, boolean, pgEnum, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";

export const tenderStatusEnum = pgEnum("tender_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "closed",
  "cancelled",
]);

export const tenderProjects = pgTable("tender_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerAccountId: uuid("buyer_account_id").notNull().references(() => accounts.id),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  openTender: boolean("open_tender").notNull().default(true),
  needs: text("needs").notNull(),
  category: text("category"),
  budgetEstimate: decimal("budget_estimate", { precision: 15, scale: 2 }),
  deadline: timestamp("deadline"),
  deliveryLocation: text("delivery_location"),
  attachments: jsonb("attachments"),
  status: tenderStatusEnum("status").notNull().default("pending_review"),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: uuid("rejected_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export type TenderProject = typeof tenderProjects.$inferSelect;
export type NewTenderProject = typeof tenderProjects.$inferInsert;
