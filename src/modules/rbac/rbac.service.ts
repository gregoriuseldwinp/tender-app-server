import { db } from "../../config/database";
import { roles, permissions, rolePermissions, userRoles } from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { CreateRoleInput, UpdateRoleInput } from "./rbac.schema";

export async function getRoles() {
  return db.select().from(roles);
}

export async function createRole(input: CreateRoleInput) {
  const [existing] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, input.slug))
    .limit(1);

  if (existing) {
    throw Object.assign(new Error("Role slug already exists"), { statusCode: 409 });
  }

  const [role] = await db.insert(roles).values({ ...input, isSystem: false }).returning();
  return role;
}

export async function updateRole(id: string, input: UpdateRoleInput) {
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);

  if (!role) {
    throw Object.assign(new Error("Role not found"), { statusCode: 404 });
  }

  if (role.isSystem) {
    throw Object.assign(new Error("Cannot modify system roles"), { statusCode: 400 });
  }

  const [updated] = await db
    .update(roles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(roles.id, id))
    .returning();

  return updated;
}

export async function deleteRole(id: string) {
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);

  if (!role) {
    throw Object.assign(new Error("Role not found"), { statusCode: 404 });
  }

  if (role.isSystem) {
    throw Object.assign(new Error("Cannot delete system roles"), { statusCode: 400 });
  }

  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  await db.delete(userRoles).where(eq(userRoles.roleId, id));
  await db.delete(roles).where(eq(roles.id, id));
}

export async function getPermissions() {
  return db.select().from(permissions);
}

export async function assignPermissionsToRole(roleId: string, permissionIds: string[]) {
  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!role) {
    throw Object.assign(new Error("Role not found"), { statusCode: 404 });
  }

  const values = permissionIds.map((permissionId) => ({ roleId, permissionId }));
  await db.insert(rolePermissions).values(values).onConflictDoNothing();
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  await db
    .delete(rolePermissions)
    .where(
      and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId))
    );
}

export async function assignRolesToUser(userId: string, roleIds: string[]) {
  const values = roleIds.map((roleId) => ({ userId, roleId }));
  await db.insert(userRoles).values(values).onConflictDoNothing();
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
}
