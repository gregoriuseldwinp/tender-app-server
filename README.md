# Tender App Server

B2B Tender/Procurement System backend built with Fastify, TypeScript, Drizzle ORM, and PostgreSQL.

## Tech Stack

- **Fastify** — HTTP framework
- **TypeScript** — Type safety
- **Drizzle ORM** — Database ORM
- **PostgreSQL** — Database
- **JWT** — Authentication via httpOnly cookies
- **Zod** — Request validation
- **bcryptjs** — Password hashing

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/tender_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
COOKIE_NAME=tender_token
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
```

### 3. Create database & run migrations

```bash
npm run migrate
```

Otomatis membuat database jika belum ada, lalu menjalankan semua migrasi.

### 4. Seed database

```bash
npm run seed
```

Membuat:
- Semua default permissions
- Roles: `super_admin`, `admin`, `reviewer`, `staff`, `buyer_owner`, `buyer_admin`, `buyer_staff`, `supplier_owner`, `supplier_admin`, `supplier_staff`
- Permissions di-assign ke setiap role sesuai akses masing-masing
- Sample accounts siap pakai:

| Role | Email | Password |
|------|-------|----------|
| Internal Super Admin | `admin@tender.internal` | `Admin@123456` |
| Buyer Owner | `andi@majubersama.co.id` | `Buyer@123456` |
| Supplier Owner | `siti@solusiteknologi.co.id` | `Supplier@123456` |

### 5. Run dev server

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`.

---

## Scripts

```bash
npm run dev                  # Development server with hot reload
npm run build                # Compile TypeScript
npm run start                # Production server

npm run migrate              # Auto-create DB + run migrations
npm run reset                # Drop & recreate DB + run migrations

npm run db:generate          # Generate Drizzle migration files
npm run db:migrate           # Run pending migrations
npm run db:push              # Push schema directly (dev only)
npm run db:studio            # Open Drizzle Studio

npm run seed                 # Seed default data
```

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/buyer` | Register akun buyer |
| POST | `/auth/register/supplier` | Register akun supplier |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Data user & account sesi aktif |
| GET | `/auth/me/permissions` | List permission slugs milik user |

### Internal — Account Management

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/internal/accounts/pending` | account:read |
| GET | `/internal/accounts` | account:read |
| GET | `/internal/accounts/:id` | account:read |
| PATCH | `/internal/accounts/:id/approve` | account:approve |
| PATCH | `/internal/accounts/:id/reject` | account:reject |
| PATCH | `/internal/accounts/:id/suspend` | account:approve |

### Internal — RBAC

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/internal/roles` | role:create |
| POST | `/internal/roles` | role:create |
| PATCH | `/internal/roles/:id` | role:update |
| DELETE | `/internal/roles/:id` | role:delete |
| GET | `/internal/permissions` | permission:assign |
| POST | `/internal/roles/:id/permissions` | permission:assign |
| DELETE | `/internal/roles/:id/permissions/:permissionId` | permission:assign |
| POST | `/internal/users/:id/roles` | permission:assign |
| DELETE | `/internal/users/:id/roles/:roleId` | permission:assign |

### Internal — Tender Review

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/internal/tenders` | tender:read |
| GET | `/internal/tenders/pending` | tender:read |
| GET | `/internal/tenders/:id` | tender:read |
| PATCH | `/internal/tenders/:id/approve` | tender:approve |
| PATCH | `/internal/tenders/:id/reject` | tender:reject |
| PATCH | `/internal/tenders/:id/close` | tender:approve |
| PATCH | `/internal/tenders/:id/cancel` | tender:approve |

### Internal — Proposals

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/internal/proposals/:id` | proposal:read |
| GET | `/internal/proposals/:proposalId/negotiations` | negotiation:read |

### Buyer — Tenders

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/buyer/tenders` | tender:read |
| POST | `/buyer/tenders` | tender:create |
| GET | `/buyer/tenders/:id` | tender:read |
| PATCH | `/buyer/tenders/:id` | tender:update |
| DELETE | `/buyer/tenders/:id` | tender:delete |
| GET | `/buyer/tenders/:id/proposals` | proposal:read |

### Buyer — Proposals

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/buyer/proposals/:id` | proposal:read |
| PATCH | `/buyer/proposals/:id/shortlist` | proposal:approve |
| PATCH | `/buyer/proposals/:id/reject` | proposal:reject |
| PATCH | `/buyer/proposals/:id/accept` | proposal:approve |
| GET | `/buyer/proposals/:proposalId/negotiations` | negotiation:read |
| POST | `/buyer/proposals/:proposalId/negotiations` | negotiation:create |

### Supplier — Tenders

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/supplier/tenders` | tender:read |
| GET | `/supplier/tenders/:id` | tender:read |

### Supplier — Proposals

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/supplier/proposals` | proposal:read |
| POST | `/supplier/tenders/:tenderId/proposals` | proposal:create |
| GET | `/supplier/proposals/:id` | proposal:read |
| PATCH | `/supplier/proposals/:id` | proposal:update |
| PATCH | `/supplier/proposals/:id/withdraw` | proposal:update |
| GET | `/supplier/proposals/:proposalId/negotiations` | negotiation:read |
| POST | `/supplier/proposals/:proposalId/negotiations` | negotiation:reply |

---

## Business Flow

1. **Registration** — Buyer/Supplier register → account status `pending`
2. **Approval** — Internal admin approve account → status `approved`
3. **Tender** — Buyer buat tender → status `pending_review`
4. **Review** — Internal admin approve tender → status `published`
5. **Proposal** — Supplier submit proposal ke tender yang published → status `submitted`
6. **Negotiation** — Buyer dan supplier bertukar komentar pada proposal
7. **Decision** — Buyer shortlist / accept / reject proposal

---

## Response Format

Semua response menggunakan format JSON standar:

```json
{ "success": true, "message": "OK", "data": { } }
{ "success": false, "message": "Error message", "errors": { } }
```

---

## Troubleshooting

**Buyer/supplier dapat `Forbidden: Insufficient permissions` setelah di-approve**

Role ada di DB tapi belum punya permissions (biasanya terjadi jika seed lama dipakai):

```bash
npm run db:fix-permissions
```

**Ingin reset DB dari awal**

```bash
npm run reset
npm run seed
```
