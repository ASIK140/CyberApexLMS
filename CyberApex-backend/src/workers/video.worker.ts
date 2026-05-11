import { Worker, Job } from 'bullmq';
import { bullmqConnection } from '../lib/bullmq-connection';
import { prisma } from '../lib/prisma';
import { VideoJob } from '../queues';
import { logger } from '../lib/logger';
import { downloadFromS3, uploadToS3 } from '../lib/s3';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';

export const videoWorker = new Worker<VideoJob>(
  'video-processing',
  async (job: Job<VideoJob>) => {
    const { courseId, lessonId, inputKey } = job.data;
    const tempDir = path.join(os.tmpdir(), `video-${lessonId}-${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, 'input.mp4');
    const outputDir = path.join(tempDir, 'hls');
    await fs.promises.mkdir(outputDir, { recursive: true });

    try {
      logger.info({ jobId: job.id, lessonId }, 'Video transcoding started');

      // 1. Download
      const inputStream = await downloadFromS3(inputKey);
      await pipeline(inputStream, fs.createWriteStream(inputPath));

      // 2. Transcode
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-profile:v baseline',
            '-level 3.0',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls'
          ])
          .output(path.join(outputDir, 'index.m3u8'))
          .on('start', (cmd) => logger.debug({ cmd }, 'FFmpeg started'))
          .on('progress', (progress) => logger.debug({ progress }, 'FFmpeg progress'))
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      // 3. Upload segments and manifest
      const files = await fs.promises.readdir(outputDir);
      let manifestUrl = '';

      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const s3Key = `videos/${courseId}/${lessonId}/${file}`;
        const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
        
        const url = await uploadToS3(s3Key, fs.createReadStream(filePath), contentType);
        if (file === 'index.m3u8') manifestUrl = url;
      }

      // 4. Update Lesson
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { videoUrl: manifestUrl },
      });

      logger.info({ lessonId, manifestUrl }, 'Video transcoding complete');
    } catch (err: any) {
      logger.error({ err: err.message, lessonId }, 'Video transcoding failed');
      throw err;
    } finally {
      // Cleanup
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  },
  { connection: bullmqConnection, concurrency: 1, skipVersionCheck: true }
);

videoWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Video worker job failed');
});
