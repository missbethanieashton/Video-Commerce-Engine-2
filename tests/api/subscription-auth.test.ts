import { describe, it, expect } from 'vitest';

const BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function get(path: string) {
  return fetch(`${BASE}${path}`, { method: 'GET' });
}

describe('Subscription Checkout Endpoints — Auth Validation', () => {
  it('POST /api/creator/subscription/checkout requires session (401 without auth)', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: 'starter' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('POST /api/creator/subscription/checkout with pro plan requires session (401)', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: 'pro' });
    expect(res.status).toBe(401);
  });

  it('POST /api/brand/subscription/checkout requires session (401 without auth)', async () => {
    const res = await post('/api/brand/subscription/checkout', { plan: 'starter' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('POST /api/brand/subscription/checkout with pro plan requires session (401)', async () => {
    const res = await post('/api/brand/subscription/checkout', { plan: 'pro' });
    expect(res.status).toBe(401);
  });

  it('POST /api/brand/subscription/portal requires session (401 without auth)', async () => {
    const res = await post('/api/brand/subscription/portal', {});
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('POST /api/brand/subscription/surplus-invoice requires session (401 without auth)', async () => {
    const res = await post('/api/brand/subscription/surplus-invoice', {
      views: 1000,
      minutes: 60,
      publishers: 3,
      totalAmount: 350,
    });
    expect(res.status).toBe(401);
  });
});

describe('Subscription Checkout Endpoints — Plan Validation', () => {
  it('Creator checkout rejects invalid plan values (auth required first, so 401)', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: 'enterprise' });
    expect(res.status).toBe(401);
  });

  it('Creator checkout rejects empty plan (auth required first, so 401)', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: '' });
    expect(res.status).toBe(401);
  });

  it('Brand checkout rejects invalid plan values (401 — auth checked first)', async () => {
    const res = await post('/api/brand/subscription/checkout', { plan: 'unlimited' });
    expect(res.status).toBe(401);
  });
});

describe('Webhook Endpoint — Signature Validation', () => {
  it('POST /api/webhooks/stripe without stripe-signature returns 400', async () => {
    const res = await post('/api/webhooks/stripe', { type: 'checkout.session.completed' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    const err: string = body.error;
    const isExpectedError =
      err.includes('Webhook secret not configured') ||
      err.includes('Missing stripe-signature header') ||
      err.includes('Signature verification failed');
    expect(isExpectedError).toBe(true);
  });

  it('POST /api/webhooks/stripe with invalid signature returns 400', async () => {
    const res = await post('/api/webhooks/stripe', { type: 'customer.subscription.updated' }, {
      'stripe-signature': 't=invalid,v1=badhash',
    });
    expect(res.status).toBe(400);
  });
});

describe('Stripe Connect Endpoints — Session-Aware Auth', () => {
  it('GET /api/stripe/connect/status returns 200 with connected/onboarded fields', async () => {
    const res = await get('/api/stripe/connect/status');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('connected');
    expect(body).toHaveProperty('onboarded');
    expect(typeof body.connected).toBe('boolean');
    expect(typeof body.onboarded).toBe('boolean');
  });

  it('GET /api/creator/subscription returns subscription data or null', async () => {
    const res = await get('/api/creator/subscription');
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/brand/subscription returns subscription data or null', async () => {
    const res = await get('/api/brand/subscription');
    expect([200, 401]).toContain(res.status);
  });
});
