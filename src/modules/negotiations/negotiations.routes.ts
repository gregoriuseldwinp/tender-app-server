import { FastifyInstance } from "fastify";
import * as negotiationsController from "./negotiations.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { accountStatusMiddleware } from "../../middlewares/account-status.middleware";
import { requireAccountType, requirePermission } from "../../middlewares/permission.middleware";

export async function negotiationsRoutes(fastify: FastifyInstance) {
  // Buyer routes
  const buyerAuth = [
    authMiddleware,
    accountStatusMiddleware,
    requireAccountType("buyer"),
    requirePermission("negotiation:read"),
  ];

  fastify.get("/buyer/proposals/:proposalId/negotiations", {
    preHandler: buyerAuth,
  }, negotiationsController.getBuyerNegotiations);

  fastify.post("/buyer/proposals/:proposalId/negotiations", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("negotiation:create")],
  }, negotiationsController.createBuyerComment);

  // Supplier routes
  const supplierAuth = [
    authMiddleware,
    accountStatusMiddleware,
    requireAccountType("supplier"),
    requirePermission("negotiation:read"),
  ];

  fastify.get("/supplier/proposals/:proposalId/negotiations", {
    preHandler: supplierAuth,
  }, negotiationsController.getSupplierNegotiations);

  fastify.post("/supplier/proposals/:proposalId/negotiations", {
    preHandler: [...supplierAuth.slice(0, 3), requirePermission("negotiation:reply")],
  }, negotiationsController.createSupplierComment);

  // Internal routes
  fastify.get("/internal/proposals/:proposalId/negotiations", {
    preHandler: [
      authMiddleware,
      requireAccountType("internal"),
      requirePermission("negotiation:read"),
    ],
  }, negotiationsController.getInternalNegotiations);
}
