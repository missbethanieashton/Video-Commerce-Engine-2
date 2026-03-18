import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5000';

// Brand-specific test credentials — registered once per test run via API
const BRAND_EMAIL = `brand-e2e-${Date.now()}@example.com`;
const BRAND_PASSWORD = 'BrandE2E123!';

async function registerBrandUser() {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: BRAND_EMAIL,
      password: BRAND_PASSWORD,
      displayName: 'Brand E2E Test',
      role: 'brand',
    }),
  });
  return res.ok || res.status === 409;
}

async function loginAsBrand(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByTestId('input-email').fill(BRAND_EMAIL);
  await page.getByTestId('input-password').fill(BRAND_PASSWORD);
  await page.getByTestId('button-login-submit').click();
  await page.waitForURL(`${BASE}/brand`, { timeout: 10_000 });
}

test.describe('Brand Subscription Page — Unauthenticated', () => {
  test('redirects to /login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/brand/settings/subscription`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/login');
  });
});

test.describe('Brand Subscription Page — Authenticated Brand User', () => {
  test.beforeAll(async () => {
    await registerBrandUser();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsBrand(page);
    await page.goto(`${BASE}/brand/settings/subscription`);
    await page.waitForLoadState('networkidle');
  });

  test('renders subscription heading', async ({ page }) => {
    await expect(page.getByText('Subscription')).toBeVisible();
    await expect(page.getByText('Your current plan and billing')).toBeVisible();
  });

  test('renders plan card with price and status badge', async ({ page }) => {
    await expect(page.getByText('Starter Plan').or(page.getByText('Pro Plan'))).toBeVisible();
    const pricePattern = /€249|€499/;
    await expect(page.getByText(pricePattern)).toBeVisible();
  });

  test('renders upgrade plan and cancel-plan buttons', async ({ page }) => {
    await expect(page.getByTestId('button-upgrade-plan')).toBeVisible();
    await expect(page.getByTestId('button-cancel-plan')).toBeVisible();
  });

  test('surplus calculator shows sliders and initial total of €0,00', async ({ page }) => {
    await expect(page.getByText('Estimate overage charges')).toBeVisible();

    const surplusEl = page.getByTestId('text-total-surplus');
    await expect(surplusEl).toBeVisible();
    const surplusText = await surplusEl.textContent();
    expect(surplusText).toMatch(/€0,00/);

    await expect(page.getByTestId('button-pay-surplus')).toBeDisabled();
  });

  test('surplus calculator shows rate information', async ({ page }) => {
    await expect(page.getByText('€0.05 / view')).toBeVisible();
    await expect(page.getByText('€0.15 / minute')).toBeVisible();
  });

  test('surplus calculator shows view/minute/publisher sliders with labels', async ({ page }) => {
    await expect(page.getByTestId('text-views-value')).toBeVisible();
    await expect(page.getByTestId('text-minutes-value')).toBeVisible();
    await expect(page.getByTestId('text-publishers-value')).toBeVisible();
  });

  test('opens plan selector dialog with Starter and Pro options', async ({ page }) => {
    await page.getByTestId('button-upgrade-plan').click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Choose your plan')).toBeVisible();

    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('€249')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('€499')).toBeVisible();

    await expect(page.getByTestId('button-select-plan-starter')).toBeVisible();
    await expect(page.getByTestId('button-select-plan-pro')).toBeVisible();
  });

  test('plan dialog shows "Popular" badge on Pro plan', async ({ page }) => {
    await page.getByTestId('button-upgrade-plan').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Popular')).toBeVisible();
  });

  test('plan dialog closes on Escape key', async ({ page }) => {
    await page.getByTestId('button-upgrade-plan').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('clicking Starter plan triggers checkout API and returns a Stripe URL', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        r => r.url().includes('/api/brand/subscription/checkout') && r.request().method() === 'POST',
        { timeout: 10_000 }
      ),
      (async () => {
        await page.getByTestId('button-upgrade-plan').click();
        await page.waitForTimeout(300);
        await page.getByTestId('button-select-plan-starter').click();
      })(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('url');
    expect(typeof body.url).toBe('string');
    expect(body.url).toMatch(/^https:\/\//);
  });

  test('clicking Pro plan triggers checkout API and returns a Stripe URL with cs_test_ sessionId', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        r => r.url().includes('/api/brand/subscription/checkout') && r.request().method() === 'POST',
        { timeout: 10_000 }
      ),
      (async () => {
        await page.getByTestId('button-upgrade-plan').click();
        await page.waitForTimeout(300);
        await page.getByTestId('button-select-plan-pro').click();
      })(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('url');
    expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(body).toHaveProperty('sessionId');
    expect(body.sessionId).toMatch(/^cs_test_/);
  });

  test('plan dialog shows included features for each plan', async ({ page }) => {
    await page.getByTestId('button-upgrade-plan').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await expect(page.getByText('5 active campaigns')).toBeVisible();
    await expect(page.getByText('Unlimited campaigns')).toBeVisible();
  });

  test('checkout=success shows subscription activated banner', async ({ page }) => {
    await page.goto(`${BASE}/brand/settings/subscription?checkout=success`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Subscription activated')).toBeVisible();
  });

  test('checkout=cancelled shows cancelled banner', async ({ page }) => {
    await page.goto(`${BASE}/brand/settings/subscription?checkout=cancelled`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Checkout was cancelled')).toBeVisible();
  });
});
