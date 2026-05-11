# SA-LMS SKILL.md — CyberShield Learning Management System
## Master Development Guide for Claude Code

> **YOU ARE THE SENIOR DEVELOPER.** Read this entire file before writing a single line of code. Every decision here was made deliberately. When you encounter an error, consult Section 14 (Error Resolution) before attempting a fix. When you are unsure about architecture, re-read the relevant section. This file is your constitution.

---

## TABLE OF CONTENTS

1. [Project Identity & Mission](#1-project-identity--mission)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Complete Technology Stack](#3-complete-technology-stack)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Database Schema — Complete Specification](#5-database-schema--complete-specification)
6. [Environment Setup](#6-environment-setup)
7. [Backend Development Guide](#7-backend-development-guide)
8. [Frontend Development Guide](#8-frontend-development-guide)
9. [Business Logic Engines](#9-business-logic-engines)
10. [API Specification](#10-api-specification)
11. [Authentication & Security](#11-authentication--security)
12. [Background Job Workers](#12-background-job-workers)
13. [Testing Standards](#13-testing-standards)
14. [Error Resolution Encyclopedia](#14-error-resolution-encyclopedia)
15. [Deployment Guide](#15-deployment-guide)
16. [Feature Implementation Checklists](#16-feature-implementation-checklists)
17. [Code Patterns Reference](#17-code-patterns-reference)
18. [Non-Negotiable Rules](#18-non-negotiable-rules)

---

## 1. PROJECT IDENTITY & MISSION

### 1.1 What Is SA-LMS

SA-LMS (CyberShield Learning Management System) is a **multi-tenant, compliance-driven, certificate-issuing Learning Management System** built for a Managed Security Service Provider (MSSP) whose clients must satisfy regulatory cybersecurity training mandates (CRF, ISO 27001, NESA, SAMA, NCA-ECC).

**Core mission:** Automatically enroll employees in the right training, track every step, issue verifiable certificates, and produce one-click audit reports.

### 1.2 Three User Roles — Never Confuse Them

| Role | Who | Data Scope | Portal Path |
|------|-----|-----------|-------------|
| `super_admin` | MSSP internal team | GLOBAL — all tenants, all data | `/super-admin/*` |
| `tenant_admin` / `ciso` | Client org's IT/Security lead | TENANT-SCOPED — own org only | `/tenant/*` |
| `student` | Client org's employee OR individual learner | USER-SCOPED — own courses only | `/student/*` |

### 1.3 The Five Core Value Propositions

1. **Compliance → Course Auto-Mapping**: Assign a compliance framework to a tenant → all matching courses auto-enroll to all employees
2. **Certificate Engine**: Verifiable PDF certificates with unique serial numbers issued on course completion
3. **Risk Dashboard**: Real-time KPIs and KRIs showing who is trained, who is at risk, what is overdue
4. **Audit-Ready Reports**: One-click export of certified users and audit logs
5. **Role-Specific Training**: CRF 1.5.5 compliance — IT, CISO, Dev, Risk, Privileged, Executive each get tailored content

### 1.4 CRF Compliance Mapping

| Control | Level | Platform Feature |
|---------|-------|-----------------|
| CRF 1.5.1 | CL1 | Configurable training goals, scope, frequency per tenant |
| CRF 1.5.2 | CL1 | Course library: phishing, social engineering, email security, clear desk |
| CRF 1.5.3 | CL2 | Quiz/assessment engine with pass scores and stored results |
| CRF 1.5.4 | CL2 | Training triggers: new user, annual refresh, role change |
| CRF 1.5.5 | CL2 | Role-category course mapping (IT/Cybersecurity/Dev/Risk/Executive) |
| CRF 1.5.6 | CL3 | Analytics dashboards, trend reports, effectiveness measurement |

---

## 2. SYSTEM ARCHITECTURE OVERVIEW

### 2.1 Architectural Pattern

**Layered Monolith with Async Workers** — NOT microservices. Reasons:
- Team size does not justify microservice operational overhead
- Heavy operations (PDF generation, video processing, bulk email) are async workers via BullMQ
- Clean service boundaries mean extraction to microservices is possible later
- A well-structured monolith ships faster and is easier to debug

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENTS (Browser / Mobile)                        │
│     Super Admin SPA  │  Tenant Admin SPA  │  Student SPA            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / TLS 1.3
┌──────────────────────────────▼──────────────────────────────────────┐
│              CloudFront CDN — Static Assets + HLS Video              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│         NGINX — Rate Limiting │ SSL Termination │ Load Balancing      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│              API — Node.js 20 + Express 5 (Cluster Mode)             │
│   Auth MW → RBAC MW → Validate MW → Route → Service → Repository    │
└──────┬──────────────────────┬──────────────────────┬────────────────┘
       │                      │                      │
┌──────▼──────┐    ┌──────────▼──────┐    ┌─────────▼──────┐
│PostgreSQL 16│    │  Redis 7        │    │  S3 / MinIO    │
│ (RLS + RDS) │    │  Cache + Queue  │    │  Files + Certs │
└─────────────┘    └──────────┬──────┘    └────────────────┘
                              │ BullMQ
┌─────────────────────────────▼───────────────────────────────────────┐
│                        ASYNC WORKERS                                  │
│  Enrollment │ Certificate │ Email │ Report │ Video │ Health-Score    │
└──────┬──────────────┬──────────────┬─────────────┬──────────────────┘
       │              │              │             │
   PostgreSQL      AWS S3       AWS SES        Puppeteer
                               (Email)         (PDF)
```

### 2.3 Backend Layered Architecture (STRICT — no skipping layers)

```
Layer 1: Route Handler     → Parse req, call service, return res. MAX 20 lines.
Layer 2: Middleware        → Auth, RBAC, Zod validation, rate limit, RLS setter
Layer 3: Service Layer     → ALL business logic. Orchestrates repositories + queues
Layer 4: Repository Layer  → ALL database operations via Prisma. Nothing else.
Layer 5: Job Workers       → BullMQ async: certificates, emails, enrollment, reports
```

**RULE**: No business logic in route handlers. No database calls in services (use repositories). No HTTP objects (req/res) in services. Violating this will be caught in code review.

### 2.4 Multi-Tenancy Model

- **Shared database, row-level isolation** via PostgreSQL Row-Level Security (RLS)
- Every user-data table has `tenant_id UUID` column
- RLS policies filter on `current_setting('app.current_tenant_id')`
- Application middleware ALSO enforces tenant scope (two layers — both must hold)
- `super_admin` users bypass RLS; all other roles are tenant-scoped

---

## 3. COMPLETE TECHNOLOGY STACK

### 3.1 Frontend

| Technology | Version | Purpose | Why |
|-----------|---------|---------|-----|
| React | 18.3 | UI framework | Concurrent features, massive ecosystem |
| TypeScript | 5.4 | Language | Type safety — MANDATORY, no `any` |
| Tailwind CSS | 3.4 | Styling | Utility-first, consistent tokens |
| Zustand | 4.x | Global state | Auth store, UI state |
| React Query (TanStack) | 5.x | Server state | Caching, dedup, background refresh |
| React Router | 6.22 | Routing | Nested routes, loaders |
| Vite | 5.2 | Build tool | 100x faster than Webpack for DX |
| Axios | 1.x | HTTP client | Interceptors for auth + refresh |
| HLS.js | 1.x | Video player | Adaptive bitrate streaming |
| React PDF | 3.x | PDF viewer | Course notes display |
| Recharts | 2.x | Charts | Dashboard KPIs/KRIs |
| React Hook Form + Zod | latest | Forms | Type-safe form validation |
| DOMPurify | 3.x | Sanitization | Rich text XSS prevention |

### 3.2 Backend

| Technology | Version | Purpose | Why |
|-----------|---------|---------|-----|
| Node.js | 20 LTS | Runtime | LTS, performance, ecosystem |
| Express | 5.x | Framework | Minimal, well-understood |
| TypeScript | 5.4 | Language | Shared types with frontend |
| Prisma | 5.12 | ORM | Type-safe queries, migrations |
| Zod | 3.22 | Validation | Schema = TypeScript type |
| BullMQ | 5.x | Job queue | Redis-backed, retry, priority |
| jsonwebtoken | 9.x | JWT signing | RS256 for access tokens |
| speakeasy | 2.x | TOTP/MFA | Google Authenticator compat |
| passport-saml | 3.x | SAML 2.0 | Enterprise SSO |
| openid-client | 5.x | OIDC | OAuth2/OpenID SSO |
| argon2 | 0.31 | Password hashing | Argon2id — better than bcrypt |
| helmet | 7.x | Security headers | HSTS, CSP, X-Frame |
| Pino | 8.x | Logging | Structured JSON logs |
| Multer | 1.x | File uploads | Multipart form handling |
| sharp | 0.33 | Image processing | Logo resizing/optimization |
| node-cron | 3.x | Scheduled jobs | Daily compliance health scores |

### 3.3 Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 16 | Primary database (RLS for multi-tenancy) |
| PgBouncer | 1.22 | Connection pooling (CRITICAL for production) |
| Redis | 7.2 | Sessions, cache, BullMQ backend |
| AWS S3 / MinIO | latest | Object storage: video, PDFs, certs, logos |
| Puppeteer | 22.x | Headless Chrome → Certificate PDF generation |
| FFmpeg | 6.x | HLS video transcoding |
| Docker + Compose | latest | Containerization |
| NGINX | 1.25 | Reverse proxy, SSL, rate limiting |
| GitHub Actions | — | CI/CD |
| Turborepo | 2.x | Monorepo build orchestration |
| Prometheus + Grafana | latest | Metrics and monitoring |

### 3.4 Testing

| Tool | Purpose |
|------|---------|
| Vitest | Unit + integration tests (replaces Jest — Vite-native) |
| Supertest | HTTP integration testing |
| Playwright | E2E browser testing |
| k6 | Load testing |
| Factory Bot pattern | Test data factories |

---

## 4. MONOREPO STRUCTURE

### 4.1 Root Layout

```
sa-lms/                          ← Turborepo monorepo root
├── apps/
│   ├── api/                     ← Express backend
│   ├── web/                     ← React frontend (all 3 role portals)
│   └── pdf-worker/              ← Puppeteer PDF service (separate process)
├── packages/
│   ├── types/                   ← Shared TypeScript types + Zod schemas
│   ├── database/                ← Prisma schema + migrations + seed
│   └── config/                  ← Shared ESLint, TS, Tailwind configs
├── docker-compose.yml           ← Local dev infrastructure
├── docker-compose.prod.yml      ← Production overrides
├── turbo.json                   ← Turborepo pipeline config
├── package.json                 ← Root workspace config (pnpm)
└── .env.example                 ← Root env template
```

### 4.2 API Structure (apps/api/src/)

```
apps/api/src/
├── app.ts                       ← Express app factory (export app, not server)
├── server.ts                    ← Cluster mode entry: fork = CPU cores
├── routes/
│   ├── index.ts                 ← Mount all routers + versioning
│   ├── auth.routes.ts
│   ├── tenants.routes.ts
│   ├── users.routes.ts
│   ├── courses.routes.ts
│   ├── modules.routes.ts
│   ├── lessons.routes.ts
│   ├── enrollments.routes.ts
│   ├── quizzes.routes.ts
│   ├── certificates.routes.ts
│   ├── compliance.routes.ts
│   ├── audit.routes.ts
│   └── platform.routes.ts
├── middleware/
│   ├── authenticate.ts          ← JWT verify → req.user
│   ├── authorize.ts             ← RBAC role + tenant scope
│   ├── validate.ts              ← Zod schema validation factory
│   ├── rate-limit.ts            ← Per-route Redis rate limiters
│   ├── set-rls.ts               ← Set PostgreSQL RLS session vars
│   ├── request-log.ts           ← Pino request logger
│   ├── upload.ts                ← Multer config for different upload types
│   └── error-handler.ts        ← Global error handler (LAST middleware)
├── services/
│   ├── auth.service.ts
│   ├── tenant.service.ts
│   ├── user.service.ts
│   ├── course.service.ts
│   ├── module.service.ts
│   ├── lesson.service.ts
│   ├── enrollment.service.ts
│   ├── compliance.service.ts
│   ├── completion.service.ts    ← Course completion detection
│   ├── certificate.service.ts   ← Certificate record management
│   ├── quiz.service.ts
│   ├── dashboard.service.ts
│   ├── audit.service.ts
│   └── platform.service.ts
├── repositories/
│   ├── base.repository.ts       ← RLS context setter, common patterns
│   ├── tenant.repository.ts
│   ├── user.repository.ts
│   ├── course.repository.ts
│   ├── enrollment.repository.ts
│   ├── certificate.repository.ts
│   ├── quiz.repository.ts
│   └── audit.repository.ts
├── workers/
│   ├── enrollment.worker.ts     ← Auto-enrollment processing
│   ├── certificate.worker.ts    ← PDF generation + S3 upload
│   ├── email.worker.ts          ← Email dispatch
│   ├── report.worker.ts         ← Export generation
│   ├── video.worker.ts          ← HLS transcoding job polling
│   └── health-score.worker.ts  ← Daily compliance score recalculation
├── queues/
│   └── index.ts                 ← BullMQ queue definitions + typed job interfaces
├── lib/
│   ├── prisma.ts                ← Prisma client singleton
│   ├── redis.ts                 ← Redis client singleton
│   ├── s3.ts                    ← S3 client + presign helpers
│   ├── mailer.ts                ← Nodemailer transport
│   ├── crypto.ts                ← Argon2, SHA-256, AES-256-GCM helpers
│   ├── logger.ts                ← Pino logger config
│   └── app-error.ts             ← AppError class
└── types/
    └── express.d.ts             ← Augment Express Request with req.user
```

### 4.3 Web Structure (apps/web/src/)

```
apps/web/src/
├── features/
│   ├── auth/
│   │   ├── components/          LoginForm, MFASetup, MFAVerify, SSOButton
│   │   ├── hooks/               useAuth, useMFA, useSSO
│   │   ├── api/                 auth.api.ts
│   │   └── types/               auth.types.ts
│   ├── super-admin/
│   │   ├── dashboard/           SADashboard, KPICard, RiskAlerts, CompletionChart
│   │   ├── tenants/             TenantList, TenantForm, TenantDetail, ComplianceAssignModal
│   │   ├── users/               UserList, UserForm, CourseAssignModal, BulkImport
│   │   ├── courses/             CourseList, CourseWizard (3-step), CurriculumBuilder, QuizBuilder
│   │   ├── compliance/          ComplianceList, ComplianceForm
│   │   ├── certificates/        TemplateList, TemplateUpload, CertAssign
│   │   ├── audit-logs/          AuditLogTable, ExportButton
│   │   ├── platform-health/     MetricsPanel, ServiceStatusGrid
│   │   └── settings/            SettingsTabs (Platform, Email, Auth, SSO, Notifications)
│   ├── tenant-admin/
│   │   ├── dashboard/           RiskDashboard, ComplianceCoverage, OverdueAlert
│   │   ├── users/               UserImport (CSV), UserTable, RiskUsers, CertifiedUsers
│   │   └── settings/            TenantProfile, LogoUpload, SSOConfig, NotificationPrefs
│   └── student/
│       ├── courses/             CourseGrid, CourseCard, ProgressBadge
│       ├── viewer/              CourseViewer, LessonTree, VideoPlayer, PDFViewer
│       ├── quiz/                QuizModal, Timer, QuestionRenderer, ScoreResult
│       └── certificates/        CertificateGallery, CertificateCard, VerifyShare
├── components/                  ← Shared: Button, Modal, Table, Badge, Spinner, etc.
├── hooks/                       ← useDebounce, usePagination, usePermissions, useToast
├── stores/
│   ├── auth.store.ts            ← Zustand: user, accessToken, role
│   └── ui.store.ts              ← Sidebar open, theme, notifications
├── lib/
│   ├── api-client.ts            ← Axios + interceptors (token refresh)
│   └── query-client.ts          ← React Query client config
└── router/
    ├── index.tsx                ← Root router
    ├── guards.tsx               ← ProtectedRoute, RoleGuard
    └── routes.ts                ← Route path constants (NEVER hardcode paths)
```

### 4.4 Shared Types Package (packages/types/)

```typescript
// packages/types/src/index.ts — export everything from here

// All Zod schemas (single source of truth)
export * from './schemas/user.schema';
export * from './schemas/tenant.schema';
export * from './schemas/course.schema';
export * from './schemas/enrollment.schema';
export * from './schemas/certificate.schema';

// All enums (match PostgreSQL ENUMs exactly)
export * from './enums';

// API response types
export * from './api-responses';
```

**RULE**: Define a Zod schema first. Export both `schema` and `z.infer<typeof schema>` as the TypeScript type. Use these in BOTH frontend and backend. Never duplicate type definitions.

---

## 5. DATABASE SCHEMA — COMPLETE SPECIFICATION

### 5.1 Design Rules

1. **All PKs are UUIDs** — `DEFAULT gen_random_uuid()`. Never sequential integers.
2. **Soft deletes** — All entities have `deleted_at TIMESTAMPTZ NULL`. Never hard delete.
3. **Timestamps** — `created_at` and `updated_at` on every table.
4. **tenant_id everywhere** — Every user-data table has `tenant_id UUID FK → tenants`.
5. **PostgreSQL ENUMs** — Use native ENUM types. Validates at DB level.
6. **No triggers for business logic** — All logic in Service Layer.
7. **Idempotent enrollments** — `UNIQUE(user_id, course_id)` + `ON CONFLICT DO NOTHING`.

### 5.2 Create ENUM Types First (migration 0001)

```sql
CREATE TYPE tenant_status     AS ENUM ('active','inactive','suspended','trial');
CREATE TYPE user_role         AS ENUM ('super_admin','tenant_admin','ciso','student');
CREATE TYPE job_cat           AS ENUM ('general','it','cybersecurity','dev','risk','privileged','executive');
CREATE TYPE user_status       AS ENUM ('active','inactive','invited','locked','sso_only');
CREATE TYPE course_status     AS ENUM ('draft','published','archived');
CREATE TYPE lesson_type       AS ENUM ('video','pdf_notes','quiz','assessment');
CREATE TYPE question_type     AS ENUM ('single_choice','multi_choice','true_false');
CREATE TYPE enrollment_type   AS ENUM ('manual','auto_compliance','individual');
CREATE TYPE enrollment_status AS ENUM ('not_started','in_progress','completed','failed','expired');
CREATE TYPE attempt_status    AS ENUM ('in_progress','submitted','expired');
CREATE TYPE progress_status   AS ENUM ('not_started','in_progress','completed');
```

### 5.3 Prisma Schema (packages/database/prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String        @db.VarChar(255)
  slug             String        @unique @db.VarChar(100)
  domain           String?       @unique @db.VarChar(255)
  logoUrl          String?       @map("logo_url")
  status           String        @default("active")        // tenant_status enum
  maxUsers         Int           @default(-1) @map("max_users")
  subscriptionPlan String        @default("starter") @map("subscription_plan") @db.VarChar(50)
  subscriptionEnds DateTime?     @map("subscription_ends") @db.Date
  mfaRequired      Boolean       @default(false) @map("mfa_required")
  ssoEnabled       Boolean       @default(false) @map("sso_enabled")
  ssoProvider      String?       @map("sso_provider") @db.VarChar(50)
  ssoConfig        Json?         @map("sso_config")        // Encrypted in application layer
  trainingTriggers Json?         @map("training_triggers") // {new_user:bool, annual:bool, days:int}
  settings         Json?
  createdBy        String?       @map("created_by") @db.Uuid
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")
  deletedAt        DateTime?     @map("deleted_at")

  users               User[]
  complianceMappings  TenantComplianceMapping[]
  enrollments         Enrollment[]
  certificates        Certificate[]

  @@map("tenants")
}

model User {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId          String?   @map("tenant_id") @db.Uuid
  email             String    @unique @db.VarChar(255)
  emailVerified     Boolean   @default(false) @map("email_verified")
  passwordHash      String?   @map("password_hash")
  firstName         String    @map("first_name") @db.VarChar(100)
  lastName          String    @map("last_name") @db.VarChar(100)
  phone             String?   @db.VarChar(30)
  employeeId        String?   @map("employee_id") @db.VarChar(100)
  department        String?   @db.VarChar(150)
  role              String    // user_role enum
  jobRoleCategory   String    @default("general") @map("job_role_category") // job_cat enum
  status            String    @default("active") // user_status enum
  mfaEnabled        Boolean   @default(false) @map("mfa_enabled")
  mfaSecret         String?   @map("mfa_secret") // AES-256-GCM encrypted
  mfaRecoveryCodes  String[]  @map("mfa_recovery_codes")
  ssoSubject        String?   @map("sso_subject")
  lastLoginAt       DateTime? @map("last_login_at")
  loginAttempts     Int       @default(0) @map("login_attempts")
  lockedUntil       DateTime? @map("locked_until")
  passwordChangedAt DateTime? @map("password_changed_at")
  invitedAt         DateTime? @map("invited_at")
  invitedBy         String?   @map("invited_by") @db.Uuid
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  tenant      Tenant?      @relation(fields: [tenantId], references: [id])
  enrollments Enrollment[]
  quizAttempts QuizAttempt[]
  certificates Certificate[]

  @@index([tenantId])
  @@index([email])
  @@index([ssoSubject])
  @@map("users")
}

model ComplianceFramework {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @db.VarChar(255)
  code        String   @unique @db.VarChar(50)
  description String?
  version     String   @db.VarChar(20)
  authority   String?  @db.VarChar(255)
  region      String?  @db.VarChar(100)
  isActive    Boolean  @default(true) @map("is_active")
  createdBy   String?  @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenantMappings  TenantComplianceMapping[]
  courseMappings  CourseComplianceMapping[]

  @@map("compliance_frameworks")
}

model TenantComplianceMapping {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  complianceId  String   @map("compliance_id") @db.Uuid
  assignedBy    String   @map("assigned_by") @db.Uuid
  assignedAt    DateTime @default(now()) @map("assigned_at")
  effectiveDate DateTime @map("effective_date") @db.Date
  dueDateDays   Int      @default(30) @map("due_date_days")
  notes         String?

  tenant     Tenant              @relation(fields: [tenantId], references: [id])
  compliance ComplianceFramework @relation(fields: [complianceId], references: [id])

  @@unique([tenantId, complianceId])
  @@map("tenant_compliance_mappings")
}

model Course {
  id                    String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title                 String    @db.VarChar(255)
  slug                  String    @unique @db.VarChar(255)
  description           String?
  thumbnailUrl          String?   @map("thumbnail_url")
  durationMinutes       Int       @default(0) @map("duration_minutes")
  status                String    @default("draft") // course_status enum
  passingScore          Int       @default(70) @map("passing_score")
  sequentialUnlock      Boolean   @default(true) @map("sequential_unlock")
  certificateTemplateId String?   @map("certificate_template_id") @db.Uuid
  targetRoleCategories  String[]  @default(["general"]) @map("target_role_categories")
  language              String    @default("en") @db.VarChar(10)
  metadata              Json?
  createdBy             String    @map("created_by") @db.Uuid
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  deletedAt             DateTime? @map("deleted_at")

  modules             Module[]
  complianceMappings  CourseComplianceMapping[]
  enrollments         Enrollment[]
  certificates        Certificate[]

  @@map("courses")
}

model CourseComplianceMapping {
  courseId     String  @map("course_id") @db.Uuid
  complianceId String  @map("compliance_id") @db.Uuid
  isMandatory  Boolean @default(true) @map("is_mandatory")
  controlRef   String? @map("control_ref") @db.VarChar(100)

  course     Course              @relation(fields: [courseId], references: [id])
  compliance ComplianceFramework @relation(fields: [complianceId], references: [id])

  @@id([courseId, complianceId])
  @@map("course_compliance_mappings")
}

model Module {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  courseId    String   @map("course_id") @db.Uuid
  title       String   @db.VarChar(255)
  description String?
  orderIndex  Int      @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  course  Course   @relation(fields: [courseId], references: [id])
  lessons Lesson[]

  @@unique([courseId, orderIndex])
  @@map("modules")
}

model Lesson {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  moduleId        String    @map("module_id") @db.Uuid
  title           String    @db.VarChar(255)
  type            String    // lesson_type enum
  orderIndex      Int       @map("order_index")
  isMandatory     Boolean   @default(true) @map("is_mandatory")
  videoUrl        String?   @map("video_url")            // HLS manifest .m3u8
  videoDuration   Int?      @map("video_duration")       // seconds
  notesUrl        String?   @map("notes_url")            // S3 PDF URL
  notesFilename   String?   @map("notes_filename") @db.VarChar(255)
  content         String?   // Future: inline HTML
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  module   Module         @relation(fields: [moduleId], references: [id])
  quiz     Quiz?
  progress LessonProgress[]

  @@unique([moduleId, orderIndex])
  @@map("lessons")
}

model Quiz {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lessonId        String   @unique @map("lesson_id") @db.Uuid
  title           String   @db.VarChar(255)
  timeLimitSecs   Int      @default(0) @map("time_limit_secs")
  maxAttempts     Int      @default(0) @map("max_attempts")
  passingScore    Int      @default(70) @map("passing_score")
  shuffleQuestions Boolean @default(true) @map("shuffle_questions")
  shuffleAnswers   Boolean @default(true) @map("shuffle_answers")
  showFeedback     Boolean @default(true) @map("show_feedback")
  createdAt        DateTime @default(now()) @map("created_at")

  lesson    Lesson         @relation(fields: [lessonId], references: [id])
  questions QuizQuestion[]
  attempts  QuizAttempt[]

  @@map("quizzes")
}

model QuizQuestion {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  quizId      String  @map("quiz_id") @db.Uuid
  text        String
  type        String  // question_type enum
  explanation String?
  points      Int     @default(1)
  orderIndex  Int     @map("order_index")
  mediaUrl    String? @map("media_url")

  quiz    Quiz         @relation(fields: [quizId], references: [id])
  answers QuizAnswer[]

  @@map("quiz_questions")
}

model QuizAnswer {
  id         String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  questionId String  @map("question_id") @db.Uuid
  text       String
  isCorrect  Boolean @map("is_correct")
  orderIndex Int     @map("order_index")

  question QuizQuestion @relation(fields: [questionId], references: [id])

  @@map("quiz_answers")
}

model QuizAttempt {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  quizId        String    @map("quiz_id") @db.Uuid
  enrollmentId  String    @map("enrollment_id") @db.Uuid
  status        String    @default("in_progress") // attempt_status enum
  score         Int?
  passed        Boolean?
  answers       Json?     // [{question_id, selected_answer_ids[]}]
  startedAt     DateTime  @default(now()) @map("started_at")
  submittedAt   DateTime? @map("submitted_at")
  expiresAt     DateTime? @map("expires_at")
  attemptNumber Int       @default(1) @map("attempt_number")

  user       User       @relation(fields: [userId], references: [id])
  quiz       Quiz       @relation(fields: [quizId], references: [id])
  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])

  @@index([enrollmentId])
  @@map("quiz_attempts")
}

model Enrollment {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String    @map("user_id") @db.Uuid
  courseId       String    @map("course_id") @db.Uuid
  tenantId       String?   @map("tenant_id") @db.Uuid
  enrollmentType String    @map("enrollment_type") // enrollment_type enum
  status         String    @default("not_started") // enrollment_status enum
  progressPercent Int      @default(0) @map("progress_percent")
  dueDate        DateTime? @map("due_date") @db.Date
  enrolledAt     DateTime  @default(now()) @map("enrolled_at")
  startedAt      DateTime? @map("started_at")
  completedAt    DateTime? @map("completed_at")
  failedAt       DateTime? @map("failed_at")
  certificateId  String?   @map("certificate_id") @db.Uuid
  enrolledBy     String?   @map("enrolled_by") @db.Uuid

  user         User             @relation(fields: [userId], references: [id])
  course       Course           @relation(fields: [courseId], references: [id])
  tenant       Tenant?          @relation(fields: [tenantId], references: [id])
  lessonProgress LessonProgress[]
  quizAttempts   QuizAttempt[]
  certificate    Certificate?   @relation(fields: [certificateId], references: [id])

  @@unique([userId, courseId])
  @@index([tenantId])
  @@index([userId])
  @@index([status, dueDate])
  @@map("enrollments")
}

model LessonProgress {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  enrollmentId      String    @map("enrollment_id") @db.Uuid
  lessonId          String    @map("lesson_id") @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  status            String    @default("not_started") // progress_status enum
  videoPosition     Int?      @map("video_position")
  videoCompletedPct Decimal?  @map("video_completed_pct") @db.Decimal(5, 2)
  startedAt         DateTime? @map("started_at")
  completedAt       DateTime? @map("completed_at")

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])
  lesson     Lesson     @relation(fields: [lessonId], references: [id])

  @@unique([enrollmentId, lessonId])
  @@index([enrollmentId])
  @@map("lesson_progress")
}

model CertificateTemplate {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String   @db.VarChar(255)
  htmlTemplate String   @map("html_template") // Full HTML/CSS with merge fields
  previewUrl   String?  @map("preview_url")
  isDefault    Boolean  @default(false) @map("is_default")
  createdBy    String?  @map("created_by") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")

  certificates Certificate[]

  @@map("certificate_templates")
}

model Certificate {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  courseId          String    @map("course_id") @db.Uuid
  enrollmentId      String    @unique @map("enrollment_id") @db.Uuid
  tenantId          String?   @map("tenant_id") @db.Uuid
  certificateNumber String    @unique @map("certificate_number") @db.VarChar(60)
  score             Int
  issuedAt          DateTime  @default(now()) @map("issued_at")
  expiresAt         DateTime? @map("expires_at") @db.Date
  pdfUrl            String?   @map("pdf_url")
  pdfGeneratedAt    DateTime? @map("pdf_generated_at")
  verificationHash  String    @unique @map("verification_hash")
  templateId        String    @map("template_id") @db.Uuid
  revoked           Boolean   @default(false)
  revokedAt         DateTime? @map("revoked_at")
  revokedReason     String?   @map("revoked_reason")

  user       User                @relation(fields: [userId], references: [id])
  course     Course              @relation(fields: [courseId], references: [id])
  tenant     Tenant?             @relation(fields: [tenantId], references: [id])
  template   CertificateTemplate @relation(fields: [templateId], references: [id])
  enrollment Enrollment[]

  @@index([tenantId])
  @@index([verificationHash])
  @@map("certificates")
}

model AuditLog {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  actorId     String?  @map("actor_id") @db.Uuid
  actorEmail  String   @map("actor_email") @db.VarChar(255)
  actorRole   String   @map("actor_role")
  tenantId    String?  @map("tenant_id") @db.Uuid
  action      String   @db.VarChar(100) // e.g. USER_CREATED, AUTO_ENROLLED, CERT_ISSUED
  entityType  String   @map("entity_type") @db.VarChar(100)
  entityId    String?  @map("entity_id") @db.Uuid
  beforeState Json?    @map("before_state")
  afterState  Json?    @map("after_state")
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  userAgent   String?  @map("user_agent")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([tenantId, createdAt(sort: Desc)])
  @@index([actorId, createdAt(sort: Desc)])
  @@map("audit_logs")
}

model PasswordResetToken {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  tokenHash String   @map("token_hash") // SHA-256 of raw token
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("password_reset_tokens")
}
```

### 5.4 Critical Indexes (add via raw migration)

```sql
-- Overdue enrollments dashboard (most-queried KRI)
CREATE INDEX idx_enrollments_overdue ON enrollments(due_date, status)
  WHERE status NOT IN ('completed','failed') AND due_date IS NOT NULL;

-- Certificate public verification (high traffic, no auth)
CREATE UNIQUE INDEX idx_certs_hash ON certificates(verification_hash);

-- Soft-delete aware user lookup
CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
```

### 5.5 Row-Level Security (RLS) Setup

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (super_admin bypasses)
CREATE POLICY tenant_isolation ON users
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Same pattern for all tenant-scoped tables
-- (repeat for enrollments, lesson_progress, certificates, audit_logs)

-- Create dedicated app database user (NEVER use superuser in app)
CREATE USER sa_lms_app WITH PASSWORD 'your-secure-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sa_lms_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sa_lms_app;
```
