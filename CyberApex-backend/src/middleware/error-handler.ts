import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/app-error';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { randomUUID } from 'crypto';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = randomUUID();

  if (err instanceof AppError) {
    logger.warn({ err, requestId, path: req.path }, 'AppError');
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details, requestId } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.flatten().fieldErrors, requestId } });
    return;
  }

  // Handle plain objects thrown (e.g., from legacy middleware)
  const anyErr = err as any;
  if (anyErr.statusCode || anyErr.code) {
    res.status(anyErr.statusCode ?? 400).json({ error: { code: anyErr.code ?? 'ERROR', message: anyErr.message, requestId } });
    return;
  }

  logger.error({ err, requestId, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId } });
}
