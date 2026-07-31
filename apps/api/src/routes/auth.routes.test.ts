import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { resetStore } from '../store/index.js';

const validUser = {
  email: 'ada@example.com',
  password: 'Sup3r$ecret!!',
  displayName: 'Ada Lovelace',
};

describe('auth routes', () => {
  let app: Express;

  beforeEach(() => {
    resetStore();
    app = createApp();
  });

  afterEach(() => {
    resetStore();
  });

  it('health check works', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects a weak password on register', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: 'weak' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('bad_request');
  });

  it('registers, logs in, refreshes, and logs out', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);
    expect(reg.status).toBe(201);
    expect(reg.body.user.email).toBe(validUser.email);
    expect(reg.body.user.role).toBe('customer');
    expect(reg.body.user).not.toHaveProperty('passwordHash');
    expect(reg.body.tokens.accessToken).toBeTruthy();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(login.status).toBe(200);
    const { accessToken, refreshToken } = login.body.tokens;

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(validUser.email);

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.tokens.refreshToken).not.toBe(refreshToken);

    // Old refresh token is now revoked (rotation).
    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(reuse.status).toBe(401);

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: refreshed.body.tokens.refreshToken });
    expect(logout.status).toBe(204);
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const dup = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);
    expect(dup.status).toBe(409);
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'WrongPass123!!' });
    expect(res.status).toBe(401);
  });

  it('rejects protected route without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
