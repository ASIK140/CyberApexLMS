import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const SA_TENANT = '00000000-0000-0000-0000-000000000000';

export class BaseRepository {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  protected async withRLS<T>(
    tenantId: string | null,
    role: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId ?? 'system'}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_role', ${role}, true)`;
      return fn(tx);
    });
  }

  protected async withSA<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.withRLS(SA_TENANT, 'super_admin', fn);
  }
}
