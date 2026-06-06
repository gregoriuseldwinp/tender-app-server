import { pgTable, uuid, text, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { proposals } from "./proposals";
import { tenderProjects } from "./tenders";
import { users } from "./users";
import { accounts } from "./accounts";
import { accountTypeEnum } from "./accounts";

export const proposalNegotiationComments = pgTable("proposal_negotiation_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => proposals.id),
  tenderProjectId: uuid("tender_project_id").notNull().references(() => tenderProjects.id),
  senderUserId: uuid("sender_user_id").notNull().references(() => users.id),
  senderAccountId: uuid("sender_account_id").notNull().references(() => accounts.id),
  senderAccountType: accountTypeEnum("sender_account_type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export type ProposalNegotiationComment = typeof proposalNegotiationComments.$inferSelect;
export type NewProposalNegotiationComment = typeof proposalNegotiationComments.$inferInsert;
