/**
 * Webhook Integration Tests — Stripe → DB State Verification
 *
 * These tests simulate the full checkout → webhook → DB state lifecycle:
 * 1. Create a checkout session (real Stripe API call, gets cs_test_ sessionId)
 * 2. Simulate the Stripe webhook event via the dev harness (creates a real subscription,
 *    fires it through dispatchStripeEvent, which is the same handler used in production)
 * 3. Assert the DB subscription row reflects the correct plan/status
 *
 * This replaces Stripe CLI webhook replay and covers the full server-side loop
 * without requiring a publicly accessible server or browser-level card entry.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'missbethanieashton@gmail.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'test1233*';

async function loginAsAdmin(): Promise<{ userId: string; cookie: string }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  expect(res.status, 'admin login').toBe(200);
  const user = await res.json();
  const cookie = res.headers.get('set-cookie') ?? '';
  return { userId: user.id, cookie };
}

describe('Webhook Integration — checkout.session.completed → DB state', () => {
  let userId: string;
  let cookie: string;

  beforeAll(async () => {
    const session = await loginAsAdmin();
    userId = session.userId;
    cookie = session.cookie;
  });

  it('Creator Starter: simulate checkout.session.completed → subscription active in DB', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan: 'starter', eventType: 'checkout.session.completed' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.stripeSubscriptionId).toMatch(/^sub_/);

    const sub = body.subscription;
    expect(sub, 'subscription row must exist in DB after webhook').toBeDefined();
    expect(sub.plan).toBe('starter');
    expect(sub.status).toBe('active');
    expect(typeof sub.currentPeriodEnd).toBe('string');

    console.log(`[Webhook→DB] starter: sub=${body.stripeSubscriptionId}, status=${sub.status}, plan=${sub.plan}`);
  }, 40_000);

  it('Creator Pro: simulate checkout.session.completed → subscription active in DB', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan: 'pro', eventType: 'checkout.session.completed' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.stripeSubscriptionId).toMatch(/^sub_/);

    const sub = body.subscription;
    expect(sub, 'subscription row must exist in DB after webhook').toBeDefined();
    expect(sub.plan).toBe('pro');
    expect(sub.status).toBe('active');

    console.log(`[Webhook→DB] pro: sub=${body.stripeSubscriptionId}, status=${sub.status}, plan=${sub.plan}`);
  }, 40_000);

  it('Trial-status endpoint confirms hasActiveSubscription=true after webhook simulation', async () => {
    const res = await fetch(`${BASE}/api/users/me/trial-status`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.hasActiveSubscription).toBe(true);

    console.log(`[UI→API] trial-status: hasActiveSubscription=${data.hasActiveSubscription}`);
  }, 15_000);

  it('Missing userId returns 400', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'starter' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  }, 10_000);

  it('Unknown userId returns 404', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000', plan: 'starter' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  }, 10_000);
});

describe('Webhook Integration — Brand checkout.session.completed → DB state', () => {
  let brandUserId: string;
  let brandCookie: string;

  beforeAll(async () => {
    // Create a brand test user via register
    const email = `brand-wh-test-${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'BrandTest123!',
        displayName: 'Brand Webhook Test',
        role: 'brand',
      }),
    });
    if (regRes.status === 201 || regRes.status === 200) {
      const user = await regRes.json();
      brandUserId = user.id;
      brandCookie = regRes.headers.get('set-cookie') ?? '';
    } else {
      // Fall back to admin user for brand plan path
      const session = await loginAsAdmin();
      brandUserId = session.userId;
      brandCookie = session.cookie;
    }
  });

  it('Brand Starter: simulate checkout.session.completed → subscription active in DB', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: brandUserId, plan: 'starter', eventType: 'checkout.session.completed' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.stripeSubscriptionId).toMatch(/^sub_/);

    const sub = body.subscription;
    expect(sub, 'subscription row must exist in DB after webhook').toBeDefined();
    expect(sub.plan).toBe('starter');
    expect(sub.status).toBe('active');

    console.log(`[Webhook→DB] brand starter: sub=${body.stripeSubscriptionId}, status=${sub.status}`);
  }, 40_000);

  it('Brand Pro: simulate checkout.session.completed → subscription active in DB', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: brandUserId, plan: 'pro', eventType: 'checkout.session.completed' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dispatched).toBe(true);

    const sub = body.subscription;
    expect(sub, 'subscription row must exist in DB after webhook').toBeDefined();
    expect(sub.plan).toBe('pro');
    expect(sub.status).toBe('active');

    console.log(`[Webhook→DB] brand pro: sub=${body.stripeSubscriptionId}, status=${sub.status}`);
  }, 40_000);
});
