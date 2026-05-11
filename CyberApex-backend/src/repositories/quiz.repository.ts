import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class QuizRepository extends BaseRepository {
  async findById(quizId: string) {
    return this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { answers: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findAttemptById(attemptId: string) {
    return this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: { include: { answers: true } },
          },
        },
      },
    });
  }

  async createAttempt(data: Prisma.QuizAttemptCreateInput) {
    return this.prisma.quizAttempt.create({ data });
  }

  async updateAttempt(id: string, data: Prisma.QuizAttemptUpdateInput) {
    return this.prisma.quizAttempt.update({ where: { id }, data });
  }

  async countAttempts(quizId: string, enrollmentId: string, status = 'submitted'): Promise<number> {
    return this.prisma.quizAttempt.count({
      where: { quizId, enrollmentId, status: status as any },
    });
  }

  async findAttemptsByEnrollment(enrollmentId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { enrollmentId },
      orderBy: { startedAt: 'desc' },
    });
  }
}
