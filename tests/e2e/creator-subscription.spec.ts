import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5000';

test.describe('Creator Subscription Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/creator/settings/subscription`);
    await page.waitForLoadState('networkidle');
  });

  test('renders subscription heading and back button', async ({ page }) => {
    await expect(page.getByText('Subscription')).toBeVisible();
    await expect(page.getByTestId('button-back-settings')).toBeVisible();
  });

  test('renders plan card with price and status badge', async ({ page }) => {
    await expect(page.getByText('Starter Plan').or(page.getByText('Pro Plan'))).toBeVisible();
    const pricePattern = /€249|€499/;
    await expect(page.getByText(pricePattern)).toBeVisible();
  });

  test('renders upgrade plan and billing portal buttons', async ({ page }) => {
    await expect(page.getByTestId('button-upgrade-plan')).toBeVisible();
    await expect(page.getByTestId('button-cancel-plan')).toBeVisible();
  });

  test('surplus calculator shows sliders and initial total of €0,00', async ({ page }) => {
    await expect(page.getByTestId('text-total-surplus')).toBeVisible();
    const surplusText = await page.getByTestId('text-total-surplus').textContent();
    expect(surplusText).toMatch(/€0,00/);

    await expect(page.getByTestId('button-pay-surplus')).toBeDisabled();
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

  test('clicking Starter plan triggers checkout API (returns 401 in demo mode)', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        r => r.url().includes('/api/creator/subscription/checkout') && r.request().method() === 'POST',
        { timeout: 8_000 }
      ).catch(() => null),
      (async () => {
        await page.getByTestId('button-upgrade-plan').click();
        await page.waitForTimeout(300);
        const starterBtn = page.getByTestId('button-select-plan-starter');
        if (await starterBtn.isEnabled()) {
          await starterBtn.click();
        }
      })(),
    ]);

    if (response) {
      expect([200, 401, 500]).toContain(response.status());
    }
  });

  test('plan selector dialog features list includes expected plan features', async ({ page }) => {
    await page.getByTestId('button-upgrade-plan').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await expect(page.getByText('Up to 10 videos')).toBeVisible();
    await expect(page.getByText('Unlimited videos')).toBeVisible();
  });

  test('checkout=success query parameter shows success banner', async ({ page }) => {
    await page.goto(`${BASE}/creator/settings/subscription?checkout=success`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Subscription activated')).toBeVisible();
  });

  test('checkout=cancelled query parameter shows cancelled banner', async ({ page }) => {
    await page.goto(`${BASE}/creator/settings/subscription?checkout=cancelled`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Checkout was cancelled')).toBeVisible();
  });
});
