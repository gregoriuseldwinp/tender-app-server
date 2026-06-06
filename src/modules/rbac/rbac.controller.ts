import { FastifyRequest, FastifyReply } from "fastify";
import * as rbacService from "./rbac.service";
import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
  assignRolesSchema,
} from "./rbac.schema";
import { successResponse } from "../../utils/response";

export async function getRoles(_request: FastifyRequest, reply: FastifyReply) {
  const data = await rbacService.getRoles();
  return reply.send(successResponse(data));
}

export async function createRole(request: FastifyRequest, reply: FastifyReply) {
  const input = createRoleSchema.parse(request.body);
  const data = await rbacService.createRole(input);
  return reply.status(201).send(successResponse(data, "Role created successfully"));
}

export async function updateRole(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const input = updateRoleSchema.parse(request.body);
  const data = await rbacService.updateRole(id, input);
  return reply.send(successResponse(data, "Role updated successfully"));
}

export async function deleteRole(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await rbacService.deleteRole(id);
  return reply.send(successResponse(null, "Role deleted successfully"));
}

export async function getPermissions(_request: FastifyRequest, reply: FastifyReply) {
  const data = await rbacService.getPermissions();
  return reply.send(successResponse(data));
}

export async function assignPermissionsToRole(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { permissionIds } = assignPermissionsSchema.parse(request.body);
  await rbacService.assignPermissionsToRole(id, permissionIds);
  return reply.send(successResponse(null, "Permissions assigned successfully"));
}

export async function removePermissionFromRole(request: FastifyRequest, reply: FastifyReply) {
  const { id, permissionId } = request.params as { id: string; permissionId: string };
  await rbacService.removePermissionFromRole(id, permissionId);
  return reply.send(successResponse(null, "Permission removed successfully"));
}

export async function assignRolesToUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { roleIds } = assignRolesSchema.parse(request.body);
  await rbacService.assignRolesToUser(id, roleIds);
  return reply.send(successResponse(null, "Roles assigned successfully"));
}

export async function removeRoleFromUser(request: FastifyRequest, reply: FastifyReply) {
  const { id, roleId } = request.params as { id: string; roleId: string };
  await rbacService.removeRoleFromUser(id, roleId);
  return reply.send(successResponse(null, "Role removed successfully"));
}
