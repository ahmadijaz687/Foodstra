import { Router } from 'express';
import { CreateReviewSchema, type CreateReviewInput } from '@foodstra/shared';
import { getParam } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { parsed, validate } from '../middleware/validate.js';
import * as reviews from '../services/review.service.js';

export const reviewRouter = Router();

reviewRouter.get('/restaurant/:restaurantId', (req, res) => {
  res.json(reviews.listRestaurantReviews(getParam(req, 'restaurantId')));
});

reviewRouter.post(
  '/',
  requireAuth,
  validate(CreateReviewSchema),
  (req, res, next) => {
    try {
      const input = parsed<CreateReviewInput>(res, 'body');
      res.status(201).json(reviews.createReview(req.auth!.userId, input));
    } catch (err) {
      next(err);
    }
  },
);
