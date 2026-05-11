import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logger } from './lib/logger';
import { redis } from './lib/redis';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middlewares/request-id';
import { validateAuthEnvironment } from './services/auth.service';

// ── Workers (start with server) ───────────────────────────────────────────────
import './workers/enrollment.worker';
import './workers/certificate.worker';
import './workers/email.worker';
import './workers/video.worker';
import './workers/import.worker';
import { startHealthScoreCron } from './workers/health-score.worker';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes        from './routes/auth.routes';
import enrollmentRoutes  from './routes/enrollment.routes';
import quizRoutes        from './routes/quiz.routes';
import certificateRoutes from './routes/certificate.routes';
import complianceRoutes  from './routes/compliance.routes';
import tenantsRoutes     from './routes/tenants.routes';
import usersRoutes       from './routes/users.routes';
import coursesRoutes     from './routes/courses.routes';
import studentsRoutes    from './routes/students.routes';

// ── Legacy JS routes (still active for backward compat) ───────────────────────
// ⚠️ IMPORTANT: Two auth systems exist. Use v1 routes for new development:
//   - /api/v1/auth/* → Modern TS + Prisma + RS256 tokens + Argon2 hashing
//   - /api/auth/*    → Legacy JS  + Sequelize + HS256 tokens + bcrypt
const legacyAuth        = require('./routes/auth');
const legacyAdmin       = require('./routes/admin');
const legacyTenants     = require('./routes/tenants');
const legacyTenantUsers = require('./routes/tenantUsers');
const legacyStudents    = require('./routes/students');
const legacyStudentPortal = require('./routes/student');
const legacyCiso        = require('./routes/ciso');
const legacyTenantAdmin = require('./routes/tenantAdmin');
const legacyPhishing    = require('./routes/phishing');
const legacyAuditLog    = require('./routes/auditLog');
const legacyContentLibrary = require('./routes/contentLibrary');
const legacyCourses = require('./routes/courses');
const legacyPlatformHealth = require('./routes/platformHealth');

const app  = express();
const port = Number(process.env.PORT ?? 5000);

// ── Security ──────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc:   [process.env.CDN_URL ?? "'self'"],
    },
  },
  hsts: { maxAge: 63_072_000, includeSubDomains: true },
}));

app.use(cors({
  origin:      process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(requestId);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ── New TypeScript Routes (v1) ────────────────────────────────────────────────
app.use('/api/v1/auth',         authRoutes);
app.use('/api/v1/enrollments',  enrollmentRoutes);
app.use('/api/v1/quizzes',      quizRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/verify',       certificateRoutes); // Public verify alias
app.use('/api/v1/compliance',   complianceRoutes);
app.use('/api/v1/tenants',      tenantsRoutes);
app.use('/api/v1/tenants/:tenantId/users', usersRoutes);
app.use('/api/v1/courses',      coursesRoutes);
app.use('/api/v1/admin/students', studentsRoutes);

// ── Legacy Routes (backward compatible) ──────────────────────────────────────
app.use('/api/auth',                    legacyAuth);
app.use('/api/student',                 legacyStudentPortal);
app.use('/api/admin/tenants',           legacyTenants);
app.use('/api/admin/tenants/:tenantId/users', legacyTenantUsers);
app.use('/api/admin/students',          legacyStudents);
app.use('/api/admin/platform-health',   legacyPlatformHealth);
app.use('/api/admin/content-library',   legacyContentLibrary);
app.use('/api/admin/courses',           legacyCourses);
app.use('/api/admin',                   legacyAdmin);
app.use('/api/ciso',                    legacyCiso);
app.use('/api/tenant',                  legacyTenantAdmin);
app.use('/api/ciso/phishing',           legacyPhishing);
app.use('/api/admin/audit-log',         legacyAuditLog);

// ── Catch-all 404 for API ──────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint not found: ${req.originalUrl}` });
});

// ── Error Handler (MUST be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  validateAuthEnvironment();

  const { connectDB } = require('./config/database');
  await connectDB();

  // Redis connection with health check
  try {
    await redis.connect();
    await redis.ping();
    logger.info('Redis connected and verified');
  } catch (err) {
    logger.error({ err }, 'Redis connection failed - some features may not work');
  }

  startHealthScoreCron();

  app.listen(port, () => {
    logger.info({ port, env: process.env.NODE_ENV }, 'CyberApex LMS API started');
  });
}

if (require.main === module) {
  start().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}

export default app;
