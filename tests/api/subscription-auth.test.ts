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

describe('Creator Subscription Checkout — Auth Validation', () => {
  it('POST /api/creator/subscription/checkout returns 401 without a session', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: 'starter' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('POST /api/creator/subscription/checkout with pro plan returns 401 without session', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: 'pro' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('POST /api/creator/subscription/checkout with invalid plan returns 401 (auth checked first)', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: 'enterprise' });
    expect(res.status).toBe(401);
  });

  it('POST /api/creator/subscription/checkout with empty plan returns 401', async () => {
    const res = await post('/api/creator/subscription/checkout', { plan: '' });
    expect(res.status).toBe(401);
  });
});

describe('Brand Subscription Checkout — Auth Validation', () => {
  it('POST /api/brand/subscription/checkout returns 401 without a session', async () => {
    const res = await post('/api/brand/subscription/checkout', { plan: 'starter' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('POST /api/brand/subscription/checkout with pro plan returns 401 without session', async () => {
    const res = await post('/api/brand/subscription/checkout', { plan: 'pro' });
    expect(res.status).toBe(401);
  });

  it('POST /api/brand/subscription/checkout with invalid plan returns 401', async () => {
    const res = await post('/api/brand/subscription/checkout', { plan: 'unlimited' });
    expect(res.status).toBe(401);
  });

  it('POST /api/brand/subscription/portal returns 401 without session', async () => {
    const res = await post('/api/brand/subscription/portal', {});
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('POST /api/brand/subscription/surplus-invoice returns 401 without session', async () => {
    const res = await post('/api/brand/subscription/surplus-invoice', {
      views: 1000,
      minutes: 60,
      publishers: 3,
      totalAmount: 350,
    });
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

  it('POST /api/webhooks/stripe with malformed stripe-signature returns 400', async () => {
    const res = await post('/api/webhooks/stripe', { type: 'customer.subscription.updated' }, {
      'stripe-signature': 't=invalid,v1=badhash',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('POST /api/webhooks/stripe with no body returns 400', async () => {
    const res = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=0,v1=fakesig' },
      body: '{}',
    });
    expect(res.status).toBe(400);
  });
});

describe('Stripe Connect Endpoints — Auth Enforcement', () => {
  it('POST /api/stripe/connect/create returns 401 without session', async () => {
    const res = await post('/api/stripe/connect/create', {});
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('POST /api/stripe/connect/onboarding returns 401 without session', async () => {
    const res = await post('/api/stripe/connect/onboarding', {});
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('GET /api/stripe/connect/status returns 200 with demo user state when no session', async () => {
    const res = await get('/api/stripe/connect/status');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('connected');
    expect(body).toHaveProperty('onboarded');
    expect(typeof body.connected).toBe('boolean');
    expect(typeof body.onboarded).toBe('boolean');
  });
});

describe('Subscription Data Endpoints — Accessible without session', () => {
  it('GET /api/users/me returns user (demo_creator fallback when no session)', async () => {
    const res = await get('/api/users/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('role');
  });
});
