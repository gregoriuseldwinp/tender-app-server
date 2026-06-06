import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../config/database";
import { userRoles, rolePermissions, permissions } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

export function requirePermission(permissionSlug: string) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request.user;

    const userRoleRows = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    if (userRoleRows.length === 0) {
      return reply.status(403).send({ success: false, message: "Forbidden: No roles assigned" });
    }

    const roleIds = userRoleRows.map((r) => r.roleId);

    const rpRows = await db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));

    if (rpRows.length === 0) {
      return reply.status(403).send({ success: false, message: "Forbidden: Insufficient permissions" });
    }

    const permissionIds = rpRows.map((r) => r.permissionId);

    const matchedPerms = await db
      .select({ slug: permissions.slug })
      .from(permissions)
      .where(inArray(permissions.id, permissionIds));

    const hasPermission = matchedPerms.some((p) => p.slug === permissionSlug);

    if (!hasPermission) {
      return reply.status(403).send({
        success: false,
        message: `Forbidden: Missing permission '${permissionSlug}'`,
      });
    }
  };
}

export function requireAccountType(...types: ("buyer" | "supplier" | "internal")[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!types.includes(request.user.accountType)) {
      return reply.status(403).send({
        success: false,
        message: `Forbidden: This endpoint is restricted to ${types.join(", ")} accounts`,
      });
    }
  };
}
