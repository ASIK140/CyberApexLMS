import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

interface AuditLogPayload {
  actorId?:    string;
  actorEmail:  string;
  actorRole:   string;
  tenantId?:   string | null;
  action:      string;
  entityType:  string;
  entityId?:   string | null;
  beforeState?: unknown;
  afterState?:  unknown;
  ipAddress?:  string;
  userAgent?:  string;
}

export const createAuditLog = async (payload: AuditLogPayload): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId:     payload.actorId,
        actorEmail:  payload.actorEmail,
        actorRole:   payload.actorRole,
        tenantId:    payload.tenantId,
        action:      payload.action,
        entityType:  payload.entityType,
        entityId:    payload.entityId,
        beforeState: payload.beforeState as any,
        afterState:  payload.afterState  as any,
        ipAddress:   payload.ipAddress,
        userAgent:   payload.userAgent,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create audit log');
  }
};
