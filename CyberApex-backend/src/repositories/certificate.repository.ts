import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class CertificateRepository extends BaseRepository {
  async findById(id: string) {
    return this.prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { title: true } },
        template: true,
      },
    });
  }

  async findByHash(verificationHash: string) {
    return this.prisma.certificate.findUnique({
      where: { verificationHash },
      include: {
        user: { select: { firstName: true, lastName: true } },
        course: { select: { title: true } },
        tenant: { select: { name: true } },
      },
    });
  }

  async findByEnrollment(enrollmentId: string) {
    return this.prisma.certificate.findUnique({ where: { enrollmentId } });
  }

  async findByUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId, revoked: false },
      include: { course: { select: { title: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async create(data: Prisma.CertificateCreateInput) {
    return this.prisma.certificate.create({ data });
  }

  async update(id: string, data: Prisma.CertificateUpdateInput) {
    return this.prisma.certificate.update({ where: { id }, data });
  }

  async getNextSequence(tenantId: string, year: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ next_seq: number }]>`
      SELECT COALESCE(MAX(
        CAST(SPLIT_PART(certificate_number, '-', 4) AS INTEGER)
      ), 0) + 1 AS next_seq
      FROM certificates
      WHERE tenant_id = ${tenantId}::uuid
        AND EXTRACT(YEAR FROM issued_at) = ${year}
    `;
    return result[0].next_seq;
  }

  async getDefaultTemplate() {
    return this.prisma.certificateTemplate.findFirst({ where: { isDefault: true } });
  }
}
