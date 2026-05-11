import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class EnrollmentRepository extends BaseRepository {
  async findById(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: { user: true, course: true, lessonProgress: true },
    });
  }

  async findByUserAndCourse(userId: string, courseId: string) {
    return this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { title: true, thumbnailUrl: true, durationMinutes: true } } },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findByTenant(
    tenantId: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.EnrollmentWhereInput = {
      tenantId,
      ...(status ? { status: status as any } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { title: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async bulkCreate(
    enrollments: Prisma.EnrollmentCreateManyInput[],
  ): Promise<{ count: number }> {
    return this.prisma.enrollment.createMany({
      data: enrollments,
      skipDuplicates: true,
    });
  }

  async update(id: string, data: Prisma.EnrollmentUpdateInput) {
    return this.prisma.enrollment.update({ where: { id }, data });
  }

  async upsertLessonProgress(
    enrollmentId: string,
    lessonId: string,
    userId: string,
    data: Prisma.LessonProgressUpdateInput,
  ) {
    return this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        userId,
        ...data,
      } as Prisma.LessonProgressCreateInput,
      update: data,
    });
  }

  async countOverdue(tenantId: string): Promise<number> {
    return this.prisma.enrollment.count({
      where: {
        tenantId,
        dueDate: { lt: new Date() },
        status: { notIn: ['completed', 'failed'] },
      },
    });
  }
}
