import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository {
  async findByEmail(email: string) {
    return this.withSA((tx) =>
      tx.user.findFirst({ where: { email, deletedAt: null } })
    );
  }

  async findById(id: string) {
    return this.withSA((tx) =>
      tx.user.findFirst({ where: { id, deletedAt: null } })
    );
  }

  async findByTenant(
    tenantId: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ) {
    return this.withRLS(tenantId, 'tenant_admin', async (tx) => {
      const { page = 1, limit = 20, status } = params;
      const skip = (page - 1) * limit;
      const where: Prisma.UserWhereInput = {
        tenantId,
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
      };

      const data = await tx.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { enrollments: { select: { id: true, status: true } } },
      });
      const total = await tx.user.count({ where });

      return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.withSA((tx) => tx.user.create({ data }));
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.withSA((tx) => tx.user.update({ where: { id }, data }));
  }

  async softDelete(id: string) {
    return this.withSA((tx) =>
      tx.user.update({ where: { id }, data: { deletedAt: new Date() } })
    );
  }

  async getActiveUserIdsByTenant(tenantId: string): Promise<string[]> {
    const users = await this.withRLS(tenantId, 'tenant_admin', (tx) =>
      tx.user.findMany({
        where: { tenantId, status: 'active', deletedAt: null },
        select: { id: true },
      })
    );
    return users.map((u) => u.id);
  }
}
