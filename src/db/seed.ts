import { db } from "../config/database";
import { accounts, users, roles, permissions, rolePermissions, userRoles } from "./schema";
import { hashPassword } from "../utils/password";
import { eq, inArray } from "drizzle-orm";

const DEFAULT_PERMISSIONS = [
  { name: "Approve Account", slug: "account:approve" },
  { name: "Reject Account", slug: "account:reject" },
  { name: "Read Account", slug: "account:read" },
  { name: "Create User", slug: "user:create" },
  { name: "Update User", slug: "user:update" },
  { name: "Delete User", slug: "user:delete" },
  { name: "Create Role", slug: "role:create" },
  { name: "Update Role", slug: "role:update" },
  { name: "Delete Role", slug: "role:delete" },
  { name: "Assign Permission", slug: "permission:assign" },
  { name: "Create Tender", slug: "tender:create" },
  { name: "Read Tender", slug: "tender:read" },
  { name: "Update Tender", slug: "tender:update" },
  { name: "Delete Tender", slug: "tender:delete" },
  { name: "Approve Tender", slug: "tender:approve" },
  { name: "Reject Tender", slug: "tender:reject" },
  { name: "Publish Tender", slug: "tender:publish" },
  { name: "Create Proposal", slug: "proposal:create" },
  { name: "Read Proposal", slug: "proposal:read" },
  { name: "Update Proposal", slug: "proposal:update" },
  { name: "Delete Proposal", slug: "proposal:delete" },
  { name: "Approve Proposal", slug: "proposal:approve" },
  { name: "Reject Proposal", slug: "proposal:reject" },
  { name: "Create Negotiation", slug: "negotiation:create" },
  { name: "Read Negotiation", slug: "negotiation:read" },
  { name: "Reply Negotiation", slug: "negotiation:reply" },
  { name: "Read Dashboard", slug: "dashboard:read" },
];

// Permission sets per role slug
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: DEFAULT_PERMISSIONS.map((p) => p.slug),

  admin: [
    "dashboard:read",
    "account:read", "account:approve", "account:reject",
    "user:create", "user:update", "user:delete",
    "role:create", "role:update", "role:delete", "permission:assign",
    "tender:read", "tender:approve", "tender:reject",
    "proposal:read",
    "negotiation:read",
  ],

  reviewer: [
    "dashboard:read",
    "account:read",
    "tender:read",
    "proposal:read",
    "negotiation:read",
  ],

  staff: [
    "dashboard:read",
    "account:read",
    "tender:read",
    "proposal:read",
  ],

  buyer_owner: [
    "dashboard:read",
    "tender:create", "tender:read", "tender:update", "tender:delete",
    "proposal:read", "proposal:approve", "proposal:reject",
    "negotiation:create", "negotiation:read",
  ],

  buyer_admin: [
    "dashboard:read",
    "tender:create", "tender:read", "tender:update",
    "proposal:read", "proposal:approve", "proposal:reject",
    "negotiation:create", "negotiation:read",
  ],

  buyer_staff: [
    "dashboard:read",
    "tender:read",
    "proposal:read",
    "negotiation:read",
  ],

  supplier_owner: [
    "dashboard:read",
    "tender:read",
    "proposal:create", "proposal:read", "proposal:update",
    "negotiation:read", "negotiation:reply",
  ],

  supplier_admin: [
    "dashboard:read",
    "tender:read",
    "proposal:create", "proposal:read", "proposal:update",
    "negotiation:read", "negotiation:reply",
  ],

  supplier_staff: [
    "dashboard:read",
    "tender:read",
    "proposal:read",
    "negotiation:read",
  ],
};

const DEFAULT_ROLES = [
  { accountType: "internal" as const, name: "Super Admin", slug: "super_admin", description: "Full access to all system functions", isSystem: true },
  { accountType: "internal" as const, name: "Admin", slug: "admin", description: "Internal admin", isSystem: true },
  { accountType: "internal" as const, name: "Reviewer", slug: "reviewer", description: "Reviews accounts and tenders", isSystem: true },
  { accountType: "internal" as const, name: "Staff", slug: "staff", description: "Internal staff", isSystem: true },
  { accountType: "buyer" as const, name: "Owner", slug: "buyer_owner", description: "Buyer account owner", isSystem: true },
  { accountType: "buyer" as const, name: "Admin", slug: "buyer_admin", description: "Buyer admin", isSystem: true },
  { accountType: "buyer" as const, name: "Staff", slug: "buyer_staff", description: "Buyer staff", isSystem: true },
  { accountType: "supplier" as const, name: "Owner", slug: "supplier_owner", description: "Supplier account owner", isSystem: true },
  { accountType: "supplier" as const, name: "Admin", slug: "supplier_admin", description: "Supplier admin", isSystem: true },
  { accountType: "supplier" as const, name: "Staff", slug: "supplier_staff", description: "Supplier staff", isSystem: true },
];

async function assignPermissionsToRole(roleId: string, slugs: string[], allPermissions: { id: string; slug: string }[]) {
  const matched = allPermissions
    .filter((p) => slugs.includes(p.slug))
    .map((p) => ({ roleId, permissionId: p.id }));

  if (matched.length > 0) {
    await db.insert(rolePermissions).values(matched).onConflictDoNothing();
  }
}

async function seed() {
  console.log("Seeding database...");

  // 1. Insert permissions
  console.log("Creating permissions...");
  await db.insert(permissions).values(DEFAULT_PERMISSIONS).onConflictDoNothing();
  const allPermissions = await db.select({ id: permissions.id, slug: permissions.slug }).from(permissions);

  // 2. Insert all roles
  console.log("Creating roles...");
  await db.insert(roles).values(DEFAULT_ROLES).onConflictDoNothing();
  const allRoles = await db.select({ id: roles.id, slug: roles.slug }).from(roles);

  // Build slug → id map
  const roleMap = Object.fromEntries(allRoles.map((r) => [r.slug, r.id]));

  // 3. Assign permissions to each role
  console.log("Assigning permissions to roles...");
  for (const [slug, permSlugs] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[slug];
    if (roleId) {
      await assignPermissionsToRole(roleId, permSlugs, allPermissions);
    }
  }

  // 4. Create internal admin account + user
  console.log("Creating internal admin account...");
  const [adminAccount] = await db
    .insert(accounts)
    .values({
      accountType: "internal",
      companyName: "Internal Admin",
      status: "approved",
      approvedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (adminAccount) {
    const [adminUser] = await db
      .insert(users)
      .values({
        accountId: adminAccount.id,
        name: "Super Admin",
        email: "admin@tender.internal",
        passwordHash: await hashPassword("Admin@123456"),
        status: "active",
      })
      .onConflictDoNothing()
      .returning();

    if (adminUser && roleMap["super_admin"]) {
      await db.insert(userRoles).values({ userId: adminUser.id, roleId: roleMap["super_admin"] }).onConflictDoNothing();
    }

    console.log("Admin user created:");
    console.log("  Email: admin@tender.internal");
    console.log("  Password: Admin@123456");
  }

  // 5. Create sample buyer account + user
  console.log("Creating sample buyer account...");
  const [buyerAccount] = await db
    .insert(accounts)
    .values({
      accountType: "buyer",
      companyName: "PT Maju Bersama",
      legalName: "PT Maju Bersama Tbk",
      email: "info@majubersama.co.id",
      phone: "021-55512345",
      address: "Jl. Sudirman No. 10, Jakarta Pusat",
      status: "approved",
      approvedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (buyerAccount) {
    const [buyerUser] = await db
      .insert(users)
      .values({
        accountId: buyerAccount.id,
        name: "Andi Wijaya",
        email: "andi@majubersama.co.id",
        passwordHash: await hashPassword("Buyer@123456"),
        status: "active",
      })
      .onConflictDoNothing()
      .returning();

    if (buyerUser && roleMap["buyer_owner"]) {
      await db.insert(userRoles).values({ userId: buyerUser.id, roleId: roleMap["buyer_owner"] }).onConflictDoNothing();
    }

    console.log("Buyer user created:");
    console.log("  Email: andi@majubersama.co.id");
    console.log("  Password: Buyer@123456");
  }

  // 6. Create sample supplier account + user
  console.log("Creating sample supplier account...");
  const [supplierAccount] = await db
    .insert(accounts)
    .values({
      accountType: "supplier",
      companyName: "CV Solusi Teknologi",
      legalName: "CV Solusi Teknologi Nusantara",
      email: "info@solusiteknologi.co.id",
      phone: "021-77789012",
      address: "Jl. Gatot Subroto No. 45, Jakarta Selatan",
      status: "approved",
      approvedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (supplierAccount) {
    const [supplierUser] = await db
      .insert(users)
      .values({
        accountId: supplierAccount.id,
        name: "Siti Rahma",
        email: "siti@solusiteknologi.co.id",
        passwordHash: await hashPassword("Supplier@123456"),
        status: "active",
      })
      .onConflictDoNothing()
      .returning();

    if (supplierUser && roleMap["supplier_owner"]) {
      await db.insert(userRoles).values({ userId: supplierUser.id, roleId: roleMap["supplier_owner"] }).onConflictDoNothing();
    }

    console.log("Supplier user created:");
    console.log("  Email: siti@solusiteknologi.co.id");
    console.log("  Password: Supplier@123456");
  }

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
