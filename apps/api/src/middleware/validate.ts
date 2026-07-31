import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { BadRequest } from '../lib/errors.js';

type Source = 'body' | 'query' | 'params';

/**
 * Validates and REPLACES req[source] with the parsed, typed value.
 * Parsed values are attached to res.locals so handlers get typed access.
 */
export function validate<S extends ZodTypeAny>(schema: S, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(BadRequest('Validation failed', result.error.flatten()));
      return;
    }
    res.locals[source] = result.data as ZodInfer<S>;
    next();
  };
}

export function parsed<T>(res: Response, source: Source): T {
  return res.locals[source] as T;
}
