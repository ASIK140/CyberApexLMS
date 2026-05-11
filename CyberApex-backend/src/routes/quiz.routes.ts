import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { quizService } from '../services/quiz.service';

const router = Router();

// ── GET /quizzes/:id — get quiz for student (correct answers hidden) ─────────
router.get('/:id', authenticate, async (req: Request, res: Response, next) => {
  try {
    const quiz = await quizService.getQuizForStudent(req.params.id);
    return res.json({ data: quiz });
  } catch (err) {
    next(err);
  }
});

// ── POST /quizzes/:id/attempts — start a new attempt ────────────────────────
router.post('/:id/attempts', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { enrollmentId } = z.object({ enrollmentId: z.string().uuid() }).parse(req.body);
    const attempt = await quizService.startAttempt(req.user!.id, req.params.id, enrollmentId);
    return res.status(201).json({ data: attempt });
  } catch (err) {
    next(err);
  }
});

// ── POST /quizzes/:id/attempts/:aid/submit — submit answers ─────────────────
router.post('/:id/attempts/:aid/submit', authenticate, async (req: Request, res: Response, next) => {
  try {
    const answers = z.array(z.object({
      questionId:        z.string().uuid(),
      selectedAnswerIds: z.array(z.string().uuid()),
    })).parse(req.body.answers);

    const result = await quizService.submitAttempt(req.user!.id, req.params.aid, answers);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// ── GET /quizzes/:id/attempts — list own attempts ───────────────────────────
router.get('/:id/attempts', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { prisma } = await import('../lib/prisma');
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: req.params.id, userId: req.user!.id },
      orderBy: { startedAt: 'desc' },
    });
    return res.json({ data: attempts });
  } catch (err) {
    next(err);
  }
});

export default router;
