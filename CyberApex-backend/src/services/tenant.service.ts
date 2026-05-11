import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TenantRepository } from '../repositories/tenant.repository';
import { AppError, ErrorCodes } from '../lib/app-error';

const tenantRepo = new TenantRepository();

export class TenantService {
  async list(params: any) {
    return tenantRepo.findMany(params);
  }

  async getById(id: string) {
    const tenant = await tenantRepo.findById(id);
    if (!tenant) throw new AppError(ErrorCodes.NOT_FOUND, 'Tenant not found', 404);
    return tenant;
  }

  async create(actor: any, data: any, ipAddress: string) {
    const existing = await tenantRepo.findBySlug(data.slug);
    if (existing) throw new AppError(ErrorCodes.ALREADY_EXISTS, 'Tenant slug already exists', 409);

    const tenant = await tenantRepo.create({
      ...data,
      createdBy: actor.id,
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'TENANT_CREATED',
        entityType: 'tenant',
        entityId: tenant.id,
        afterState: tenant as any,
        ipAddress,
      },
    });

    return tenant;
  }

  async update(id: string, actor: any, data: any, ipAddress: string) {
    const before = await this.getById(id);
    const updated = await tenantRepo.update(id, data);

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        tenantId: id,
        action: 'TENANT_UPDATED',
        entityType: 'tenant',
        entityId: id,
        beforeState: before as any,
        afterState: updated as any,
        ipAddress,
      },
    });

    return updated;
  }
}

export const tenantService = new TenantService();
