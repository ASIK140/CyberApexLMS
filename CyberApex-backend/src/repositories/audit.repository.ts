import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface AuditLogInput {
  actorId?: string;
  actorEmail: string;
  actorRole: string;
  tenantId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditRepository extends BaseRepository {
  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        actorRole: input.actorRole,
        tenantId: input.tenantId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeState: input.beforeState as Prisma.InputJsonValue,
        afterState: input.afterState as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async findMany(params: {
    tenantId?: string;
    actorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, actorId, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.AuditLogWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(actorId ? { actorId } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
