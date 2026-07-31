import { Router } from 'express';
import { getParam } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import * as favorites from '../services/favorite.service.js';

export const favoriteRouter = Router();

favoriteRouter.use(requireAuth);

favoriteRouter.get('/', (req, res) => {
  res.json(favorites.listFavorites(req.auth!.userId));
});

favoriteRouter.post('/:restaurantId', (req, res, next) => {
  try {
    favorites.addFavorite(req.auth!.userId, getParam(req, 'restaurantId'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

favoriteRouter.delete('/:restaurantId', (req, res) => {
  favorites.removeFavorite(req.auth!.userId, getParam(req, 'restaurantId'));
  res.status(204).send();
});
