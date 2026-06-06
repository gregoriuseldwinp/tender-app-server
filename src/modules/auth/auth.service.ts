import { db } from "../../config/database";
import { accounts, users, roles, userRoles, rolePermissions, permissions } from "../../db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { RegisterBuyerInput, RegisterSupplierInput, LoginInput } from "./auth.schema";

export async function registerBuyer(input: RegisterBuyerInput) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.ownerEmail))
    .limit(1);

  if (existing.length > 0) {
    throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
  }

  const [account] = await db
    .insert(accounts)
    .values({
      accountType: "buyer",
      companyName: input.companyName,
      legalName: input.legalName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      status: "pending",
    })
    .returning();

  const passwordHash = await hashPassword(input.ownerPassword);

  const [user] = await db
    .insert(users)
    .values({
      accountId: account.id,
      name: input.ownerName,
      email: input.ownerEmail,
      passwordHash,
      status: "active",
    })
    .returning();

  // Assign buyer_owner role
  const [buyerOwnerRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "buyer_owner"))
    .limit(1);

  if (buyerOwnerRole) {
    await db.insert(userRoles).values({ userId: user.id, roleId: buyerOwnerRole.id });
  }

  return { accountId: account.id, userId: user.id };
}

export async function registerSupplier(input: RegisterSupplierInput) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.ownerEmail))
    .limit(1);

  if (existing.length > 0) {
    throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
  }

  const [account] = await db
    .insert(accounts)
    .values({
      accountType: "supplier",
      companyName: input.companyName,
      legalName: input.legalName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      status: "pending",
    })
    .returning();

  const passwordHash = await hashPassword(input.ownerPassword);

  const [user] = await db
    .insert(users)
    .values({
      accountId: account.id,
      name: input.ownerName,
      email: input.ownerEmail,
      passwordHash,
      status: "active",
    })
    .returning();

  // Assign supplier_owner role
  const [supplierOwnerRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "supplier_owner"))
    .limit(1);

  if (supplierOwnerRole) {
    await db.insert(userRoles).values({ userId: user.id, roleId: supplierOwnerRole.id });
  }

  return { accountId: account.id, userId: user.id };
}

export async function login(input: LoginInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, input.email), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }

  if (user.status === "inactive" || user.status === "suspended") {
    throw Object.assign(new Error("User account is not active"), { statusCode: 403 });
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }

  const [account] = await db
    .select({ accountType: accounts.accountType, status: accounts.status })
    .from(accounts)
    .where(eq(accounts.id, user.accountId))
    .limit(1);

  if (!account) {
    throw Object.assign(new Error("Account not found"), { statusCode: 404 });
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  const token = signToken({
    userId: user.id,
    accountId: user.accountId,
    accountType: account.accountType,
  });

  const { passwordHash: _, ...safeUser } = user;

  return {
    token,
    user: safeUser,
    account: { accountType: account.accountType, status: account.status },
  };
}

export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      accountId: users.accountId,
      name: users.name,
      email: users.email,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, user.accountId))
    .limit(1);

  return { user, account };
}

export async function getMyPermissions(userId: string) {
  const userRoleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  if (userRoleRows.length === 0) {
    return { permissions: [] };
  }

  const roleIds = userRoleRows.map((r) => r.roleId);

  const rpRows = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(inArray(rolePermissions.roleId, roleIds));

  if (rpRows.length === 0) {
    return { permissions: [] };
  }

  const permissionIds = [...new Set(rpRows.map((r) => r.permissionId))];

  const permissionRows = await db
    .select({ slug: permissions.slug })
    .from(permissions)
    .where(inArray(permissions.id, permissionIds));

  return { permissions: permissionRows.map((p) => p.slug) };
}
