import { FastifyInstance } from "fastify";
import * as tendersController from "./tenders.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { accountStatusMiddleware } from "../../middlewares/account-status.middleware";
import { requireAccountType, requirePermission } from "../../middlewares/permission.middleware";

export async function tendersRoutes(fastify: FastifyInstance) {
  // Buyer routes
  const buyerAuth = [
    authMiddleware,
    accountStatusMiddleware,
    requireAccountType("buyer"),
    requirePermission("tender:read"),
  ];

  fastify.get("/buyer/tenders", { preHandler: buyerAuth }, tendersController.getBuyerTenders);

  fastify.post("/buyer/tenders", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("tender:create")],
  }, tendersController.createTender);

  fastify.get("/buyer/tenders/:id", { preHandler: buyerAuth }, tendersController.getBuyerTenderById);

  fastify.patch("/buyer/tenders/:id", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("tender:update")],
  }, tendersController.updateBuyerTender);

  fastify.delete("/buyer/tenders/:id", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("tender:delete")],
  }, tendersController.deleteBuyerTender);

  fastify.get("/buyer/tenders/:id/proposals", {
    preHandler: [...buyerAuth.slice(0, 3), requirePermission("proposal:read")],
  }, tendersController.getBuyerTenderProposals);

  // Supplier routes
  const supplierAuth = [
    authMiddleware,
    accountStatusMiddleware,
    requireAccountType("supplier"),
    requirePermission("tender:read"),
  ];

  fastify.get("/supplier/tenders", { preHandler: supplierAuth }, tendersController.getPublishedTenders);
  fastify.get("/supplier/tenders/:id", { preHandler: supplierAuth }, tendersController.getPublishedTenderById);

  // Internal routes
  const internalAuth = [
    authMiddleware,
    requireAccountType("internal"),
    requirePermission("tender:read"),
  ];

  fastify.get("/internal/tenders", { preHandler: internalAuth }, tendersController.getAllTenders);
  fastify.get("/internal/tenders/pending", { preHandler: internalAuth }, tendersController.getPendingTenders);
  fastify.get("/internal/tenders/:id", { preHandler: internalAuth }, tendersController.getInternalTenderById);

  fastify.patch("/internal/tenders/:id/approve", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("tender:approve")],
  }, tendersController.approveTender);

  fastify.patch("/internal/tenders/:id/reject", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("tender:reject")],
  }, tendersController.rejectTender);

  fastify.patch("/internal/tenders/:id/close", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("tender:approve")],
  }, tendersController.closeTender);

  fastify.patch("/internal/tenders/:id/cancel", {
    preHandler: [authMiddleware, requireAccountType("internal"), requirePermission("tender:approve")],
  }, tendersController.cancelTender);
}
