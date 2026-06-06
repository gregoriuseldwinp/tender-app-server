import { z } from "zod";

export const createRoleSchema = z.object({
  accountType: z.enum(["buyer", "supplier", "internal"]),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9_]+$/),
  description: z.string().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()).min(1),
});

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
