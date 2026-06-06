import { FastifyInstance } from "fastify";
import * as authController from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/register/buyer", authController.registerBuyer);
  fastify.post("/auth/register/supplier", authController.registerSupplier);
  fastify.post("/auth/login", authController.login);
  fastify.post("/auth/logout", { preHandler: [authMiddleware] }, authController.logout);
  fastify.get("/auth/me", { preHandler: [authMiddleware] }, authController.getMe);
  fastify.get("/auth/me/permissions", { preHandler: [authMiddleware] }, authController.getMyPermissions);
}
