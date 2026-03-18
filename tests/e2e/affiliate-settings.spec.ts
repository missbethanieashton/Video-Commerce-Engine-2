import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5000';

test.describe('Affiliate Settings — Payout Account (Stripe Connect)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/affiliate/settings`);
    await page.waitForLoadState('networkidle');
  });

  test('renders Payout Settings heading', async ({ page }) => {
    await expect(page.getByTestId('text-page-title')).toBeVisible();
    await expect(page.getByTestId('text-page-title')).toHaveText('Payout Settings');
  });

  test('renders Account Overview card with email and commission rate', async ({ page }) => {
    await expect(page.getByText('Account Overview')).toBeVisible();
    await expect(page.getByTestId('text-user-email')).toBeVisible();
    await expect(page.getByTestId('text-commission-rate')).toBeVisible();
  });

  test('renders Payout Account card', async ({ page }) => {
    await expect(page.getByText('Payout Account')).toBeVisible();
    await expect(page.getByText('Connect your bank account to receive affiliate commissions')).toBeVisible();
  });

  test('renders Payout Schedule card with monthly frequency', async ({ page }) => {
    await expect(page.getByText('Payout Schedule')).toBeVisible();
    await expect(page.getByText('Monthly')).toBeVisible();
  });

  test('shows Create Payout Account or Complete Onboarding button based on connect status', async ({ page }) => {
    const createBtn = page.getByTestId('button-create-payout-account');
    const onboardBtn = page.getByTestId('button-complete-onboarding');
    const payoutsActive = page.getByText('Payouts Active');

    const createVisible = await createBtn.isVisible().catch(() => false);
    const onboardVisible = await onboardBtn.isVisible().catch(() => false);
    const payoutsVisible = await payoutsActive.isVisible().catch(() => false);

    expect(createVisible || onboardVisible || payoutsVisible).toBe(true);
  });

  test('GET /api/stripe/connect/status returns connected status JSON', async ({ request }) => {
    const response = await request.get(`${BASE}/api/stripe/connect/status`);
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body).toHaveProperty('connected');
    expect(body).toHaveProperty('onboarded');
    expect(typeof body.connected).toBe('boolean');
    expect(typeof body.onboarded).toBe('boolean');
  });
});
