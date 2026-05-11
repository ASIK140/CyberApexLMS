import { Queue } from 'bullmq';
import { bullmqConnection } from '../lib/bullmq-connection';

const opts = { connection: bullmqConnection, skipVersionCheck: true };

export const enrollmentQueue = new Queue('auto-enrollment', opts);
export const certQueue       = new Queue('certificate',     opts);
export const emailQueue      = new Queue('email',           opts);
export const reportQueue     = new Queue('report',          opts);
export const videoQueue      = new Queue('video-processing', opts);
export const importQueue     = new Queue('bulk-import',     opts);
export const healthScoreQueue = new Queue('health-score',   opts);

// ─── Job Type Definitions ────────────────────────────────────────────────────

export interface AutoEnrollJob {
  triggerType: 'T1' | 'T2' | 'T3' | 'T4';
  tenantId?: string;
  complianceId?: string;
  userId?: string;
  courseId?: string;
}

export interface CertJob {
  enrollmentId: string;
}

export interface EmailJob {
  templateName: string;
  userId: string;
  enrollmentId?: string;
  certificateId?: string;
  data?: Record<string, unknown>;
}

export interface VideoJob {
  courseId: string;
  lessonId: string;
  inputKey: string; // S3 key of the original MP4
}

export interface BulkImportJob {
  tenantId: string;
  inputKey: string; // S3 key of the CSV file
  requestedBy: string; // actorId
}

export interface ReportJob {
  reportType: 'certified_users' | 'audit_log';
  tenantId: string;
  filters: Record<string, unknown>;
  requestedBy: string;
}

const JOB_DEFAULTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export async function addAutoEnrollJob(data: AutoEnrollJob) {
  return enrollmentQueue.add('auto-enroll', data, JOB_DEFAULTS);
}

export async function addCertJob(data: CertJob) {
  return certQueue.add('generate', data, { ...JOB_DEFAULTS, priority: 1, attempts: 5 });
}

export async function addEmailJob(data: EmailJob, delayMs = 0) {
  return emailQueue.add(data.templateName, data, { ...JOB_DEFAULTS, delay: delayMs });
}

export async function addVideoJob(data: VideoJob) {
  return videoQueue.add('transcode', data, { ...JOB_DEFAULTS, attempts: 1 });
}

export async function addImportJob(data: BulkImportJob) {
  return importQueue.add('process-csv', data, { ...JOB_DEFAULTS, attempts: 1 });
}
