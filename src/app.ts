import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { accountsRoutes } from "./modules/accounts/accounts.routes";
import { rbacRoutes } from "./modules/rbac/rbac.routes";
import { tendersRoutes } from "./modules/tenders/tenders.routes";
import { proposalsRoutes } from "./modules/proposals/proposals.routes";
import { negotiationsRoutes } from "./modules/negotiations/negotiations.routes";

export function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "info" : "warn",
    },
  });

  fastify.register(cors, {
    origin: env.NODE_ENV === "production" ? false : true,
    credentials: true,
  });

  fastify.register(cookie);

  fastify.setErrorHandler(errorHandler);

  fastify.get("/health", async () => ({ status: "ok" }));

  fastify.register(authRoutes);
  fastify.register(accountsRoutes);
  fastify.register(rbacRoutes);
  fastify.register(tendersRoutes);
  fastify.register(proposalsRoutes);
  fastify.register(negotiationsRoutes);

  return fastify;
}
