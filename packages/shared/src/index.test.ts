import { describe, expect, it } from 'vitest';
import {
  canTransition,
  ORDER_TRANSITIONS,
  PasswordSchema,
  RegisterSchema,
  type OrderStatus,
} from './index.js';

describe('PasswordSchema', () => {
  it('accepts a strong password', () => {
    expect(PasswordSchema.safeParse('Sup3r$ecret!!').success).toBe(true);
  });

  it('rejects weak passwords', () => {
    for (const bad of ['short', 'alllowercase123!', 'NODIGITSHERE!!!', 'NoSymbol12345']) {
      expect(PasswordSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe('RegisterSchema', () => {
  it('normalizes email casing', () => {
    const parsed = RegisterSchema.parse({
      email: 'User@Example.COM',
      password: 'Sup3r$ecret!!',
      displayName: 'Ada',
    });
    expect(parsed.email).toBe('user@example.com');
  });
});

describe('order state machine', () => {
  it('allows only forward/cancel transitions', () => {
    expect(canTransition('placed', 'confirmed')).toBe(true);
    expect(canTransition('placed', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'delivered')).toBe(false);
    expect(canTransition('delivered', 'placed')).toBe(false);
  });

  it('terminal states have no transitions', () => {
    const terminals: OrderStatus[] = ['delivered', 'cancelled'];
    for (const t of terminals) {
      expect(ORDER_TRANSITIONS[t]).toHaveLength(0);
    }
  });
});
