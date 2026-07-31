import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  LoginSchema,
  LogoutSchema,
  RefreshSchema,
  RegisterSchema,
  type LoginInput,
  type LogoutInput,
  type RefreshInput,
  type RegisterInput,
} from '@foodstra/shared';
import { requireAuth } from '../middleware/auth.js';
import { parsed, validate } from '../middleware/validate.js';
import { getStore } from '../store/index.js';
import { NotFound } from '../lib/errors.js';
import * as authService from '../services/auth.service.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(RegisterSchema),
  async (_req, res, next) => {
    try {
      const input = parsed<RegisterInput>(res, 'body');
      res.status(201).json(await authService.register(input));
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  '/login',
  loginLimiter,
  validate(LoginSchema),
  async (_req, res, next) => {
    try {
      const input = parsed<LoginInput>(res, 'body');
      res.json(await authService.login(input));
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post('/refresh', validate(RefreshSchema), async (_req, res, next) => {
  try {
    const input = parsed<RefreshInput>(res, 'body');
    res.json(await authService.refresh(input.refreshToken));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', validate(LogoutSchema), (_req, res) => {
  const input = parsed<LogoutInput>(res, 'body');
  authService.logout(input.refreshToken);
  res.status(204).send();
});

authRouter.get('/me', requireAuth, (req, res, next) => {
  try {
    const store = getStore();
    const record = store.users.get(req.auth!.userId);
    if (!record) throw NotFound('User not found');
    const { passwordHash: _ph, ...user } = record;
    res.json(user);
  } catch (err) {
    next(err);
  }
});
