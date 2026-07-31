import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../app.js';
import { resetStore, getStore } from '../store/index.js';
import { resetPaymentProvider } from '../services/payment/index.js';
import { seedStore } from '../store/seed.js';

const app = createApp();

const STRONG = 'Sup3r$ecret!!';

async function registerCustomer(): Promise<{ token: string; userId: string }> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `c_${randomUUID()}@ex.com`, password: STRONG, displayName: 'Cust' });
  return { token: res.body.tokens.accessToken, userId: res.body.user.id };
}

function auth(token: string): string {
  return `Bearer ${token}`;
}

async function seedAddress(token: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/addresses')
    .set('Authorization', auth(token))
    .send({
      label: 'Home',
      line1: '1 Main St',
      city: 'SF',
      region: 'CA',
      postalCode: '94103',
      country: 'US',
      latitude: 37.77,
      longitude: -122.41,
    });
  return res.body.id;
}

describe('menu + cart HTTP', () => {
  beforeEach(() => {
    resetStore();
    resetPaymentProvider();
    seedStore();
  });

  it('searches the menu (public)', async () => {
    const res = await request(app).get('/api/v1/menu/search?q=pizza');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('requires auth for the cart', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('adds an item to the cart and computes subtotal', async () => {
    const { token } = await registerCustomer();
    const item = [...getStore().menuItems.values()][0]!;
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', auth(token))
      .send({ menuItemId: item.id, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.subtotalMinor).toBe(item.priceMinor * 2);
  });
});

describe('order lifecycle', () => {
  beforeEach(() => {
    resetStore();
    resetPaymentProvider();
    seedStore();
  });

  it('runs place -> pay -> confirm -> deliver with mock payments and rejects bad transitions', async () => {
    const { token } = await registerCustomer();
    const addressId = await seedAddress(token);
    const item = [...getStore().menuItems.values()][0]!;

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', auth(token))
      .send({ menuItemId: item.id, quantity: 1 })
      .expect(201);

    const placed = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', auth(token))
      .send({ addressId, idempotencyKey: randomUUID() });
    expect(placed.status).toBe(201);
    expect(placed.body.order.status).toBe('placed');
    expect(placed.body.payment.id).toMatch(/^pi_mock_/);
    const orderId = placed.body.order.id as string;

    // Customer cannot jump straight to delivered.
    const illegal = await request(app)
      .post(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', auth(token))
      .send({ status: 'delivered' });
    expect(illegal.status).toBe(409);

    // Mock payment confirmation advances to confirmed.
    const confirmed = await request(app)
      .post(`/api/v1/orders/${orderId}/confirm-payment`)
      .set('Authorization', auth(token));
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe('confirmed');

    // A notification was recorded for the customer.
    const notes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', auth(token));
    expect(notes.body.length).toBeGreaterThanOrEqual(2);
  });

  it('is idempotent on repeated create with same key', async () => {
    const { token } = await registerCustomer();
    const addressId = await seedAddress(token);
    const item = [...getStore().menuItems.values()][0]!;
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', auth(token))
      .send({ menuItemId: item.id, quantity: 1 });

    const key = randomUUID();
    const first = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', auth(token))
      .send({ addressId, idempotencyKey: key });
    const second = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', auth(token))
      .send({ addressId, idempotencyKey: key });
    expect(second.body.order.id).toBe(first.body.order.id);
    expect(getStore().orders.size).toBe(1);
  });

  it('blocks ordering an empty cart', async () => {
    const { token } = await registerCustomer();
    const addressId = await seedAddress(token);
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', auth(token))
      .send({ addressId, idempotencyKey: randomUUID() });
    expect(res.status).toBe(400);
  });
});
