import { FastifyInstance } from "fastify";
import * as proposalsController from "./proposals.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { accountStatusMiddleware } from "../../middlewares/account-status.middleware";
import { requireAccountType, requirePermission } from "../../middlewares/permission.middleware";

export async function proposalsRoutes(fastify: FastifyInstance) {
  // Supplier routes
  const supplierAuth = [
    authMiddleware,
    accountStatusMiddleware,
    requireAccountType("supplier"),
  ];

  fastify.get("/supplier/proposals", {
    preHandler: [...supplierAuth, requirePermission("proposal:read")],
  }, proposalsController.getSupplierProposals);

  fastify.post("/supplier/tenders/:tenderId/proposals", {
    preHandler: [...supplierAuth, requirePermission("proposal:create")],
  }, proposalsController.createProposal);

  fastify.get("/supplier/proposals/:id", {
    preHandler: [...supplierAuth, requirePermission("proposal:read")],
  }, proposalsController.getSupplierProposalById);

  fastify.patch("/supplier/proposals/:id", {
    preHandler: [...supplierAuth, requirePermission("proposal:update")],
  }, proposalsController.updateSupplierProposal);

  fastify.patch("/supplier/proposals/:id/withdraw", {
    preHandler: [...supplierAuth, requirePermission("proposal:update")],
  }, proposalsController.withdrawProposal);

  // Buyer routes
  const buyerAuth = [
    authMiddleware,
    accountStatusMiddleware,
    requireAccountType("buyer"),
    requirePermission("proposal:read"),
  ];

  fastify.get("/buyer/proposals/:id", { preHandler: buyerAuth }, proposalsController.getBuyerProposalById);

  fastify.patch("/buyer/proposals/:id/shortlist", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("proposal:approve")],
  }, proposalsController.shortlistProposal);

  fastify.patch("/buyer/proposals/:id/reject", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("proposal:reject")],
  }, proposalsController.rejectProposal);

  fastify.patch("/buyer/proposals/:id/accept", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("proposal:approve")],
  }, proposalsController.acceptProposal);

  // Internal routes
  fastify.get("/internal/proposals/:id", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("proposal:read")],
  }, proposalsController.getInternalProposalById);
}
