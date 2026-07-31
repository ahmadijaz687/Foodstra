import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@foodstra/shared';
import { Forbidden, Unauthorized } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/tokens.js';

export interface AuthContext {
  userId: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(Unauthorized('Missing bearer token'));
    return;
  }
  const claims = verifyAccessToken(header.slice('Bearer '.length));
  req.auth = { userId: claims.sub, role: claims.role };
  next();
}

/** Server-side RBAC — never trust client-side role hiding. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(Unauthorized());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(Forbidden('Insufficient role'));
      return;
    }
    next();
  };
}
