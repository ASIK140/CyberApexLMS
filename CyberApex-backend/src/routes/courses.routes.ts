import { Router, Request, Response } from 'express';
import { courseService } from '../services/course.service';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { upload } from '../middleware/upload';
import { uploadToS3 } from '../lib/s3';
import { addVideoJob } from '../queues';
import { prisma } from '../lib/prisma';
import { AppError, ErrorCodes } from '../lib/app-error';

const router = Router();

// GET /api/v1/courses - list courses
router.get('/', authenticate, authorize(['super_admin', 'tenant_admin', 'ciso']), async (req: Request, res: Response, next) => {
  try {
    const params = {
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };
    const result = await courseService.list(params);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/:id - get course details
router.get('/:id', authenticate, authorize(['super_admin', 'tenant_admin', 'ciso', 'student']), async (req: Request, res: Response, next) => {
  try {
    const result = await courseService.getById(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/courses/:id/modules/:mid/lessons/:lid/video - upload video
router.post('/:id/modules/:mid/lessons/:lid/video',
  authenticate,
  authorize(['super_admin']),
  upload.single('video'),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.file) throw new AppError(ErrorCodes.VALIDATION_ERROR, 'No video file uploaded', 400);

      const { id: courseId, mid: moduleId, lid: lessonId } = req.params;

      // Validate lesson exists and belongs to the specified module/course
      const lesson = await prisma.lesson.findFirst({
        where: {
          id: lessonId,
          moduleId: moduleId,
          module: { courseId: courseId }
        }
      });

      if (!lesson) throw new AppError(ErrorCodes.NOT_FOUND, 'Lesson not found in the specified module/course', 404);

      const inputKey = `raw-videos/${courseId}/${lessonId}/${Date.now()}-${req.file.originalname}`;
      
      // 1. Upload raw MP4 to S3
      await uploadToS3(inputKey, req.file.buffer, req.file.mimetype);

      // 2. Queue transcoding job
      const job = await addVideoJob({ courseId, lessonId, inputKey });

      res.status(202).json({
        success: true,
        message: 'Video upload successful. Transcoding started.',
        jobId: job.id
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
