import { FastifyInstance } from "fastify";
import * as rbacController from "./rbac.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireAccountType, requirePermission } from "../../middlewares/permission.middleware";

export async function rbacRoutes(fastify: FastifyInstance) {
  const internalAuth = [authMiddleware, requireAccountType("internal")];

  fastify.get("/internal/roles", {
    preHandler: [...internalAuth, requirePermission("role:create")],
  }, rbacController.getRoles);

  fastify.post("/internal/roles", {
    preHandler: [...internalAuth, requirePermission("role:create")],
  }, rbacController.createRole);

  fastify.patch("/internal/roles/:id", {
    preHandler: [...internalAuth, requirePermission("role:update")],
  }, rbacController.updateRole);

  fastify.delete("/internal/roles/:id", {
    preHandler: [...internalAuth, requirePermission("role:delete")],
  }, rbacController.deleteRole);

  fastify.get("/internal/permissions", {
    preHandler: [...internalAuth, requirePermission("permission:assign")],
  }, rbacController.getPermissions);

  fastify.post("/internal/roles/:id/permissions", {
    preHandler: [...internalAuth, requirePermission("permission:assign")],
  }, rbacController.assignPermissionsToRole);

  fastify.delete("/internal/roles/:id/permissions/:permissionId", {
    preHandler: [...internalAuth, requirePermission("permission:assign")],
  }, rbacController.removePermissionFromRole);

  fastify.post("/internal/users/:id/roles", {
    preHandler: [...internalAuth, requirePermission("permission:assign")],
  }, rbacController.assignRolesToUser);

  fastify.delete("/internal/users/:id/roles/:roleId", {
    preHandler: [...internalAuth, requirePermission("permission:assign")],
  }, rbacController.removeRoleFromUser);
}
