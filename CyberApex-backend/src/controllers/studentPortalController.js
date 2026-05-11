'use strict';
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function withSA(fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true)`;
    return fn(tx);
  });
}

// ─── GET /api/student/me ──────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const user = await withSA((tx) =>
      tx.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          department: true, role: true, status: true, lastLoginAt: true,
          enrollments: {
            where: { deletedAt: undefined },
            select: { id: true, status: true, progressPercent: true, courseId: true },
          },
        },
      })
    );
    if (!user) return res.status(404).json({ success: false, message: 'Student not found.' });

    const completedCount = user.enrollments.filter((e) => e.status === 'completed').length;
    const inProgressCount = user.enrollments.filter((e) => e.status === 'in_progress').length;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        department: user.department,
        role: user.role,
        status: user.status,
        last_login: user.lastLoginAt,
        courses_count: user.enrollments.length,
        completed_count: completedCount,
        in_progress_count: inProgressCount,
      },
    });
  } catch (err) {
    console.error('[StudentPortal] getMe error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/student/courses ─────────────────────────────────────────────────
exports.getCourses = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const enrollments = await withSA((tx) =>
      tx.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true, title: true, description: true, thumbnailUrl: true,
              durationMinutes: true, status: true, passingScore: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      })
    );

    const data = enrollments.map((e) => ({
      enrollment_id: e.id,
      course_id: e.courseId,
      title: e.course?.title,
      description: e.course?.description,
      thumbnail_url: e.course?.thumbnailUrl,
      duration_minutes: e.course?.durationMinutes,
      status: e.status,
      progress: e.progressPercent,
      due_date: e.dueDate,
      enrolled_at: e.enrolledAt,
      started_at: e.startedAt,
      completed_at: e.completedAt,
    }));

    res.json({ success: true, total: data.length, data });
  } catch (err) {
    console.error('[StudentPortal] getCourses error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/student/courses/:courseId ───────────────────────────────────────
exports.getCoursePlayerDetails = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { courseId } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const enrollment = await withSA((tx) =>
      tx.enrollment.findFirst({
        where: { userId, courseId },
        include: {
          course: {
            include: {
              modules: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  lessons: {
                    orderBy: { orderIndex: 'asc' },
                    include: { quiz: { include: { questions: { include: { answers: true } } } } },
                  },
                },
              },
            },
          },
        },
      })
    );

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this course.' });
    }

    const course = enrollment.course;

    // Get lesson progress for this enrollment
    const lessonProgress = await withSA((tx) =>
      tx.lessonProgress.findMany({ where: { enrollmentId: enrollment.id }, select: { lessonId: true, status: true, videoCompletedPct: true } })
    );
    const lpMap = Object.fromEntries(lessonProgress.map((lp) => [lp.lessonId, lp]));

    res.json({
      success: true,
      data: {
        enrollment_id: enrollment.id,
        course_id: courseId,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        progress: enrollment.progressPercent,
        status: enrollment.status,
        due_date: enrollment.dueDate,
        modules: course.modules.map((mod) => ({
          id: mod.id,
          title: mod.title,
          description: mod.description,
          order: mod.orderIndex,
          lessons: mod.lessons.map((les) => ({
            id: les.id,
            title: les.title,
            type: les.type,
            order: les.orderIndex,
            is_mandatory: les.isMandatory,
            video_url: les.videoUrl,
            video_duration: les.videoDuration,
            notes_url: les.notesUrl,
            content: les.content,
            progress: lpMap[les.id] || null,
            quiz: les.quiz ? {
              id: les.quiz.id,
              title: les.quiz.title,
              time_limit_secs: les.quiz.timeLimitSecs,
              max_attempts: les.quiz.maxAttempts,
              passing_score: les.quiz.passingScore,
              questions: les.quiz.questions.map((q) => ({
                id: q.id,
                text: q.text,
                type: q.type,
                points: q.points,
                answers: q.answers.map((a) => ({ id: a.id, text: a.text, order: a.orderIndex })),
              })),
            } : null,
          })),
        })),
      },
    });
  } catch (err) {
    console.error('[StudentPortal] getCoursePlayerDetails error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/student/progress ─────────────────────────────────────────────
exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    const { course_id, lesson_id, progress: pct, video_position } = req.body;

    if (!course_id) return res.status(400).json({ success: false, message: 'course_id is required.' });
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const updated = await withSA(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({ where: { userId, courseId: course_id } });
      if (!enrollment) throw Object.assign(new Error('Enrollment not found.'), { status: 404 });

      // Update lesson progress if lesson_id provided
      if (lesson_id) {
        await tx.lessonProgress.upsert({
          where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson_id } },
          create: {
            enrollmentId: enrollment.id,
            lessonId: lesson_id,
            userId,
            status: (pct >= 100) ? 'completed' : (pct > 0 ? 'in_progress' : 'not_started'),
            videoPosition: video_position || null,
            startedAt: new Date(),
            ...(pct >= 100 ? { completedAt: new Date() } : {}),
          },
          update: {
            status: (pct >= 100) ? 'completed' : (pct > 0 ? 'in_progress' : 'not_started'),
            videoPosition: video_position || null,
            ...(pct >= 100 ? { completedAt: new Date() } : {}),
          },
        });
      }

      // Update overall enrollment progress
      const newStatus = (pct >= 100) ? 'completed' : (pct > 0 ? 'in_progress' : enrollment.status);
      return tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPercent: pct ?? enrollment.progressPercent,
          status: newStatus,
          ...(newStatus === 'in_progress' && !enrollment.startedAt ? { startedAt: new Date() } : {}),
          ...(newStatus === 'completed' && !enrollment.completedAt ? { completedAt: new Date() } : {}),
        },
      });
    });

    res.json({ success: true, message: 'Progress updated.', data: { course_id, progress: updated.progressPercent, status: updated.status } });
  } catch (err) {
    console.error('[StudentPortal] updateProgress error:', err.message);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
