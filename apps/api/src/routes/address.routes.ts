import { Router } from 'express';
import {
  CreateAddressSchema,
  UpdateAddressSchema,
  type CreateAddressInput,
  type UpdateAddressInput,
} from '@foodstra/shared';
import { getParam } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { parsed, validate } from '../middleware/validate.js';
import * as addresses from '../services/address.service.js';

export const addressRouter = Router();

addressRouter.use(requireAuth);

addressRouter.get('/', (req, res) => {
  res.json(addresses.listAddresses(req.auth!.userId));
});

addressRouter.post('/', validate(CreateAddressSchema), (req, res, next) => {
  try {
    const input = parsed<CreateAddressInput>(res, 'body');
    res.status(201).json(addresses.createAddress(req.auth!.userId, input));
  } catch (err) {
    next(err);
  }
});

addressRouter.patch('/:id', validate(UpdateAddressSchema), (req, res, next) => {
  try {
    const input = parsed<UpdateAddressInput>(res, 'body');
    res.json(addresses.updateAddress(req.auth!.userId, getParam(req, 'id'), input));
  } catch (err) {
    next(err);
  }
});

addressRouter.delete('/:id', (req, res, next) => {
  try {
    addresses.deleteAddress(req.auth!.userId, getParam(req, 'id'));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
