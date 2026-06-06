import { pgTable, uuid, text, pgEnum, timestamp, boolean } from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", ["buyer", "supplier", "internal"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "approved", "rejected", "suspended"]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountType: accountTypeEnum("account_type").notNull(),
  companyName: text("company_name").notNull(),
  legalName: text("legal_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  status: accountStatusEnum("status").notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: uuid("rejected_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
