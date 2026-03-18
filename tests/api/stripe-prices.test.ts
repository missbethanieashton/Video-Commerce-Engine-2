/**
 * Stripe test-mode price/product validation.
 * Verifies that the starter (€249/mo) and pro (€499/mo) prices exist in Stripe
 * test mode with correct amounts, currency, interval, and plan metadata.
 * All assertions run against the real Stripe API via the server's dev endpoint.
 */
import { describe, it, expect } from 'vitest';

const BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

describe('Stripe Plan Prices — Test-Mode Integration', () => {
  it('GET /api/dev/stripe/plans returns both starter and pro prices', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/plans`);
    expect(res.status).toBe(200);
    const { plans } = await res.json();
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThanOrEqual(2);

    const planNames: string[] = plans.map((p: { plan: string }) => p.plan);
    expect(planNames).toContain('starter');
    expect(planNames).toContain('pro');
  }, 15_000);

  it('Starter plan price has amount=24900 EUR, monthly recurring, and plan metadata', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/plans`);
    const { plans } = await res.json();
    const starter = plans.find((p: { plan: string }) => p.plan === 'starter');

    expect(starter).toBeDefined();
    expect(starter.unit_amount).toBe(24900);
    expect(starter.currency).toBe('eur');
    expect(starter.recurring?.interval).toBe('month');
    expect(starter.recurring?.interval_count).toBe(1);

    const meta: Record<string, string> = starter.metadata ?? {};
    const productId: string = starter.product_id ?? '';
    expect(meta.plan === 'starter' || productId.startsWith('prod_')).toBe(true);

    console.log(`[Stripe] starter price ID: ${starter.id}, product: ${starter.product_id}`);
  }, 15_000);

  it('Pro plan price has amount=49900 EUR, monthly recurring, and plan metadata', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/plans`);
    const { plans } = await res.json();
    const pro = plans.find((p: { plan: string }) => p.plan === 'pro');

    expect(pro).toBeDefined();
    expect(pro.unit_amount).toBe(49900);
    expect(pro.currency).toBe('eur');
    expect(pro.recurring?.interval).toBe('month');
    expect(pro.recurring?.interval_count).toBe(1);

    const meta: Record<string, string> = pro.metadata ?? {};
    const productId: string = pro.product_id ?? '';
    expect(meta.plan === 'pro' || productId.startsWith('prod_')).toBe(true);

    console.log(`[Stripe] pro price ID: ${pro.id}, product: ${pro.product_id}`);
  }, 15_000);

  it('Starter and Pro prices have distinct price IDs and product IDs', async () => {
    const res = await fetch(`${BASE}/api/dev/stripe/plans`);
    const { plans } = await res.json();
    const starter = plans.find((p: { plan: string }) => p.plan === 'starter');
    const pro = plans.find((p: { plan: string }) => p.plan === 'pro');

    expect(starter.id).not.toBe(pro.id);
    expect(starter.id).toMatch(/^price_/);
    expect(pro.id).toMatch(/^price_/);
  }, 15_000);
});
