import { prisma } from '../lib/prisma';
import { addCertJob } from '../queues';
import { logger } from '../lib/logger';

export class CompletionService {
  async checkAndComplete(enrollmentId: string): Promise<void> {
    const result = await prisma.$queryRaw<
      Array<{
        total_mandatory:     bigint;
        completed_mandatory: bigint;
        has_assessment:      boolean;
        assessment_passed:   boolean;
        enrollment_status:   string;
      }>
    >`
      SELECT
        COUNT(l.id) FILTER (WHERE l.is_mandatory = true)                                AS total_mandatory,
        COUNT(lp.id) FILTER (WHERE lp.status = 'completed' AND l.is_mandatory = true)  AS completed_mandatory,
        BOOL_OR(l.type = 'assessment')                                                   AS has_assessment,
        BOOL_OR(qa.passed = true)                                                        AS assessment_passed,
        e.status                                                                         AS enrollment_status
      FROM enrollments e
      JOIN courses  c  ON c.id = e.course_id
      JOIN modules  m  ON m.course_id = c.id
      JOIN lessons  l  ON l.module_id = m.id
      LEFT JOIN lesson_progress lp
             ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
      LEFT JOIN quizzes q
             ON q.lesson_id = l.id AND l.type = 'assessment'
      LEFT JOIN quiz_attempts qa
             ON qa.quiz_id = q.id
            AND qa.enrollment_id = e.id
            AND qa.status = 'submitted'
      WHERE e.id = ${enrollmentId}::uuid
      GROUP BY e.status
    `;

    if (!result[0]) return;

    const {
      total_mandatory,
      completed_mandatory,
      has_assessment,
      assessment_passed,
      enrollment_status,
    } = result[0];

    if (['completed', 'failed'].includes(enrollment_status)) return;

    const allLessonsDone      = Number(completed_mandatory) >= Number(total_mandatory);
    const quizRequirementMet  = !has_assessment || assessment_passed;

    if (allLessonsDone && quizRequirementMet) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'completed', completedAt: new Date(), progressPercent: 100 },
      });

      await addCertJob({ enrollmentId });

      logger.info({ enrollmentId }, 'Enrollment completed — certificate job queued');
    } else {
      const pct =
        Number(total_mandatory) > 0
          ? Math.round((Number(completed_mandatory) / Number(total_mandatory)) * 100)
          : 0;

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'in_progress', progressPercent: pct },
      });
    }
  }
}

export const completionService = new CompletionService();
