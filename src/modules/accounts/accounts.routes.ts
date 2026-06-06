import { FastifyInstance } from "fastify";
import * as accountsController from "./accounts.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireAccountType, requirePermission } from "../../middlewares/permission.middleware";

export async function accountsRoutes(fastify: FastifyInstance) {
  const preHandler = [
    authMiddleware,
    requireAccountType("internal"),
    requirePermission("account:read"),
  ];

  fastify.get("/internal/accounts/pending", { preHandler }, accountsController.getPendingAccounts);
  fastify.get("/internal/accounts", { preHandler }, accountsController.getAllAccounts);
  fastify.get("/internal/accounts/:id", { preHandler }, accountsController.getAccountById);

  fastify.patch("/internal/accounts/:id/approve", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("account:approve")],
  }, accountsController.approveAccount);

  fastify.patch("/internal/accounts/:id/reject", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("account:reject")],
  }, accountsController.rejectAccount);

  fastify.patch("/internal/accounts/:id/suspend", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("account:approve")],
  }, accountsController.suspendAccount);
}
