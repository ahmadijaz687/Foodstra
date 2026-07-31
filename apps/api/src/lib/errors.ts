export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export const BadRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, 'bad_request', message, details);
export const Unauthorized = (message = 'Unauthorized'): AppError =>
  new AppError(401, 'unauthorized', message);
export const Forbidden = (message = 'Forbidden'): AppError =>
  new AppError(403, 'forbidden', message);
export const NotFound = (message = 'Not found'): AppError =>
  new AppError(404, 'not_found', message);
export const Conflict = (message: string): AppError =>
  new AppError(409, 'conflict', message);
export const TooManyRequests = (message = 'Too many requests'): AppError =>
  new AppError(429, 'too_many_requests', message);
