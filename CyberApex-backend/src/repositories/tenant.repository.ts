import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class TenantRepository extends BaseRepository {
  async findById(id: string) {
    return this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
  }

  async findMany(params: { page?: number; limit?: number; status?: string } = {}) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async create(data: Prisma.TenantCreateInput) {
    return this.prisma.tenant.create({ data });
  }

  async update(id: string, data: Prisma.TenantUpdateInput) {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getActiveIds(): Promise<string[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'active', deletedAt: null },
      select: { id: true },
    });
    return tenants.map((t) => t.id);
  }
}
