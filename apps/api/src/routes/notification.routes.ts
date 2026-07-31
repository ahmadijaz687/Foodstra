import { Router } from 'express';
import {
  RegisterPushTokenSchema,
  type RegisterPushTokenInput,
} from '@foodstra/shared';
import { requireAuth } from '../middleware/auth.js';
import { parsed, validate } from '../middleware/validate.js';
import * as notifications from '../services/notification.service.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', (req, res) => {
  res.json(notifications.listNotifications(req.auth!.userId));
});

notificationRouter.post(
  '/push-token',
  validate(RegisterPushTokenSchema),
  (req, res) => {
    const input = parsed<RegisterPushTokenInput>(res, 'body');
    notifications.registerPushToken(req.auth!.userId, input);
    res.status(204).send();
  },
);
