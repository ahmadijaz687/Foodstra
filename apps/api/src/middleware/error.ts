import type { NextFunction, Request, Response } from 'express';
import type { ApiError } from '@foodstra/shared';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiError = {
    error: { code: 'not_found', message: 'Route not found' },
  };
  res.status(404).json(body);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiError = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    res.status(err.status).json(body);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  const body: ApiError = {
    error: { code: 'internal_error', message: 'Internal server error' },
  };
  res.status(500).json(body);
}
