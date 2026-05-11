
---

## 6. ENVIRONMENT SETUP

### 6.1 Prerequisites

```bash
# Required versions — use these exactly
node --version   # must be v20.x (use nvm)
pnpm --version   # must be v9.x  (npm install -g pnpm)
docker --version # any recent version
git --version    # v2.40+
```

### 6.2 First-Time Setup

```bash
# 1. Clone and enter
git clone git@github.com:your-org/sa-lms.git && cd sa-lms

# 2. Use correct Node version
echo "20" > .nvmrc && nvm use

# 3. Install all workspace dependencies
pnpm install

# 4. Copy all env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/pdf-worker/.env.example apps/pdf-worker/.env

# 5. Start infrastructure (PostgreSQL, Redis, MinIO, Mailhog, PgAdmin)
docker-compose up -d

# 6. Wait for PostgreSQL to be ready, then run migrations
sleep 5
pnpm --filter @sa-lms/database migrate:dev

# 7. Seed with test data (compliance frameworks, super admin, sample courses)
pnpm --filter @sa-lms/database seed

# 8. Start everything in dev mode (hot reload)
pnpm dev

# Verify all running:
# API:       http://localhost:3001/api/v1/health
# Frontend:  http://localhost:5173
# MinIO UI:  http://localhost:9001  (user: minioadmin / minioadmin)
# Mailhog:   http://localhost:8025
# PgAdmin:   http://localhost:5050  (admin@local.dev / admin)
```

### 6.3 Environment Variables — Complete Reference

```bash
# apps/api/.env

# ─── Database ───────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://sa_lms_app:password@localhost:5432/sa_lms_dev"
TEST_DATABASE_URL="postgresql://sa_lms_app:password@localhost:5432/sa_lms_test"

# ─── Redis ──────────────────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ─── JWT ────────────────────────────────────────────────────────────────────
# Generate RSA key pair:
# openssl genrsa -out private.pem 2048
# openssl rsa -in private.pem -pubout -out public.pem
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_REFRESH_SECRET="$(openssl rand -hex 64)"   # 64-byte random hex
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# ─── Security ───────────────────────────────────────────────────────────────
ARGON2_PEPPER="$(openssl rand -hex 64)"        # Password pepper
ENCRYPTION_KEY="$(openssl rand -hex 32)"       # AES-256-GCM for MFA secrets (32 bytes = 64 hex)
CERT_VERIFICATION_SECRET="$(openssl rand -hex 32)"  # For verification_hash

# ─── S3 / MinIO ─────────────────────────────────────────────────────────────
S3_ENDPOINT="http://localhost:9000"    # Remove for AWS S3 (uses default endpoint)
S3_BUCKET="sa-lms-local"
S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
S3_PUBLIC_URL="http://localhost:9000/sa-lms-local"  # Base URL for serving files

# ─── Email (Mailhog for dev) ─────────────────────────────────────────────────
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
EMAIL_FROM_NAME="SA-LMS"
EMAIL_FROM_ADDRESS="noreply@sa-lms.dev"

# ─── Puppeteer PDF Service ───────────────────────────────────────────────────
PUPPETEER_SERVICE_URL="http://localhost:3002"

# ─── App ────────────────────────────────────────────────────────────────────
PORT="3001"
NODE_ENV="development"
LOG_LEVEL="debug"
FRONTEND_URL="http://localhost:5173"
API_URL="http://localhost:3001"
CERT_VERIFICATION_BASE_URL="http://localhost:5173"

# ─── Rate Limiting ───────────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS="900000"   # 15 minutes
RATE_LIMIT_MAX_LOGIN="5"
RATE_LIMIT_MAX_API="100"
```

```bash
# apps/web/.env
VITE_API_URL="http://localhost:3001/api/v1"
VITE_CERT_VERIFY_URL="http://localhost:5173/verify"
```

### 6.4 Docker Compose (docker-compose.yml)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sa_lms_dev
      POSTGRES_USER: sa_lms_app
      POSTGRES_PASSWORD: password
    ports: ['5432:5432']
    volumes: ['postgres_data:/var/lib/postgresql/data']
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sa_lms_app"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    command: redis-server --appendonly yes
    volumes: ['redis_data:/data']

  minio:
    image: minio/minio:latest
    command: server /data --console-address ':9001'
    ports: ['9000:9000', '9001:9001']
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes: ['minio_data:/data']
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]

  mailhog:
    image: mailhog/mailhog:latest
    ports: ['1025:1025', '8025:8025']

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@local.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports: ['5050:80']
    depends_on: [postgres]

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 6.5 Turbo Configuration (turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "env": ["TEST_DATABASE_URL", "REDIS_URL"]
    },
    "lint": {},
    "typecheck": {}
  }
}
```

---

## 7. BACKEND DEVELOPMENT GUIDE

### 7.1 App Factory Pattern

```typescript
// apps/api/src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestLogger } from './middleware/request-log';
import { errorHandler } from './middleware/error-handler';
import { router } from './routes';

export function createApp() {
  const app = express();

  // 1. Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        mediaSrc: [process.env.CDN_URL || "'self'"],
      },
    },
    hsts: { maxAge: 63072000, includeSubDomains: true },
  }));

  // 2. CORS
  app.use(cors({
    origin: [process.env.FRONTEND_URL!],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));

  // 3. Body parsing
  app.use(express.json({ limit: '10mb' }));

  // 4. Request logging
  app.use(requestLogger);

  // 5. Routes
  app.use('/api/v1', router);

  // 6. Health check (no auth)
  app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // 7. Global error handler (MUST be last)
  app.use(errorHandler);

  return app;
}
```

### 7.2 AppError Class

```typescript
// apps/api/src/lib/app-error.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,    // Machine-readable: 'USER_NOT_FOUND'
    public readonly message: string, // Human-readable: 'User does not exist'
    public readonly statusCode: number,
    public readonly details?: unknown, // Zod errors, field errors
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Standard error codes — use these consistently
export const ErrorCodes = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_INVALID: 'MFA_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  // Permissions
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // Business logic
  MAX_ATTEMPTS_REACHED: 'MAX_ATTEMPTS_REACHED',
  ATTEMPT_EXPIRED: 'ATTEMPT_EXPIRED',
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  ENROLLMENT_EXISTS: 'ENROLLMENT_EXISTS',
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### 7.3 Global Error Handler

```typescript
// apps/api/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/app-error';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = uuidv4();

  if (err instanceof AppError) {
    // Known application error — expected
    logger.warn({ err, requestId, path: req.path }, 'AppError');
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details, requestId },
    });
  }

  if (err instanceof ZodError) {
    // Validation error — unexpected (should be caught in validate middleware)
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
        requestId,
      },
    });
  }

  // Unknown error — log fully, return sanitised response
  logger.error({ err, requestId, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId },
  });
}
```

### 7.4 Authentication Middleware

```typescript
// apps/api/src/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCodes } from '../lib/app-error';

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_PUBLIC_KEY!, {
      algorithms: ['RS256'],
    }) as RequestUser & { sub: string };

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(ErrorCodes.TOKEN_EXPIRED, 'Token has expired', 401);
    }
    throw new AppError(ErrorCodes.TOKEN_INVALID, 'Invalid token', 401);
  }
}
```

### 7.5 RBAC Authorize Middleware

```typescript
// apps/api/src/middleware/authorize.ts
export function authorize(
  allowedRoles: string[],
  options?: { sameTenantOnly?: boolean }
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user!;

    if (!allowedRoles.includes(user.role)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403);
    }

    if (options?.sameTenantOnly && user.role !== 'super_admin') {
      const resourceTenantId =
        req.params.tenantId ?? req.body?.tenantId ?? req.query?.tenantId;
      if (resourceTenantId && resourceTenantId !== user.tenantId) {
        throw new AppError(ErrorCodes.FORBIDDEN, 'Cross-tenant access denied', 403);
      }
    }

    next();
  };
}
```

### 7.6 Zod Validation Middleware

```typescript
// apps/api/src/middleware/validate.ts
import { AnyZodObject, z } from 'zod';

export function validate(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Validation failed',
          422,
          err.flatten().fieldErrors,
        );
      }
      next(err);
    }
  };
}

// Usage: router.post('/', validate(z.object({ body: CreateTenantSchema })), handler)
```

### 7.7 RLS Context Setter

```typescript
// apps/api/src/middleware/set-rls.ts
// MUST run after authenticate middleware
export function setRLSContext(req: Request, _res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return next();

  // Set PostgreSQL session variables for RLS policies
  // This is done per-query in the repository base class
  (req as any).rlsContext = {
    tenantId: user.tenantId ?? 'system',
    role: user.role,
  };
  next();
}

// apps/api/src/repositories/base.repository.ts
export class BaseRepository {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Wrap any query that needs RLS in this
  protected async withRLS<T>(
    tenantId: string | null,
    role: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId ?? 'system'}`;
      await tx.$executeRaw`SET LOCAL app.current_role = ${role}`;
      return fn(tx);
    });
  }
}
```

### 7.8 Route Pattern

```typescript
// apps/api/src/routes/tenants.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { TenantService } from '../services/tenant.service';
import { CreateTenantSchema, UpdateTenantSchema } from '@sa-lms/types';
import { z } from 'zod';

const router = Router();
const tenantService = new TenantService(/* inject deps */);

// List tenants
router.get('/',
  authenticate,
  authorize(['super_admin']),
  validate(z.object({ query: z.object({ page: z.coerce.number().default(1), limit: z.coerce.number().default(20), status: z.string().optional() }) })),
  async (req, res) => {
    const result = await tenantService.list(req.query as any);
    res.json({ data: result.data, meta: result.meta });
  }
);

// Create tenant
router.post('/',
  authenticate,
  authorize(['super_admin']),
  validate(z.object({ body: CreateTenantSchema })),
  async (req, res) => {
    const tenant = await tenantService.create(req.user!, req.body);
    res.status(201).json({ data: tenant });
  }
);

// Assign compliance (triggers auto-enrollment job)
router.post('/:tenantId/compliance',
  authenticate,
  authorize(['super_admin']),
  validate(z.object({
    params: z.object({ tenantId: z.string().uuid() }),
    body: z.object({ complianceIds: z.array(z.string().uuid()), effectiveDate: z.string(), dueDateDays: z.number().default(30) })
  })),
  async (req, res) => {
    const jobId = await tenantService.assignCompliance(req.user!, req.params.tenantId, req.body);
    res.status(202).json({ jobId, status: 'queued', message: 'Auto-enrollment processing started' });
  }
);

export { router as tenantRouter };
```

---

## 8. FRONTEND DEVELOPMENT GUIDE

### 8.1 API Client Setup

```typescript
// apps/web/src/lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Required for refresh token cookie
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → silent refresh → retry
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

### 8.2 Auth Store (Zustand)

```typescript
// apps/web/src/stores/auth.store.ts
import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'tenant_admin' | 'ciso' | 'student';
  tenantId: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));

// Helper hook for role checks
export const usePermissions = () => {
  const role = useAuthStore((s) => s.user?.role);
  return {
    isSuperAdmin: role === 'super_admin',
    isTenantAdmin: role === 'tenant_admin',
    isCISO: role === 'ciso',
    isStudent: role === 'student',
    isAdminLevel: ['super_admin', 'tenant_admin', 'ciso'].includes(role ?? ''),
  };
};
```

### 8.3 React Query Pattern

```typescript
// apps/web/src/features/super-admin/tenants/api/tenants.api.ts
import { apiClient } from '../../../../lib/api-client';
import { Tenant, CreateTenantDTO, PaginatedResponse } from '@sa-lms/types';

export const tenantsApi = {
  list: (params: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Tenant>>('/tenants', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<{ data: Tenant }>(`/tenants/${id}`).then((r) => r.data.data),

  create: (data: CreateTenantDTO) =>
    apiClient.post<{ data: Tenant }>('/tenants', data).then((r) => r.data.data),

  update: (id: string, data: Partial<CreateTenantDTO>) =>
    apiClient.patch<{ data: Tenant }>(`/tenants/${id}`, data).then((r) => r.data.data),

  assignCompliance: (tenantId: string, payload: { complianceIds: string[]; effectiveDate: string; dueDateDays: number }) =>
    apiClient.post(`/tenants/${tenantId}/compliance`, payload).then((r) => r.data),
};

// apps/web/src/features/super-admin/tenants/hooks/useTenants.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '../api/tenants.api';

export const TENANTS_QUERY_KEY = 'tenants';

export function useTenants(params = {}) {
  return useQuery({
    queryKey: [TENANTS_QUERY_KEY, params],
    queryFn: () => tenantsApi.list(params),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] }),
  });
}
```

### 8.4 Protected Route Component

```typescript
// apps/web/src/router/guards.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to their correct portal
    const redirectMap: Record<string, string> = {
      super_admin: '/super-admin',
      tenant_admin: '/tenant',
      ciso: '/tenant',
      student: '/student',
    };
    return <Navigate to={redirectMap[user.role] ?? '/login'} replace />;
  }

  return <>{children}</>;
}
```

### 8.5 Video Player Component

```typescript
// apps/web/src/features/student/viewer/VideoPlayer.tsx
import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { useUpdateProgress } from '../hooks/useProgress';
import { debounce } from 'lodash';

interface VideoPlayerProps {
  src: string;           // HLS .m3u8 manifest URL
  enrollmentId: string;
  lessonId: string;
  initialPosition?: number; // Resume from this second
  onComplete: () => void;
}

export function VideoPlayer({ src, enrollmentId, lessonId, initialPosition = 0, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const completedRef = useRef(false);
  const updateProgress = useUpdateProgress();

  // Debounced progress save — fires max once per 10 seconds
  const saveProgress = useCallback(
    debounce((position: number) => {
      updateProgress.mutate({ enrollmentId, lessonId, videoPosition: Math.floor(position), status: 'in_progress' });
    }, 10000),
    [enrollmentId, lessonId]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ startPosition: initialPosition });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src; // Safari native HLS
      video.currentTime = initialPosition;
    }

    const handleTimeUpdate = () => {
      const pct = video.currentTime / video.duration;
      saveProgress(video.currentTime);

      // Mark complete at 90% — do once
      if (pct >= 0.9 && !completedRef.current) {
        completedRef.current = true;
        updateProgress.mutate({
          enrollmentId, lessonId,
          videoPosition: Math.floor(video.currentTime),
          status: 'completed',
          videoCompletedPct: 90,
        });
        onComplete();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      hlsRef.current?.destroy();
      saveProgress.cancel();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full rounded-lg"
      playsInline
    />
  );
}
```

---

## 9. BUSINESS LOGIC ENGINES

### 9.1 Auto-Enrollment Engine — Complete Implementation

**Four trigger types — handle ALL of them:**

| Trigger | When | Entry Point |
|---------|------|-------------|
| T1 | Tenant assigned compliance framework | `POST /tenants/:id/compliance` |
| T2 | New user added to a tenant | After `user.service.create()` |
| T3 | Course published with compliance tag | `POST /courses/:id/publish` |
| T4 | Course added to existing active compliance | Course-compliance mapping creation |

```typescript
// apps/api/src/workers/enrollment.worker.ts
import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { emailQueue } from '../queues';

interface AutoEnrollJobData {
  triggerType: 'T1' | 'T2' | 'T3' | 'T4';
  tenantId?: string;
  complianceId?: string;
  userId?: string;
  courseId?: string;
}

export const enrollmentWorker = new Worker<AutoEnrollJobData>(
  'auto-enrollment',
  async (job: Job<AutoEnrollJobData>) => {
    const { triggerType, tenantId, complianceId, userId, courseId } = job.data;
    logger.info({ jobId: job.id, triggerType }, 'Auto-enrollment job started');

    // Step 1: Resolve (userIds[], courseIds[]) pairs based on trigger
    let userIds: string[] = [];
    let courseIds: string[] = [];
    let resolvedTenantId = tenantId;

    if (triggerType === 'T1' && tenantId && complianceId) {
      // Tenant ← Compliance: enroll all tenant users in all compliance courses
      courseIds = await getCourseIdsForCompliance(complianceId);
      userIds = await getActiveUserIdsForTenant(tenantId);
    } else if (triggerType === 'T2' && userId && tenantId) {
      // New user: enroll in all courses for all active tenant compliances
      const complianceIds = await getComplianceIdsForTenant(tenantId);
      courseIds = await getCourseIdsForCompliances(complianceIds);
      userIds = [userId];
    } else if ((triggerType === 'T3' || triggerType === 'T4') && courseId && complianceId) {
      // Course published: enroll all users of tenants that have this compliance
      const tenantIds = await getTenantIdsForCompliance(complianceId);
      userIds = [];
      for (const tid of tenantIds) {
        userIds.push(...(await getActiveUserIdsForTenant(tid)));
      }
      courseIds = [courseId];
      resolvedTenantId = undefined; // Multi-tenant case
    }

    if (userIds.length === 0 || courseIds.length === 0) {
      logger.info({ jobId: job.id }, 'No users or courses to enroll — skipping');
      return { enrolled: 0 };
    }

    // Step 2: Get due date config
    const dueDateDays = tenantId && complianceId
      ? await getTenantDueDateDays(tenantId, complianceId)
      : 30;

    // Step 3: Idempotent bulk insert (ON CONFLICT DO NOTHING = safe to re-run)
    const now = new Date();
    const dueDate = new Date(now.getTime() + dueDateDays * 24 * 60 * 60 * 1000);

    // Build individual insert data for each pair
    const enrollmentData = userIds.flatMap(uid =>
      courseIds.map(cid => ({
        userId: uid,
        courseId: cid,
        tenantId: resolvedTenantId ?? (/* lookup user's tenant */ null),
        enrollmentType: 'auto_compliance' as const,
        dueDate,
      }))
    );

    // Use createMany with skipDuplicates (Prisma's ON CONFLICT DO NOTHING)
    const result = await prisma.enrollment.createMany({
      data: enrollmentData,
      skipDuplicates: true,  // This is the idempotency guarantee
    });

    logger.info({ jobId: job.id, enrolled: result.count }, 'Auto-enrollment complete');

    // Step 4: Queue welcome emails for newly created enrollments
    // Fetch enrollments created in last 10 seconds (new ones)
    const newEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: { in: userIds },
        courseId: { in: courseIds },
        enrolledAt: { gte: new Date(now.getTime() - 10000) },
      },
      include: { user: true, course: true },
    });

    for (const enrollment of newEnrollments) {
      await emailQueue.add(
        'enrollment-welcome',
        { enrollmentId: enrollment.id },
        { delay: 5000, attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
    }

    // Step 5: Audit log
    await prisma.auditLog.create({
      data: {
        actorEmail: 'system',
        actorRole: 'super_admin',
        tenantId: resolvedTenantId ?? null,
        action: 'AUTO_ENROLLED',
        entityType: 'enrollment',
        afterState: { count: result.count, triggerType, userCount: userIds.length, courseCount: courseIds.length },
      },
    });

    return { enrolled: result.count };
  },
  { connection: redis, concurrency: 3 }
);

// Helper functions
async function getCourseIdsForCompliance(complianceId: string): Promise<string[]> {
  const mappings = await prisma.courseComplianceMapping.findMany({
    where: { complianceId, isMandatory: true, course: { status: 'published', deletedAt: null } },
    select: { courseId: true },
  });
  return mappings.map(m => m.courseId);
}

async function getActiveUserIdsForTenant(tenantId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { tenantId, status: 'active', deletedAt: null },
    select: { id: true },
  });
  return users.map(u => u.id);
}

async function getComplianceIdsForTenant(tenantId: string): Promise<string[]> {
  const mappings = await prisma.tenantComplianceMapping.findMany({
    where: { tenantId },
    select: { complianceId: true },
  });
  return mappings.map(m => m.complianceId);
}

async function getCourseIdsForCompliances(complianceIds: string[]): Promise<string[]> {
  const mappings = await prisma.courseComplianceMapping.findMany({
    where: { complianceId: { in: complianceIds }, isMandatory: true, course: { status: 'published' } },
    select: { courseId: true },
  });
  return [...new Set(mappings.map(m => m.courseId))]; // Deduplicate
}

async function getTenantIdsForCompliance(complianceId: string): Promise<string[]> {
  const mappings = await prisma.tenantComplianceMapping.findMany({
    where: { complianceId, tenant: { status: 'active' } },
    select: { tenantId: true },
  });
  return mappings.map(m => m.tenantId);
}

async function getTenantDueDateDays(tenantId: string, complianceId: string): Promise<number> {
  const mapping = await prisma.tenantComplianceMapping.findUnique({
    where: { tenantId_complianceId: { tenantId, complianceId } },
    select: { dueDateDays: true },
  });
  return mapping?.dueDateDays ?? 30;
}
```

### 9.2 Course Completion & Certificate Engine

```typescript
// apps/api/src/services/completion.service.ts

export class CompletionService {
  async checkAndComplete(enrollmentId: string): Promise<void> {
    // Single optimised query — check everything at once
    const result = await prisma.$queryRaw<Array<{
      total_mandatory: bigint;
      completed_mandatory: bigint;
      has_assessment: boolean;
      assessment_passed: boolean;
      enrollment_status: string;
    }>>`
      SELECT
        COUNT(l.id) FILTER (WHERE l.is_mandatory = true)              AS total_mandatory,
        COUNT(lp.id) FILTER (WHERE lp.status = 'completed' AND l.is_mandatory = true) AS completed_mandatory,
        BOOL_OR(l.type = 'assessment')                                AS has_assessment,
        BOOL_OR(qa.passed = true)                                     AS assessment_passed,
        e.status                                                      AS enrollment_status
      FROM enrollments e
      JOIN courses c      ON c.id = e.course_id
      JOIN modules m      ON m.course_id = c.id
      JOIN lessons l      ON l.module_id = m.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
      LEFT JOIN quizzes q  ON q.lesson_id = l.id AND l.type = 'assessment'
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
                                AND qa.enrollment_id = e.id
                                AND qa.status = 'submitted'
      WHERE e.id = ${enrollmentId}::uuid
      GROUP BY e.status
    `;

    if (!result[0]) return;

    const {
      total_mandatory,
      completed_mandatory,
      has_assessment,
      assessment_passed,
      enrollment_status,
    } = result[0];

    // Already terminal — do not reprocess
    if (['completed', 'failed'].includes(enrollment_status)) return;

    const allLessonsDone = Number(completed_mandatory) >= Number(total_mandatory);
    const quizRequirementMet = !has_assessment || assessment_passed;

    if (allLessonsDone && quizRequirementMet) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'completed', completedAt: new Date(), progressPercent: 100 },
      });

      // Queue certificate generation — HIGH PRIORITY
      await certQueue.add(
        'generate',
        { enrollmentId },
        { priority: 1, attempts: 5, backoff: { type: 'exponential', delay: 10000 } }
      );
    } else {
      // Update progress percentage
      const pct = total_mandatory > 0
        ? Math.round((Number(completed_mandatory) / Number(total_mandatory)) * 100)
        : 0;

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'in_progress', progressPercent: pct },
      });
    }
  }
}
```

### 9.3 Certificate Generation Worker

```typescript
// apps/api/src/workers/certificate.worker.ts
import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { uploadToS3 } from '../lib/s3';
import { createHash } from 'crypto';
import axios from 'axios';

export const certWorker = new Worker<{ enrollmentId: string }>(
  'certificate',
  async (job: Job) => {
    const { enrollmentId } = job.data;

    // 1. Fetch all data needed for certificate
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: { include: { certificateTemplate: true } },
        tenant: true,
        quizAttempts: { where: { status: 'submitted', passed: true }, orderBy: { submittedAt: 'desc' }, take: 1 },
      },
    });

    // 2. Get or assign certificate template
    const template = enrollment.course.certificateTemplate
      ?? await prisma.certificateTemplate.findFirst({ where: { isDefault: true } });
    if (!template) throw new Error('No certificate template found');

    // 3. Generate certificate number (CERT-2026-ACME-00142)
    const certNumber = await generateCertNumber(
      enrollment.tenantId ?? 'ind',
      enrollment.tenant?.slug ?? 'individual'
    );

    // 4. Generate verification hash
    const verificationHash = createHash('sha256')
      .update(`${enrollmentId}${certNumber}${Date.now()}${process.env.CERT_VERIFICATION_SECRET}`)
      .digest('hex');

    // 5. Create certificate record (pdf_url = null initially)
    const certificate = await prisma.certificate.create({
      data: {
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        enrollmentId,
        tenantId: enrollment.tenantId,
        certificateNumber: certNumber,
        score: enrollment.quizAttempts[0]?.score ?? 100,
        issuedAt: new Date(),
        verificationHash,
        templateId: template.id,
      },
    });

    // 6. Render HTML template with merge fields
    const score = enrollment.quizAttempts[0]?.score ?? 100;
    const html = template.htmlTemplate
      .replace(/{{student_name}}/g, `${enrollment.user.firstName} ${enrollment.user.lastName}`)
      .replace(/{{course_title}}/g, enrollment.course.title)
      .replace(/{{issue_date}}/g, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
      .replace(/{{cert_number}}/g, certNumber)
      .replace(/{{score}}/g, String(score))
      .replace(/{{org_name}}/g, enrollment.tenant?.name ?? 'Individual')
      .replace(/{{logo_url}}/g, enrollment.tenant?.logoUrl ?? '')
      .replace(/{{verify_url}}/g, `${process.env.CERT_VERIFICATION_BASE_URL}/verify/${verificationHash}`);

    // 7. Generate PDF via Puppeteer service
    const pdfResponse = await axios.post<Buffer>(
      `${process.env.PUPPETEER_SERVICE_URL}/generate-pdf`,
      { html },
      { responseType: 'arraybuffer', timeout: 30000 }
    );

    // 8. Upload PDF to S3
    const pdfKey = `certificates/${enrollment.tenantId ?? 'individual'}/${enrollment.userId}/${certificate.id}.pdf`;
    const pdfUrl = await uploadToS3(pdfKey, Buffer.from(pdfResponse.data), 'application/pdf');

    // 9. Update certificate with PDF URL
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { pdfUrl, pdfGeneratedAt: new Date() },
    });

    // 10. Link certificate to enrollment
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { certificateId: certificate.id },
    });

    // 11. Queue congratulations email
    await emailQueue.add('certificate-issued', {
      userId: enrollment.userId,
      certificateId: certificate.id,
    });

    logger.info({ certNumber, userId: enrollment.userId }, 'Certificate generated');
    return { certificateId: certificate.id, certNumber };
  },
  { connection: redis, concurrency: 2 }
);

async function generateCertNumber(tenantId: string, tenantSlug: string): Promise<string> {
  const year = new Date().getFullYear();
  const slug = tenantSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

  // Get next sequence for this tenant + year
  const result = await prisma.$queryRaw<[{ next_seq: number }]>`
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(certificate_number, '-', 4) AS INTEGER)
    ), 0) + 1 AS next_seq
    FROM certificates
    WHERE tenant_id = ${tenantId}::uuid
    AND EXTRACT(YEAR FROM issued_at) = ${year}
  `;

  const seq = String(result[0].next_seq).padStart(5, '0');
  return `CERT-${year}-${slug}-${seq}`;
  // Unique constraint on certificate_number handles race conditions
}
```

### 9.4 Quiz Assessment Engine — Edge Cases

```typescript
// apps/api/src/services/quiz.service.ts

async submitAttempt(userId: string, attemptId: string, submittedAnswers: SubmittedAnswer[]): Promise<AttemptResult> {
  const attempt = await prisma.quizAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { quiz: { include: { questions: { include: { answers: true } } } } },
  });

  // Edge Case 1: Verify attempt belongs to this user
  if (attempt.userId !== userId) throw new AppError(ErrorCodes.FORBIDDEN, 'Not your attempt', 403);

  // Edge Case 2: Already submitted
  if (attempt.status === 'submitted') {
    return { score: attempt.score!, passed: attempt.passed!, alreadySubmitted: true };
  }

  // Edge Case 3: Timer expired (server-side validation — never trust client)
  if (attempt.expiresAt && new Date() > new Date(attempt.expiresAt.getTime() + 30000)) {
    // 30-second grace window for network latency
    await prisma.quizAttempt.update({ where: { id: attemptId }, data: { status: 'expired' } });
    throw new AppError(ErrorCodes.ATTEMPT_EXPIRED, 'Quiz time has expired', 422);
  }

  // Calculate score
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const question of attempt.quiz.questions) {
    const submitted = submittedAnswers.find(a => a.questionId === question.id);
    const correctAnswerIds = question.answers.filter(a => a.isCorrect).map(a => a.id);
    totalPoints += question.points;

    if (!submitted) continue;

    if (question.type === 'single_choice' || question.type === 'true_false') {
      if (submitted.selectedAnswerIds[0] === correctAnswerIds[0]) {
        earnedPoints += question.points;
      }
    } else if (question.type === 'multi_choice') {
      // Edge Case 4: Multi-choice — ALL correct AND NO incorrect = full marks
      const selectedSet = new Set(submitted.selectedAnswerIds);
      const correctSet = new Set(correctAnswerIds);
      const allCorrectSelected = correctAnswerIds.every(id => selectedSet.has(id));
      const noIncorrectSelected = submitted.selectedAnswerIds.every(id => correctSet.has(id));
      if (allCorrectSelected && noIncorrectSelected) earnedPoints += question.points;
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= attempt.quiz.passingScore;

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'submitted',
      score,
      passed,
      answers: submittedAnswers,
      submittedAt: new Date(),
    },
  });

  // Trigger completion check
  await completionService.checkAndComplete(attempt.enrollmentId);

  // Edge Case 5: Max attempts reached and still failed
  if (!passed && attempt.quiz.maxAttempts > 0) {
    const attemptCount = await prisma.quizAttempt.count({
      where: { quizId: attempt.quizId, enrollmentId: attempt.enrollmentId, status: 'submitted' },
    });
    if (attemptCount >= attempt.quiz.maxAttempts) {
      await prisma.enrollment.update({
        where: { id: attempt.enrollmentId },
        data: { status: 'failed', failedAt: new Date() },
      });
    }
  }

  return { score, passed, feedback: attempt.quiz.showFeedback ? buildFeedback(attempt.quiz, submittedAnswers) : null };
}
```

---

## 10. API SPECIFICATION

### 10.1 Response Format — ALWAYS follow this

```typescript
// Success — single resource
{ "data": { ...resource }, "meta": { "requestId": "uuid" } }

// Success — list (ALWAYS paginated)
{ "data": [...], "meta": { "total": 150, "page": 1, "limit": 20, "pages": 8, "requestId": "uuid" } }

// Success — async job queued (202)
{ "jobId": "bullmq-job-id", "status": "queued", "message": "Processing started" }

// Error
{ "error": { "code": "USER_NOT_FOUND", "message": "User does not exist", "details": null, "requestId": "uuid" } }
```

### 10.2 Complete Endpoint List

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Login. Returns mfa_required or tokens |
| POST | `/auth/mfa/verify` | Temp token | Verify TOTP. Returns full tokens |
| POST | `/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | JWT | Invalidate session |
| GET | `/auth/sso/saml/init?tenant=slug` | None | Redirect to IdP |
| POST | `/auth/sso/saml/callback` | None | SAML assertion handler |
| POST | `/auth/password/reset-request` | None | Send reset email |
| POST | `/auth/password/reset` | Reset token | Confirm new password |
| GET | `/tenants` | super_admin | List with filters |
| POST | `/tenants` | super_admin | Create tenant |
| GET | `/tenants/:id` | super_admin | Get detail |
| PATCH | `/tenants/:id` | super_admin | Update |
| DELETE | `/tenants/:id` | super_admin | Soft delete |
| POST | `/tenants/:id/compliance` | super_admin | Assign compliance (→ auto-enroll job) |
| DELETE | `/tenants/:id/compliance/:cid` | super_admin | Remove mapping |
| GET | `/tenants/:id/stats` | admin levels | Dashboard stats |
| GET | `/users` | admin levels | List users (tenant-scoped) |
| POST | `/users` | admin levels | Create + optional course assignment |
| GET | `/users/:id` | admin + scope | Profile + enrollment summary |
| PATCH | `/users/:id` | admin + scope | Update |
| DELETE | `/users/:id` | admin + scope | Soft delete |
| POST | `/users/bulk-import` | admin levels | CSV upload → job |
| GET | `/users/bulk-import/:jobId` | admin levels | Poll import status |
| POST | `/users/:id/send-reminder` | admin levels | Queue reminder email |
| GET | `/compliance` | super_admin | List frameworks |
| POST | `/compliance` | super_admin | Create framework |
| GET | `/courses` | all | List (published for students) |
| POST | `/courses` | super_admin | Create (draft) |
| GET | `/courses/:id` | all | Detail + module tree |
| PATCH | `/courses/:id` | super_admin | Update |
| POST | `/courses/:id/publish` | super_admin | Publish + trigger T3 enrollment |
| POST | `/courses/:id/modules` | super_admin | Add module |
| PATCH | `/courses/:id/modules/:mid` | super_admin | Update module |
| POST | `/courses/:id/modules/:mid/lessons` | super_admin | Add lesson |
| PATCH | `/courses/:id/modules/:mid/lessons/:lid` | super_admin | Update lesson |
| POST | `/courses/:id/modules/:mid/lessons/:lid/video` | super_admin | Upload video → HLS |
| GET | `/enrollments` | all (scoped) | List enrollments |
| PATCH | `/enrollments/:id` | admin | Update due date etc |
| POST | `/enrollments/:id/progress` | student | Update lesson progress |
| GET | `/quizzes/:id` | student | Get quiz (answers shuffled, correct hidden) |
| POST | `/quizzes/:id/attempts` | student | Start attempt |
| POST | `/quizzes/:id/attempts/:aid/submit` | student | Submit answers |
| GET | `/quizzes/:id/attempts` | student | List own attempts |
| GET | `/certificates` | all (scoped) | List certificates |
| GET | `/certificates/:id/download` | owner + admin | Presigned S3 URL |
| GET | `/verify/:hash` | None (PUBLIC) | Verify certificate |
| POST | `/certificate-templates` | super_admin | Upload template |
| GET | `/audit-logs` | admin (scoped) | Paginated audit log |
| GET | `/audit-logs/export` | admin (scoped) | CSV download |
| GET | `/platform/health` | super_admin | CPU/RAM/DB/queue metrics |
