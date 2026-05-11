
---

## 11. AUTHENTICATION & SECURITY

### 11.1 Password Hashing (Argon2id)

```typescript
// apps/api/src/lib/crypto.ts
import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(password: string): Promise<string> {
  const peppered = password + process.env.ARGON2_PEPPER;
  return argon2.hash(peppered, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const peppered = password + process.env.ARGON2_PEPPER;
  return argon2.verify(hash, peppered);
  // Timing-safe by default — argon2.verify always takes same time
}

// MFA Secret Encryption (AES-256-GCM)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptMFASecret(secret: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptMFASecret(encryptedSecret: string): string {
  const [ivHex, authTagHex, encryptedHex] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### 11.2 Login Flow with Account Lockout

```typescript
// apps/api/src/services/auth.service.ts (login method)
async login(email: string, password: string, ipAddress: string) {
  // 1. Always fetch user (timing attack prevention — constant time)
  const user = await userRepo.findByEmail(email);
  const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummy'; // Fallback hash

  // 2. Check lockout BEFORE verifying password
  if (user?.lockedUntil && new Date() < user.lockedUntil) {
    const remainingMs = user.lockedUntil.getTime() - Date.now();
    throw new AppError(ErrorCodes.ACCOUNT_LOCKED, `Account locked for ${Math.ceil(remainingMs / 60000)} more minutes`, 423);
  }

  // 3. Verify password (always run — even if user not found)
  const hashToVerify = user?.passwordHash ?? dummyHash;
  const isValid = user ? await verifyPassword(hashToVerify, password) : false;

  if (!user || !isValid) {
    if (user) {
      const attempts = user.loginAttempts + 1;
      const lockThreshold = 5;
      await userRepo.update(user.id, {
        loginAttempts: attempts,
        lockedUntil: attempts >= lockThreshold
          ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
          : null,
      });
    }
    throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  // 4. Check status
  if (user.status === 'inactive' || user.status === 'sso_only') {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Account is not active', 403);
  }

  // 5. Reset login attempts on success
  await userRepo.update(user.id, { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() });

  // 6. MFA required?
  if (user.mfaEnabled) {
    const mfaTempToken = jwt.sign({ sub: user.id, type: 'mfa_temp' }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '5m' });
    await auditLog({ actorId: user.id, actorEmail: user.email, actorRole: user.role, action: 'LOGIN_MFA_REQUIRED', entityType: 'user', entityId: user.id, ipAddress });
    return { mfaRequired: true, mfaTempToken };
  }

  // 7. Issue tokens
  return issueTokens(user, ipAddress);
}
```

### 11.3 Refresh Token Management (Redis)

```typescript
// apps/api/src/services/auth.service.ts (token management)
async function issueTokens(user: User, ipAddress: string) {
  const jti = randomUUID();

  // Access token (RS256, 15 min)
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    process.env.JWT_PRIVATE_KEY!,
    { algorithm: 'RS256', expiresIn: '15m' }
  );

  // Refresh token (HS256, 7 days, contains jti for revocation)
  const refreshToken = jwt.sign(
    { sub: user.id, jti },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  // Store jti in Redis (7 days TTL)
  await redis.setEx(`refresh:${jti}`, 7 * 24 * 60 * 60, user.id);

  await auditLog({ actorId: user.id, action: 'LOGIN', ipAddress });

  return { accessToken, refreshToken };
}

async function refreshTokens(incomingRefreshToken: string) {
  const payload = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string; jti: string };

  // Check jti exists in Redis (not revoked)
  const storedUserId = await redis.get(`refresh:${payload.jti}`);
  if (!storedUserId) throw new AppError(ErrorCodes.TOKEN_INVALID, 'Refresh token has been revoked', 401);

  // Consume the token (rotation — old jti deleted)
  await redis.del(`refresh:${payload.jti}`);

  const user = await userRepo.findById(payload.sub);
  if (!user || user.status !== 'active') throw new AppError(ErrorCodes.FORBIDDEN, 'User not active', 403);

  return issueTokens(user, '');
}
```

### 11.4 Rate Limiting

```typescript
// apps/api/src/middleware/rate-limit.ts
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis';

const createLimiter = (windowMs: number, max: number, keyPrefix: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ sendCommand: (...args: string[]) => redis.sendCommand(args), prefix: keyPrefix }),
    handler: (_, res) => res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait before trying again.' },
    }),
  });

export const loginLimiter     = createLimiter(15 * 60 * 1000, 5,   'rl:login:');
export const mfaLimiter       = createLimiter(5  * 60 * 1000, 5,   'rl:mfa:');
export const apiLimiter       = createLimiter(60  * 1000,     100,  'rl:api:');
export const uploadLimiter    = createLimiter(60  * 60 * 1000, 20,  'rl:upload:');
export const verifyLimiter    = createLimiter(60  * 1000,     30,  'rl:verify:');
```

---

## 12. BACKGROUND JOB WORKERS

### 12.1 Queue Definitions

```typescript
// apps/api/src/queues/index.ts
import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

const queueOptions = { connection: redis };

export const enrollmentQueue  = new Queue('auto-enrollment',   queueOptions);
export const certQueue         = new Queue('certificate',       queueOptions);
export const emailQueue        = new Queue('email',             queueOptions);
export const reportQueue       = new Queue('report',           queueOptions);
export const videoQueue        = new Queue('video-processing', queueOptions);
export const healthScoreQueue  = new Queue('health-score',     queueOptions);

// Job type definitions
export interface AutoEnrollJob { triggerType: 'T1'|'T2'|'T3'|'T4'; tenantId?: string; complianceId?: string; userId?: string; courseId?: string; }
export interface CertJob       { enrollmentId: string; }
export interface EmailJob      { templateName: string; userId: string; data: Record<string, unknown>; }
export interface ReportJob     { reportType: 'certified_users'|'audit_log'; tenantId: string; filters: Record<string, unknown>; requestedBy: string; }
```

### 12.2 Email Worker

```typescript
// apps/api/src/workers/email.worker.ts
import { Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { mailer } from '../lib/mailer';
import { prisma } from '../lib/prisma';

const templates: Record<string, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  'enrollment-welcome': (data) => ({
    subject: `You've been enrolled: ${data.courseTitle}`,
    html: `<p>Hi ${data.firstName},</p><p>You have been enrolled in <strong>${data.courseTitle}</strong>. Your deadline is ${data.dueDate}.</p><a href="${data.loginUrl}">Start Learning</a>`,
  }),
  'certificate-issued': (data) => ({
    subject: `Certificate Issued: ${data.courseTitle}`,
    html: `<p>Congratulations ${data.firstName}! You have completed <strong>${data.courseTitle}</strong> and earned your certificate.</p><p>Certificate #: ${data.certNumber}</p>`,
  }),
  'enrollment-reminder': (data) => ({
    subject: `Reminder: Complete ${data.courseTitle} by ${data.dueDate}`,
    html: `<p>Hi ${data.firstName}, your training <strong>${data.courseTitle}</strong> is due on ${data.dueDate}.</p>`,
  }),
  'overdue-alert': (data) => ({
    subject: `OVERDUE: ${data.courseTitle}`,
    html: `<p>Hi ${data.firstName}, your training <strong>${data.courseTitle}</strong> is now overdue.</p>`,
  }),
};

export const emailWorker = new Worker<{ templateName: string; userId: string; data?: Record<string, unknown>; enrollmentId?: string; certificateId?: string }>(
  'email',
  async (job) => {
    const { templateName, userId, enrollmentId, certificateId, data: extraData } = job.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'active') return { skipped: true };

    let templateData: Record<string, unknown> = {
      firstName: user.firstName,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      ...extraData,
    };

    if (enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: true },
      });
      if (enrollment) {
        templateData.courseTitle = enrollment.course.title;
        templateData.dueDate = enrollment.dueDate?.toLocaleDateString('en-GB') ?? 'No deadline';
      }
    }

    if (certificateId) {
      const cert = await prisma.certificate.findUnique({ where: { id: certificateId } });
      if (cert) {
        templateData.certNumber = cert.certificateNumber;
        templateData.verifyUrl = `${process.env.CERT_VERIFICATION_BASE_URL}/verify/${cert.verificationHash}`;
        templateData.pdfUrl = cert.pdfUrl;
      }
    }

    const template = templates[templateName];
    if (!template) throw new Error(`Unknown email template: ${templateName}`);

    const { subject, html } = template(templateData);

    await mailer.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject,
      html,
    });

    return { sent: true, email: user.email };
  },
  { connection: redis, concurrency: 10 }
);
```

### 12.3 Daily Compliance Health Score Job

```typescript
// apps/api/src/workers/health-score.worker.ts
import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

// Runs daily at 02:00 UTC
cron.schedule('0 2 * * *', async () => {
  const tenants = await prisma.tenant.findMany({ where: { status: 'active', deletedAt: null } });

  for (const tenant of tenants) {
    const stats = await prisma.$queryRaw<[{
      total: bigint; completed: bigint; overdue: bigint; certified: bigint;
    }]>`
      SELECT
        COUNT(DISTINCT e.id)                                                      AS total,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')               AS completed,
        COUNT(DISTINCT e.id) FILTER (WHERE e.due_date < NOW() AND e.status NOT IN ('completed','failed')) AS overdue,
        COUNT(DISTINCT c.id)                                                      AS certified
      FROM enrollments e
      LEFT JOIN certificates c ON c.enrollment_id = e.id
      WHERE e.tenant_id = ${tenant.id}::uuid
    `;

    const { total, completed, overdue, certified } = stats[0];
    const completionRate = total > 0 ? (Number(completed) / Number(total)) * 100 : 100;
    const overdueRate    = total > 0 ? (Number(overdue) / Number(total)) * 100 : 0;
    const healthScore    = Math.max(0, Math.round(completionRate - (overdueRate * 0.5)));

    // Cache in Redis for 25 hours (dashboard reads from here)
    await redis.setEx(
      `health:${tenant.id}`,
      25 * 60 * 60,
      JSON.stringify({ healthScore, completionRate: Math.round(completionRate), overdue: Number(overdue), certified: Number(certified), calculatedAt: new Date().toISOString() })
    );
  }
  logger.info('Daily health scores calculated');
});
```

---

## 13. TESTING STANDARDS

### 13.1 Test Setup

```typescript
// apps/api/src/test/setup.ts
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

beforeEach(async () => {
  // Truncate in reverse FK dependency order
  await prisma.$executeRaw`
    TRUNCATE TABLE
      certificates, quiz_attempts, lesson_progress, enrollments,
      quiz_answers, quiz_questions, quizzes, lessons, modules,
      course_compliance_mappings, courses, tenant_compliance_mappings,
      audit_logs, password_reset_tokens, users, tenants,
      compliance_frameworks, certificate_templates
    RESTART IDENTITY CASCADE
  `;
  await redis.flushDb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
```

### 13.2 Test Data Factories

```typescript
// apps/api/src/test/factories.ts
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/crypto';

export async function createSuperAdmin(overrides = {}) {
  return prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: await hashPassword('Test1234!'),
      firstName: 'Super', lastName: 'Admin',
      role: 'super_admin', status: 'active',
      jobRoleCategory: 'cybersecurity',
      ...overrides,
    },
  });
}

export async function createTenant(overrides = {}) {
  return prisma.tenant.create({
    data: {
      name: 'Test Corp', slug: `test-corp-${Date.now()}`,
      status: 'active', maxUsers: -1, subscriptionPlan: 'professional',
      ...overrides,
    },
  });
}

export async function createStudent(tenantId: string, overrides = {}) {
  return prisma.user.create({
    data: {
      email: `student-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Test1234!'),
      firstName: 'Test', lastName: 'Student',
      role: 'student', status: 'active', tenantId,
      jobRoleCategory: 'general',
      ...overrides,
    },
  });
}

export async function createPublishedCourse(createdBy: string, overrides = {}) {
  const course = await prisma.course.create({
    data: {
      title: `Course ${Date.now()}`, slug: `course-${Date.now()}`,
      status: 'published', passingScore: 70, createdBy,
      ...overrides,
    },
  });
  const module = await prisma.module.create({ data: { courseId: course.id, title: 'Module 1', orderIndex: 1 } });
  const videoLesson = await prisma.lesson.create({
    data: { moduleId: module.id, title: 'Video Lesson', type: 'video', orderIndex: 1, isMandatory: true, videoDuration: 300 }
  });
  const assessmentLesson = await prisma.lesson.create({
    data: { moduleId: module.id, title: 'Assessment', type: 'assessment', orderIndex: 2, isMandatory: true }
  });
  return { course, module, videoLesson, assessmentLesson };
}
```

### 13.3 Critical Tests — ALL must pass before merge

```typescript
// Auto-enrollment idempotency
it('auto-enrollment is idempotent — running twice creates no duplicates', async () => {
  const tenant = await createTenant();
  const student1 = await createStudent(tenant.id);
  const student2 = await createStudent(tenant.id);
  const compliance = await createCompliance();
  const { course } = await createPublishedCourse(admin.id);
  await createCourseComplianceMapping(course.id, compliance.id);

  // Run enrollment twice
  await enrollmentWorker.processJob({ data: { triggerType: 'T1', tenantId: tenant.id, complianceId: compliance.id } } as any);
  await enrollmentWorker.processJob({ data: { triggerType: 'T1', tenantId: tenant.id, complianceId: compliance.id } } as any);

  const count = await prisma.enrollment.count({ where: { courseId: course.id } });
  expect(count).toBe(2); // student1 + student2, NOT 4
});

// Cross-tenant isolation
it('tenant admin cannot access another tenants users', async () => {
  const tenantA = await createTenant({ name: 'Tenant A', slug: 'tenant-a' });
  const tenantB = await createTenant({ name: 'Tenant B', slug: 'tenant-b' });
  const adminA = await createTenantAdmin(tenantA.id);
  const tokenA = await loginAndGetToken(adminA.email);

  const response = await request(app)
    .get(`/api/v1/tenants/${tenantB.id}/users`)
    .set('Authorization', `Bearer ${tokenA}`);

  expect(response.status).toBe(403);
});

// Certificate number uniqueness under concurrency
it('generates unique certificate numbers under concurrent load', async () => {
  const tenant = await createTenant({ slug: 'concurrent-test' });
  const certNumbers: string[] = [];

  // Generate 20 certificates concurrently
  await Promise.all(Array.from({ length: 20 }).map(async () => {
    const num = await generateCertNumber(tenant.id, tenant.slug);
    certNumbers.push(num);
  }));

  const unique = new Set(certNumbers);
  expect(unique.size).toBe(20);
});

// Quiz max attempts
it('rejects quiz submission after max attempts reached', async () => {
  // ... setup quiz with maxAttempts: 2, fail twice, verify third attempt rejected
});

// Refresh token rotation
it('refresh token cannot be used twice', async () => {
  const { refreshToken } = await loginUser(student.email);
  const res1 = await request(app).post('/api/v1/auth/refresh').set('Cookie', `refreshToken=${refreshToken}`);
  expect(res1.status).toBe(200);

  const res2 = await request(app).post('/api/v1/auth/refresh').set('Cookie', `refreshToken=${refreshToken}`);
  expect(res2.status).toBe(401); // Token already consumed
});
```

---

## 14. ERROR RESOLUTION ENCYCLOPEDIA

> When Claude Code hits an error, search this section FIRST before attempting any fix.

### 14.1 Database Errors

#### ERROR: `P2002 — Unique constraint failed`
**Cause**: Trying to insert a duplicate record where UNIQUE constraint exists.
**Most common cases**:
- Enrollment: `(user_id, course_id)` already exists → this is normal during auto-enrollment. Use `createMany({ skipDuplicates: true })`.
- User: `email` already registered → return `AppError('ALREADY_EXISTS', ...)`.
- Certificate number: race condition on certificate sequence.
**Fix**: Check which field caused the violation from `error.meta.target`. Handle gracefully — do NOT let this bubble to a 500.

#### ERROR: `P2025 — Record to update not found`
**Cause**: `prisma.X.update({ where: { id } })` but record doesn't exist.
**Fix**: Switch to `findUnique()` first, check null, then throw `AppError('NOT_FOUND', ...)`. Or use `findUniqueOrThrow()` which throws PrismaClientKnownRequestError with code P2025.

#### ERROR: `P2003 — Foreign key constraint failed`
**Cause**: Inserting a record with a FK that references a non-existent parent (e.g. enrolling into a deleted course).
**Fix**: Validate parent record existence in the Service layer BEFORE attempting insert.

#### ERROR: `Can't reach database server`
**Cause**: PostgreSQL not running, wrong connection string, PgBouncer down.
**Fix steps**:
1. `docker-compose ps` — check postgres container status
2. `docker-compose logs postgres` — check for startup errors
3. Verify `DATABASE_URL` in `.env` — hostname should be `localhost` for dev
4. Try direct connection: `psql $DATABASE_URL -c '\l'`

#### ERROR: `RLS policy violation — no rows returned unexpectedly`
**Cause**: `app.current_tenant_id` not set for the connection, or set to wrong value.
**Fix**: Ensure `setRLSContext` middleware runs after `authenticate`. In the repository, always use `withRLS()` wrapper that sets session vars before queries.

#### ERROR: `prepared statement already exists`
**Cause**: Prisma connection pool re-uses connections but finds conflicting prepared statements (common with PgBouncer in transaction mode).
**Fix**: Set `?pgbouncer=true&connection_limit=1` in DATABASE_URL for workers. For the main app, use PgBouncer in session mode.

#### ERROR: `SSL connection required`
**Cause**: Production PostgreSQL requires SSL, but NODE_TLS_REJECT_UNAUTHORIZED or ssl config missing.
**Fix**: Add `?sslmode=require` to DATABASE_URL, or `?ssl=true&sslmode=no-verify` for self-signed certs.

### 14.2 Redis / BullMQ Errors

#### ERROR: `ECONNREFUSED 127.0.0.1:6379`
**Cause**: Redis not running.
**Fix**: `docker-compose up -d redis` then `docker-compose logs redis`.

#### ERROR: `BullMQ: Job X stalled`
**Cause**: Worker process died mid-job. BullMQ marks it stalled after `stalledInterval`.
**Fix**: Check worker logs for crash. BullMQ auto-retries stalled jobs. Ensure workers have proper try/catch and `process.on('uncaughtException')` handlers. Never let a worker process crash silently.

#### ERROR: `MaxRetriesPerRequestError`
**Cause**: Redis connection timing out — usually a password or URL issue.
**Fix**: Verify `REDIS_URL` format: `redis://:password@host:port` (note the `:` before password). For no password: `redis://localhost:6379`.

#### ERROR: `Bull: Missing process handler for queue`
**Cause**: Worker file not imported/started.
**Fix**: Ensure worker file is imported in `server.ts` after app startup. Workers should be started in a separate cluster worker or child process — not in the main web server process.

### 14.3 TypeScript / Build Errors

#### ERROR: `Type 'null' is not assignable to type 'string'`
**Cause**: Prisma returns `string | null` for nullable fields, but code expects `string`.
**Fix**: Use optional chaining `user.tenantId ?? ''` or null check guards. NEVER use `user.tenantId!` unless you have provably set it.

#### ERROR: `Property 'user' does not exist on type 'Request'`
**Cause**: Express Request augmentation not loaded.
**Fix**: Import `'./types/express'` in `app.ts`, or add `/// <reference path="./types/express.d.ts" />` to the file. Ensure `tsconfig.json` includes the types directory.

#### ERROR: `Cannot find module '@sa-lms/types'`
**Cause**: Turborepo package not built, or pnpm workspace not configured.
**Fix steps**:
1. `pnpm --filter @sa-lms/types build`
2. Verify `package.json` in api/web has `"@sa-lms/types": "workspace:*"` dependency
3. `pnpm install` from root to link workspace packages

#### ERROR: `Zod: ZodError — expected string, received undefined`
**Cause**: Request body field missing that schema expects.
**Fix**: Check Zod schema — are missing fields `optional()` or `.default()`? For query params, use `z.coerce.string()` or `z.string().optional()`.

#### ERROR: `Type instantiation is excessively deep and possibly infinite`
**Cause**: Circular type references, usually in complex Prisma include types.
**Fix**: Extract the Prisma include type to a separate type alias. Use `Prisma.TenantGetPayload<{ include: { users: true } }>` instead of inline generics.

### 14.4 Authentication Errors

#### ERROR: `jwt malformed` / `invalid signature`
**Cause**: Wrong secret/key used for verification, or token was issued with different algorithm.
**Fix**: 
- Access tokens use RS256 (verify with PUBLIC key)
- Refresh tokens use HS256 (verify with JWT_REFRESH_SECRET)
- Never mix these up
- Check if environment variable contains literal `\n` instead of actual newlines for RSA keys

#### ERROR: RSA key format issues (JWT_PRIVATE_KEY)
**Cause**: `.env` file doesn't handle multi-line values correctly.
**Fix**: Store key in a file and load with `fs.readFileSync`:
```typescript
const privateKey = process.env.JWT_PRIVATE_KEY_PATH
  ? fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8')
  : process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n');
```

#### ERROR: `Authentication required` on every request despite having token
**Cause**: Token stored in localStorage (wiped on refresh) or CORS blocking Authorization header.
**Fix**: 
- Ensure token stored in Zustand (in-memory), not localStorage
- On page load, hit `/auth/refresh` to get new token from cookie
- Check CORS config includes `Authorization` in `allowedHeaders`

#### ERROR: MFA setup QR code not scanning
**Cause**: Wrong issuer format or base32 encoding issue.
**Fix**: Use `speakeasy.generateSecret({ name: `SA-LMS (${user.email})`, issuer: 'SA-LMS' })`. The label format must be `issuer:account`.

### 14.5 S3 / File Upload Errors

#### ERROR: `NoSuchBucket`
**Cause**: S3 bucket doesn't exist.
**Fix for MinIO (dev)**: Create bucket via MinIO UI at http://localhost:9001 or:
```typescript
// In app startup / seed
const s3 = new S3Client({ endpoint: process.env.S3_ENDPOINT, forcePathStyle: true, ... });
await s3.send(new CreateBucketCommand({ Bucket: process.env.S3_BUCKET }));
```

#### ERROR: `CORS error when accessing S3 presigned URL`
**Cause**: S3 bucket CORS policy not set.
**Fix**: Set bucket CORS policy to allow GET from your frontend origin. For MinIO, set via mc or UI.

#### ERROR: `Multer: File too large`
**Cause**: File exceeds Multer's `limits.fileSize`.
**Fix**: Configure Multer per route:
```typescript
const videoUpload = multer({ limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2GB for videos
const logoUpload  = multer({ limits: { fileSize: 5 * 1024 * 1024 } });           // 5MB for logos
```

#### ERROR: Video uploaded but HLS stream 404
**Cause**: FFmpeg transcoding failed or output files not in expected S3 path.
**Fix**: 
1. Check video worker logs for FFmpeg errors
2. Verify FFmpeg is installed: `which ffmpeg`
3. Check S3 output path — HLS manifest should be at `videos/{courseId}/{lessonId}/index.m3u8`
4. Ensure cloudfront/CDN points to correct S3 prefix

### 14.6 PDF Generation Errors

#### ERROR: `Puppeteer: TimeoutError — Navigation timeout exceeded`
**Cause**: HTML template too complex or Puppeteer service not running.
**Fix**:
1. Check pdf-worker service: `docker-compose ps pdf-worker`
2. Increase timeout: `await page.goto('about:blank', { timeout: 60000 })`
3. Simplify certificate HTML — avoid external resources (embed images as base64)

#### ERROR: `Puppeteer: Could not find expected browser`
**Cause**: Chrome/Chromium not installed in Docker container.
**Fix**: Use `puppeteer/puppeteer` Docker image, or install chromium in Dockerfile:
```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

#### ERROR: Certificate PDF has no logo / broken images
**Cause**: Puppeteer can't access external URLs (S3/MinIO) from container.
**Fix**: Convert logo to base64 before inserting into HTML template:
```typescript
const logoBuffer = await fetchFromS3(tenant.logoUrl);
const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
html = html.replace('{{logo_url}}', logoBase64);
```

### 14.7 Frontend Errors

#### ERROR: `React Query: Error boundary not catching errors`
**Cause**: React Query `suspense: false` mode uses `error` property, not thrown errors.
**Fix**: Either enable `{ suspense: true }` and wrap in `<Suspense>` + `<ErrorBoundary>`, or handle `if (isError) return <ErrorComponent />` in the component.

#### ERROR: `HLS.js: manifestParsingError`
**Cause**: Video URL is not an HLS manifest, or CORS error fetching the manifest.
**Fix**:
1. Verify `lesson.videoUrl` ends in `.m3u8` (not `.mp4`)
2. Add CORS headers to CloudFront distribution for the video bucket
3. In dev, ensure MinIO bucket has public read or use presigned URL

#### ERROR: Infinite redirect loop on login
**Cause**: ProtectedRoute redirecting to `/login`, but `/login` is also protected or auth store not hydrated.
**Fix**: On app mount, before rendering router, call `/auth/refresh` to hydrate auth store from cookie. Show loading spinner until hydration complete:
```typescript
// apps/web/src/App.tsx
const [hydrated, setHydrated] = useState(false);
useEffect(() => {
  apiClient.post('/auth/refresh').then(({ data }) => {
    useAuthStore.getState().setAccessToken(data.data.accessToken);
    // fetch user profile
  }).catch(() => {}).finally(() => setHydrated(true));
}, []);
if (!hydrated) return <LoadingScreen />;
```

#### ERROR: `ResizeObserver loop limit exceeded`
**Cause**: Recharts/other chart library resizing rapidly.
**Fix**: This is a browser warning, not an error. Suppress it:
```typescript
const resizeObserverErr = window.onerror;
window.onerror = (msg, ...args) => {
  if (String(msg).includes('ResizeObserver')) return true;
  return resizeObserverErr?.(msg, ...args) ?? false;
};
```

### 14.8 Docker / Container Errors

#### ERROR: `Port already in use: 5432`
**Cause**: Local PostgreSQL instance already running.
**Fix**: `brew services stop postgresql` (Mac) or `sudo systemctl stop postgresql` (Linux), then `docker-compose up -d`.

#### ERROR: `docker-compose: network not found`
**Cause**: Previous containers have stale network references.
**Fix**: `docker-compose down --remove-orphans && docker network prune -f && docker-compose up -d`

#### ERROR: `EACCES: permission denied, mkdir '/home/pptruser/.cache'`
**Cause**: Puppeteer container user permissions issue.
**Fix**: Set `user: root` in pdf-worker docker-compose service, or add `chmod 777` on the cache directory in Dockerfile.

---

## 15. DEPLOYMENT GUIDE

### 15.1 Production Environment Variables

```bash
# CRITICAL changes from development

NODE_ENV="production"
LOG_LEVEL="warn"   # info in staging, warn in prod

# Use AWS RDS for PostgreSQL (NOT docker)
DATABASE_URL="postgresql://sa_lms_app:STRONG_PASSWORD@rds-endpoint.amazonaws.com:5432/sa_lms_prod?ssl=true&sslmode=require"

# Use ElastiCache for Redis (NOT docker)
REDIS_URL="rediss://sa-lms-cache.abc123.use1.cache.amazonaws.com:6380"   # Note: rediss:// for TLS

# Use real S3 (remove S3_ENDPOINT — uses AWS default)
# S3_ENDPOINT=   ← DELETE this line
S3_BUCKET="sa-lms-prod"
S3_REGION="us-east-1"

# Use real AWS SES (NOT Mailhog)
# Remove SMTP_HOST/PORT lines
SES_REGION="us-east-1"
SES_ACCESS_KEY_ID="AKIA..."
SES_SECRET_ACCESS_KEY="..."

# Strong random secrets (generate fresh for production)
JWT_PRIVATE_KEY="$(cat /secrets/jwt-private.pem)"
JWT_REFRESH_SECRET="$(openssl rand -hex 64)"
ARGON2_PEPPER="$(openssl rand -hex 64)"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
```

### 15.2 Production Dockerfile (API)

```dockerfile
# apps/api/Dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY apps/api/ apps/api/
COPY packages/ packages/
RUN pnpm --filter @sa-lms/database generate
RUN pnpm --filter @sa-lms/api build

FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma
RUN npm install -g pnpm
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### 15.3 Production Dockerfile (PDF Worker)

```dockerfile
# apps/pdf-worker/Dockerfile
FROM ghcr.io/puppeteer/puppeteer:22.0.0
WORKDIR /app
USER root
COPY package.json pnpm-workspace.yaml ./
COPY apps/pdf-worker/package.json apps/pdf-worker/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY apps/pdf-worker/ apps/pdf-worker/
RUN pnpm --filter @sa-lms/pdf-worker build
ENV PUPPETEER_SKIP_DOWNLOAD=true
EXPOSE 3002
CMD ["node", "apps/pdf-worker/dist/index.js"]
```

### 15.4 GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: sa_lms_test, POSTGRES_USER: sa_lms_app, POSTGRES_PASSWORD: testpassword }
        options: --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 5
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @sa-lms/database migrate:deploy
        env:
          DATABASE_URL: postgresql://sa_lms_app:testpassword@localhost:5432/sa_lms_test
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
        env:
          TEST_DATABASE_URL: postgresql://sa_lms_app:testpassword@localhost:5432/sa_lms_test
          REDIS_URL: redis://localhost:6379
          JWT_REFRESH_SECRET: test-secret-minimum-32-chars-long-here
          ARGON2_PEPPER: test-pepper-minimum-32-chars-long-here-x
          ENCRYPTION_KEY: 0123456789abcdef0123456789abcdef01234567890abcdef0123456789abcdef

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          # Build and push Docker images
          # Deploy to ECS/K8s staging environment
          echo "Deploy to staging"

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    environment: production  # Requires manual approval
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: echo "Deploy to production"
```

### 15.5 Production Checklist

```
PRE-DEPLOYMENT:
☐ All CI tests pass
☐ Database migrations reviewed (no destructive changes without backup)
☐ Environment variables verified (especially JWT keys, DB passwords)
☐ S3 bucket CORS and lifecycle policies configured
☐ CloudFront distribution pointing to S3 video bucket
☐ SES domain verified and production sandbox removed
☐ Redis TLS endpoint configured
☐ PgBouncer configured between app and RDS
☐ SSL certificate valid and auto-renewing

POST-DEPLOYMENT:
☐ Health endpoint responding: GET /health → { status: 'ok' }
☐ Test login for each role (super_admin, tenant_admin, student)
☐ Test auto-enrollment flow
☐ Test certificate generation
☐ Test email delivery (check SES sending stats)
☐ Prometheus metrics endpoint accessible
☐ Grafana dashboards showing data
☐ BullMQ queues processing (Bull Board or BullMQ Pro dashboard)
☐ Error rate < 0.1% in first 30 minutes
```

---

## 16. FEATURE IMPLEMENTATION CHECKLISTS

### 16.1 Adding a New API Endpoint

```
☐ Define Zod schema in packages/types/src/schemas/
☐ Add route handler in apps/api/src/routes/*.routes.ts
☐ Apply authenticate + authorize + validate middleware
☐ Implement service method (business logic only)
☐ Implement repository method (database only)
☐ Write audit log entry for state-changing operations
☐ Handle errors with AppError (never let unknown errors reach the client)
☐ Write integration test (at minimum: success case + 403 cross-tenant case)
☐ Add endpoint to API reference in this SKILL.md
```

### 16.2 Adding a New Background Job

```
☐ Define job data interface in apps/api/src/queues/index.ts
☐ Create Queue instance
☐ Create Worker file in apps/api/src/workers/
☐ Add error handling and retry config to Worker
☐ Register worker in server.ts startup
☐ Add job enqueueing to relevant service method
☐ Write unit test for worker logic
☐ Test failure/retry scenario
☐ Add to monitoring dashboard
```

### 16.3 Adding a New Frontend Feature

```
☐ Create feature folder: apps/web/src/features/{role}/{feature}/
☐ Create API client methods in {feature}/api/{feature}.api.ts
☐ Create React Query hooks in {feature}/hooks/use{Feature}.ts
☐ Create components in {feature}/components/
☐ Add route in apps/web/src/router/index.tsx
☐ Add to role layout navigation
☐ Apply ProtectedRoute with correct roles
☐ Test on mobile viewport (320px)
☐ Test with React Query DevTools open (verify no duplicate queries)
```

### 16.4 Adding a New User Role

```
☐ Add ENUM value to user_role PostgreSQL ENUM (migration)
☐ Add to Prisma schema
☐ Update RBAC authorize middleware allowedRoles
☐ Add RLS policy to cover new role
☐ Update JWT payload type
☐ Update useAuthStore role type
☐ Add ProtectedRoute allowedRoles arrays
☐ Create portal layout and routes
☐ Update API endpoint documentation
```

---

## 17. CODE PATTERNS REFERENCE

### 17.1 Pagination Pattern

```typescript
// Repository
async findMany(params: { page: number; limit: number; where?: Prisma.TenantWhereInput }) {
  const { page = 1, limit = 20, where = {} } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.tenant.findMany({ where: { ...where, deletedAt: null }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.tenant.count({ where: { ...where, deletedAt: null } }),
  ]);

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
}
```

### 17.2 Audit Logging Pattern

```typescript
// Every service method that changes state must call this
await prisma.auditLog.create({
  data: {
    actorId: requestUser.id,
    actorEmail: requestUser.email,
    actorRole: requestUser.role,
    tenantId: requestUser.tenantId,
    action: 'USER_CREATED',     // Use all-caps VERB_NOUN convention
    entityType: 'user',
    entityId: createdUser.id,
    afterState: { email: createdUser.email, role: createdUser.role },
    ipAddress: req.ip,
  },
});
```

### 17.3 Presigned URL Pattern (S3)

```typescript
// apps/api/src/lib/s3.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT, // undefined in production
  forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
});

export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }), { expiresIn: expiresInSeconds });
}

export async function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
  return `${process.env.S3_PUBLIC_URL}/${key}`;
}
```

### 17.4 BullMQ Queue Add Pattern

```typescript
// Always add jobs with retry config
await enrollmentQueue.add(
  'auto-enroll',
  { triggerType: 'T1', tenantId, complianceId },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }, // 5s, 10s, 20s
    removeOnComplete: { count: 100 },  // Keep last 100 completed jobs
    removeOnFail: { count: 500 },      // Keep last 500 failed jobs
  }
);
```

---

## 18. NON-NEGOTIABLE RULES

These apply to EVERY piece of code written for this project:

### Code Quality
- `any` type in TypeScript → **REJECTED**. Use `unknown` and type-narrow.
- `@ts-ignore` → **REJECTED**. Fix the type error properly.
- `console.log` in committed code → **REJECTED**. Use Pino logger.
- Hardcoded URLs, secrets, or credentials → **REJECTED**.
- Raw SQL string concatenation → **REJECTED**. Use Prisma or tagged template literals.

### Security
- JWT stored in localStorage → **REJECTED**. Memory only (Zustand).
- User password/token/secret in logs → **REJECTED**. Sanitize before logging.
- Business logic in database triggers → **REJECTED**. Service layer only.
- Direct database access from route handlers → **REJECTED**. Repository layer only.
- API endpoint without `authenticate` middleware (except /health, /auth/login, /auth/refresh, /verify/:hash) → **REJECTED**.

### Architecture
- Skipping a layer (e.g., route handler calling repository directly) → **REJECTED**.
- Business logic in repository layer → **REJECTED**.
- HTTP objects (req/res) passed to service layer → **REJECTED**.
- Database queries in frontend code → **NOT APPLICABLE** but obviously rejected.
- State-changing operation without audit log → **REJECTED**.

### Data Integrity
- Hard-deleting records (any model) → **REJECTED**. Use `deletedAt` soft delete.
- Auto-enrollment without `skipDuplicates: true` → **REJECTED**. Non-idempotent.
- Certificate generation without unique constraint → **REJECTED**.

### Testing
- PR with feature code but no tests → **REJECTED**. 
- Integration test that doesn't test the 403 cross-tenant case → **INCOMPLETE**.
- Tests that share state between test cases → **REJECTED**. Each test must clean up.

---

## QUICK REFERENCE — START HERE WHEN RESUMING WORK

```bash
# Start everything
cd sa-lms && docker-compose up -d && pnpm dev

# Run tests
pnpm test

# Run tests with watch
pnpm --filter @sa-lms/api test --watch

# Database migration
pnpm --filter @sa-lms/database migrate:dev -- --name "description_of_change"

# Reset database (development only)
pnpm --filter @sa-lms/database migrate:reset

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Build for production
pnpm build

# Check logs
docker-compose logs -f api
docker-compose logs -f pdf-worker
```

## Seed Data (After Fresh Setup)

The seed file (`packages/database/prisma/seed.ts`) creates:
- 1 Super Admin: `admin@sa-lms.dev` / `Admin1234!`
- Compliance frameworks: CRF, ISO27001, NESA, SAMA
- 3 sample courses with modules, lessons, quizzes
- 1 sample tenant: "Demo Corp" with CRF compliance assigned
- 5 sample students in Demo Corp
- 1 certificate template (default)

---

*This SKILL.md is the authoritative development reference for SA-LMS. Last updated: April 2026. Version: 1.0.0*
