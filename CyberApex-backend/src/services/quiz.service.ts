import { prisma } from '../lib/prisma';
import { AppError, ErrorCodes } from '../lib/app-error';
import { completionService } from './completion.service';
import { logger } from '../lib/logger';

export interface SubmittedAnswer {
  questionId: string;
  selectedAnswerIds: string[];
}

export interface AttemptResult {
  score: number;
  passed: boolean;
  alreadySubmitted?: boolean;
  feedback?: unknown;
}

export class QuizService {
  async getQuizForStudent(quizId: string) {
    const quiz = await prisma.quiz.findUniqueOrThrow({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            // Never expose isCorrect to the student
            answers: {
              select: { id: true, text: true, orderIndex: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (quiz.shuffleQuestions) {
      quiz.questions = quiz.questions.sort(() => Math.random() - 0.5);
    }
    if (quiz.shuffleAnswers) {
      quiz.questions = quiz.questions.map((q) => ({
        ...q,
        answers: q.answers.sort(() => Math.random() - 0.5),
      }));
    }

    return quiz;
  }

  async startAttempt(userId: string, quizId: string, enrollmentId: string) {
    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: quizId } });

    if (quiz.maxAttempts > 0) {
      const count = await prisma.quizAttempt.count({
        where: { quizId, enrollmentId, status: 'submitted' },
      });
      if (count >= quiz.maxAttempts) {
        throw new AppError(ErrorCodes.MAX_ATTEMPTS_REACHED, 'Maximum attempts reached', 422);
      }
    }

    const attemptNumber = (await prisma.quizAttempt.count({ where: { quizId, enrollmentId } })) + 1;
    const expiresAt =
      quiz.timeLimitSecs > 0
        ? new Date(Date.now() + quiz.timeLimitSecs * 1000)
        : null;

    return prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        enrollmentId,
        attemptNumber,
        expiresAt,
        status: 'in_progress',
      },
    });
  }

  async submitAttempt(
    userId: string,
    attemptId: string,
    submittedAnswers: SubmittedAnswer[],
  ): Promise<AttemptResult> {
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: {
        user: true,
        quiz: { include: { questions: { include: { answers: true } } } },
      },
    });

    if (attempt.userId !== userId) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Not your attempt', 403);
    }

    if (attempt.status === 'submitted') {
      return { score: attempt.score!, passed: attempt.passed!, alreadySubmitted: true };
    }

    // Server-side timer validation (30-second grace window)
    if (attempt.expiresAt && new Date() > new Date(attempt.expiresAt.getTime() + 30_000)) {
      await prisma.quizAttempt.update({ where: { id: attemptId }, data: { status: 'expired' } });
      throw new AppError(ErrorCodes.ATTEMPT_EXPIRED, 'Quiz time has expired', 422);
    }

    // Score calculation
    let totalPoints  = 0;
    let earnedPoints = 0;

    for (const question of attempt.quiz.questions) {
      const submitted      = submittedAnswers.find((a) => a.questionId === question.id);
      const correctIds     = question.answers.filter((a) => a.isCorrect).map((a) => a.id);
      totalPoints         += question.points;

      if (!submitted) continue;

      if (question.type === 'single_choice' || question.type === 'true_false') {
        if (submitted.selectedAnswerIds[0] === correctIds[0]) {
          earnedPoints += question.points;
        }
      } else if (question.type === 'multi_choice') {
        const selected   = new Set(submitted.selectedAnswerIds);
        const correct    = new Set(correctIds);
        const allCorrect = correctIds.every((id) => selected.has(id));
        const noWrong    = submitted.selectedAnswerIds.every((id) => correct.has(id));
        if (allCorrect && noWrong) earnedPoints += question.points;
      }
    }

    const score  = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= attempt.quiz.passingScore;

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { status: 'submitted', score, passed, answers: submittedAnswers as any, submittedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorEmail: attempt.user?.email || 'student',
        actorRole: 'student',
        tenantId: attempt.user?.tenantId,
        action: 'QUIZ_SUBMITTED',
        entityType: 'quiz_attempt',
        entityId: attemptId,
        afterState: { score, passed, quizId: attempt.quizId },
      },
    });

    // Trigger completion check
    await completionService.checkAndComplete(attempt.enrollmentId);

    // Handle max-attempts failure
    if (!passed && attempt.quiz.maxAttempts > 0) {
      const count = await prisma.quizAttempt.count({
        where: { quizId: attempt.quizId, enrollmentId: attempt.enrollmentId, status: 'submitted' },
      });
      if (count >= attempt.quiz.maxAttempts) {
        await prisma.enrollment.update({
          where: { id: attempt.enrollmentId },
          data: { status: 'failed', failedAt: new Date() },
        });
        logger.info({ enrollmentId: attempt.enrollmentId }, 'Enrollment failed: max quiz attempts reached');
      }
    }

    const feedback = attempt.quiz.showFeedback
      ? this.buildFeedback(attempt.quiz, submittedAnswers)
      : null;

    return { score, passed, feedback };
  }

  private buildFeedback(quiz: any, submittedAnswers: SubmittedAnswer[]) {
    return quiz.questions.map((q: any) => {
      const submitted   = submittedAnswers.find((a) => a.questionId === q.id);
      const correctIds  = q.answers.filter((a: any) => a.isCorrect).map((a: any) => a.id);
      return {
        questionId:  q.id,
        correct:     correctIds,
        selected:    submitted?.selectedAnswerIds ?? [],
        explanation: q.explanation,
      };
    });
  }
}

export const quizService = new QuizService();
