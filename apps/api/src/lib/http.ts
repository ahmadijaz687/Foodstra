import type { Request } from 'express';
import { BadRequest } from './errors.js';

/** Reads a required route param, throwing 400 if absent. */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (value === undefined || value === '') {
    throw BadRequest(`Missing route parameter: ${name}`);
  }
  return value;
}
