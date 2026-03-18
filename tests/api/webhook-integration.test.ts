/**
 * Webhook Integration Tests — Stripe → DB State Verification
 *
 * These tests simulate the full checkout → webhook → DB state lifecycle:
 * 1. Log in as admin to obtain an auth cookie (required for /api/dev/* endpoints)
 * 2. Call POST /api/dev/stripe/simulate-webhook which:
 *    a. Creates a real Stripe subscription using a tok_visa test card token
 *    b. Fires the event through dispatchStripeEvent — same handler used in production
 *    c. Returns the resulting DB subscription row
 * 3. Assert the DB subscription row shows status=active and the correct plan
 * 4. Verify the trial-status API confirms hasActiveSubscription=true
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

async function simulateWebhook(opts: {
  userId: string;
  plan: 'starter' | 'pro';
  adminCookie: string;
  eventType?: string;
}) {
  return fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: opts.adminCookie,
    },
    body: JSON.stringify({
      userId: opts.userId,
      plan: opts.plan,
      eventType: opts.eventType ?? 'checkout.session.completed',
    }),
  });
}

// ─── Creator Webhook Loop ─────────────────────────────────────────────────────

describe('Webhook Integration — Creator checkout.session.completed → DB state', () => {
  let adminUserId: string;
  let adminCookie: string;

  beforeAll(async () => {
    const session = await loginAsAdmin();
    adminUserId = session.userId;
    adminCookie = session.cookie;
  });

  it('Starter plan: webhook dispatched → DB shows status=active, plan=starter', async () => {
    const res = await simulateWebhook({ userId: adminUserId, plan: 'starter', adminCookie });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.stripeSubscriptionId).toMatch(/^sub_/);

    const sub = body.subscription;
    expect(sub, 'subscription row must exist in DB after webhook').toBeDefined();
    expect(sub.plan).toBe('starter');
    expect(sub.status).toBe('active');
    expect(typeof sub.currentPeriodEnd).toBe('string');

    console.log(`[Webhook→DB] creator starter: sub=${body.stripeSubscriptionId}, status=${sub.status}, plan=${sub.plan}`);
  }, 40_000);

  it('Pro plan: webhook dispatched → DB shows status=active, plan=pro', async () => {
    const res = await simulateWebhook({ userId: adminUserId, plan: 'pro', adminCookie });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.stripeSubscriptionId).toMatch(/^sub_/);

    const sub = body.subscription;
    expect(sub, 'subscription row must exist in DB after webhook').toBeDefined();
    expect(sub.plan).toBe('pro');
    expect(sub.status).toBe('active');

    console.log(`[Webhook→DB] creator pro: sub=${body.stripeSubscriptionId}, status=${sub.status}, plan=${sub.plan}`);
  }, 40_000);

  it('Trial-status API confirms hasActiveSubscription=true after webhook simulation', async () => {
    const res = await fetch(`${BASE}/api/users/me/trial-status`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.hasActiveSubscription).toBe(true);
    console.log(`[UI→API] trial-status: hasActiveSubscription=${data.hasActiveSubscription}`);
  }, 15_000);

  it('Missing userId → 400 even when authenticated', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ plan: 'starter' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  }, 10_000);

  it('Unknown userId → 404 when authenticated as admin', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000', plan: 'starter' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  }, 10_000);

  it('Unauthenticated simulate-webhook returns 401', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: adminUserId, plan: 'starter' }),
    });
    expect(res.status).toBe(401);
  }, 10_000);
});

// ─── Brand Webhook Loop ───────────────────────────────────────────────────────

describe('Webhook Integration — Brand checkout.session.completed → DB state', () => {
  let adminCookie: string;
  let brandUserId: string;

  beforeAll(async () => {
    const session = await loginAsAdmin();
    adminCookie = session.cookie;

    // Create a dedicated brand test user
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
    } else {
      // Fall back to admin user if registration fails
      brandUserId = (await (await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      })).json()).id;
    }
  });

  it('Brand Starter: webhook dispatched → DB shows status=active, plan=starter', async () => {
    const res = await simulateWebhook({ userId: brandUserId, plan: 'starter', adminCookie });

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

  it('Brand Pro: webhook dispatched → DB shows status=active, plan=pro', async () => {
    const res = await simulateWebhook({ userId: brandUserId, plan: 'pro', adminCookie });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.stripeSubscriptionId).toMatch(/^sub_/);

    const sub = body.subscription;
    expect(sub, 'subscription row must exist in DB after webhook').toBeDefined();
    expect(sub.plan).toBe('pro');
    expect(sub.status).toBe('active');

    console.log(`[Webhook→DB] brand pro: sub=${body.stripeSubscriptionId}, status=${sub.status}`);
  }, 40_000);
});
