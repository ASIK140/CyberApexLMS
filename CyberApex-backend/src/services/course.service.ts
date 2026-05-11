import { prisma } from '../lib/prisma';
import { AppError, ErrorCodes } from '../lib/app-error';

export class CourseService {
  async list(params: { status?: string; search?: string } = {}) {
    const { status = 'published', search } = params;
    return prisma.course.findMany({
      where: {
        status: status as any,
        deletedAt: null,
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id, deletedAt: null },
      include: {
        modules: {
          include: {
            lessons: {
              include: { quiz: true },
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
    if (!course) throw new AppError(ErrorCodes.NOT_FOUND, 'Course not found', 404);
    return course;
  }

  async create(actor: any, data: any, ipAddress: string) {
    const course = await prisma.course.create({
      data: {
        ...data,
        createdBy: actor.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'COURSE_CREATED',
        entityType: 'course',
        entityId: course.id,
        afterState: course as any,
        ipAddress,
      },
    });

    return course;
  }
}

export const courseService = new CourseService();
