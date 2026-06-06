import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../config/database";
import { accounts } from "../db/schema";
import { eq } from "drizzle-orm";

export async function accountStatusMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const { accountId, accountType } = request.user;

  // Internal accounts are always considered active
  if (accountType === "internal") return;

  const [account] = await db
    .select({ status: accounts.status })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) {
    return reply.status(403).send({ success: false, message: "Account not found" });
  }

  if (account.status === "pending") {
    return reply.status(403).send({
      success: false,
      message: "Account is pending approval. Please wait for admin review.",
    });
  }

  if (account.status === "rejected") {
    return reply.status(403).send({
      success: false,
      message: "Account has been rejected. Please contact support.",
    });
  }

  if (account.status === "suspended") {
    return reply.status(403).send({
      success: false,
      message: "Account has been suspended. Please contact support.",
    });
  }
}
