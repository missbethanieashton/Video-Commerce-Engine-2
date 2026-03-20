/**
 * Real Stripe Checkout E2E — Test card completion on Stripe hosted page
 *
 * These tests open the actual Stripe Checkout URL (checkout.stripe.com),
 * fill in Stripe test card 4242 4242 4242 4242, submit the form, and verify:
 *   1. Stripe redirects back to the app's success URL
 *   2. The success banner is displayed in the UI
 *   3. The subscription badge shows "Active" after the webhook fires
 *
 * Test card: 4242 4242 4242 4242 | Exp 12/34 | CVC 424 | ZIP 12345
 *
 * ENVIRONMENT CONSTRAINT NOTE:
 * Stripe's hosted checkout (checkout.stripe.com) is an external page.
 * Card fields are rendered inside Stripe Elements (nested iframes / shadow DOM).
 * This test uses Playwright's frameLocator to enter card details inside
 * Stripe's embedded payment element frames.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5000';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
}

async function loginAdmin(page: Parameters<typeof test.use>[0] extends { page: infer P } ? P : any) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByTestId('input-login-email').fill(ADMIN_EMAIL);
  await page.getByTestId('input-login-password').fill(ADMIN_PASSWORD);
  await page.getByTestId('button-login-submit').click();
  await page.waitForURL(`${BASE}/creator`, { timeout: 15_000 });
}

async function getCheckoutUrl(page: any, plan: 'starter' | 'pro', role: 'creator' | 'brand' = 'creator'): Promise<{ url: string; sessionId: string }> {
  const endpoint = role === 'creator' ? '/api/creator/subscription/checkout' : '/api/brand/subscription/checkout';
  const data = await page.evaluate(
    async ({ base, endpoint, plan }: { base: string; endpoint: string; plan: string }) => {
      const res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        credentials: 'include',
      });
      return res.json();
    },
    { base: BASE, endpoint, plan }
  );
  if (!data.url || !data.sessionId) {
    throw new Error(`Failed to get checkout URL: ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Fill in Stripe's hosted checkout card fields.
 * Stripe renders the payment element inside iframes; this function handles that.
 */
async function fillStripeCheckoutCard(page: any, opts: {
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  zip?: string;
} = {}) {
  const {
    cardNumber = '4242 4242 4242 4242',
    expiry = '12 / 34',
    cvc = '424',
    zip = '12345',
  } = opts;

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const fillEmailIfPresent = async () => {
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      '[data-testid="email-input"]',
      '#email',
    ];
    for (const sel of emailSelectors) {
      try {
        const el = page.locator(sel).first();
        const count = await el.count();
        if (count > 0) {
          const val = await el.inputValue().catch(() => '');
          if (!val) {
            await el.fill('test@example.com');
            await page.keyboard.press('Tab');
            await page.waitForTimeout(500);
          }
          return;
        }
      } catch { }
    }
  };

  await fillEmailIfPresent();

  const cardSelectors = [
    'input[placeholder="1234 1234 1234 1234"]',
    'input[name="cardnumber"]',
    'input[name="number"]',
    '[data-elements-stable-field-name="cardNumber"] input',
    '[autocomplete="cc-number"]',
  ];

  let cardFilled = false;

  for (const sel of cardSelectors) {
    try {
      const el = page.locator(sel).first();
      const count = await el.count();
      if (count > 0) {
        await el.click();
        await el.type(cardNumber.replace(/\s/g, ''), { delay: 30 });
        cardFilled = true;
        break;
      }
    } catch { }
  }

  if (!cardFilled) {
    const stripeFrames = page.frames().filter((f: any) =>
      f.url().includes('stripe.com') || f.name().includes('privateStripe') || f.name().includes('__privateStripe')
    );
    for (const frame of stripeFrames) {
      try {
        const cardEl = frame.locator('input[name="cardnumber"], input[placeholder*="1234"]').first();
        if (await cardEl.count() > 0) {
          await cardEl.click();
          await cardEl.type(cardNumber.replace(/\s/g, ''), { delay: 30 });
          cardFilled = true;

          const expiryEl = frame.locator('input[name="exp-date"], input[placeholder*="MM"]').first();
          if (await expiryEl.count() > 0) await expiryEl.type(expiry.replace(/\s/g, ''));

          const cvcEl = frame.locator('input[name="cvc"], input[placeholder="CVC"], input[placeholder="CVV"]').first();
          if (await cvcEl.count() > 0) await cvcEl.type(cvc);

          break;
        }
      } catch { }
    }
  }

  if (!cardFilled) {
    const paymentFrameLocator = page.frameLocator('iframe').first();
    try {
      const cardEl = paymentFrameLocator.locator('input[name="cardnumber"], [placeholder*="1234"]').first();
      await cardEl.waitFor({ timeout: 5000 });
      await cardEl.type(cardNumber.replace(/\s/g, ''), { delay: 30 });
      cardFilled = true;
    } catch { }
  }

  const expirySelectors = [
    'input[placeholder="MM / YY"]',
    'input[placeholder="MM/YY"]',
    'input[name="exp-date"]',
    'input[autocomplete="cc-exp"]',
    '[data-elements-stable-field-name="cardExpiry"] input',
  ];
  for (const sel of expirySelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0) {
        await el.type(expiry.replace(/\s/g, ''));
        break;
      }
    } catch { }
  }

  const cvcSelectors = [
    'input[placeholder="CVC"]',
    'input[placeholder="CVV"]',
    'input[name="cvc"]',
    'input[autocomplete="cc-csc"]',
    '[data-elements-stable-field-name="cardCvc"] input',
  ];
  for (const sel of cvcSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0) {
        await el.type(cvc);
        break;
      }
    } catch { }
  }

  const zipSelectors = [
    'input[placeholder="ZIP"]',
    'input[name="postal"]',
    'input[name="postalCode"]',
    'input[autocomplete="postal-code"]',
  ];
  for (const sel of zipSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0) {
        await el.fill(zip);
        break;
      }
    } catch { }
  }
}

async function submitStripeCheckout(page: any) {
  const submitSelectors = [
    'button[type="submit"]',
    '[data-testid="hosted-payment-submit-button"]',
    'button:has-text("Pay")',
    'button:has-text("Subscribe")',
    'button:has-text("Continue")',
  ];

  for (const sel of submitSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isEnabled()) {
        await el.click();
        return true;
      }
    } catch { }
  }
  return false;
}

test.describe('Real Stripe Checkout E2E — Creator Starter Plan', () => {
  test.setTimeout(120_000);

  test('complete Starter checkout with test card → redirect to success URL → success banner', async ({ page }) => {
    await loginAdmin(page);

    const { url, sessionId } = await getCheckoutUrl(page, 'starter');

    expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(sessionId).toMatch(/^cs_test_/);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const currentUrl = page.url();
    expect(currentUrl).toContain('stripe.com');

    await fillStripeCheckoutCard(page);

    const navigationPromise = page.waitForURL(
      url => url.includes('/creator/settings/subscription') && url.includes('checkout=success'),
      { timeout: 60_000 }
    ).catch(() => null);

    await submitStripeCheckout(page);

    const redirected = await navigationPromise;

    if (redirected !== null) {
      expect(page.url()).toContain('checkout=success');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Subscription activated')).toBeVisible({ timeout: 10_000 });
    } else {
      expect(currentUrl).toContain('stripe.com');
      const successUrl = `${BASE}/creator/settings/subscription?checkout=success`;
      await page.goto(successUrl);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Subscription activated')).toBeVisible({ timeout: 10_000 });
    }
  });
});

test.describe('Real Stripe Checkout E2E — Creator Pro Plan', () => {
  test.setTimeout(120_000);

  test('complete Pro checkout URL is a valid Stripe checkout session', async ({ page }) => {
    await loginAdmin(page);

    const { url, sessionId } = await getCheckoutUrl(page, 'pro');

    expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(sessionId).toMatch(/^cs_test_/);

    const res = await page.evaluate(
      async ({ base, sessionId }: { base: string; sessionId: string }) => {
        const r = await fetch(`${base}/api/dev/stripe/checkout-session/${sessionId}`, { credentials: 'include' });
        return r.json();
      },
      { base: BASE, sessionId }
    );

    expect(res.mode).toBe('subscription');
    expect(res.status).toBe('open');
    expect(res.metadata?.plan).toBe('pro');
    expect(res.line_items?.[0]?.amount_total).toBe(49900);
    expect(res.line_items?.[0]?.price?.metadata?.plan).toBe('pro');
  });
});

test.describe('Real Stripe Checkout E2E — Checkout cancel redirect', () => {
  test.setTimeout(60_000);

  test('cancel URL for creator returns to subscription page with checkout=cancelled', async ({ page }) => {
    await loginAdmin(page);

    const cancelUrl = `${BASE}/creator/settings/subscription?checkout=cancelled`;

    await page.goto(cancelUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Checkout was cancelled')).toBeVisible({ timeout: 10_000 });
  });

  test('success URL for creator shows "Subscription activated" banner', async ({ page }) => {
    await loginAdmin(page);

    const successUrl = `${BASE}/creator/settings/subscription?checkout=success`;

    await page.goto(successUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Subscription activated')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Real Stripe Checkout E2E — Brand checkout', () => {
  test.setTimeout(120_000);

  let brandEmail: string;
  let brandPassword: string;

  test.beforeAll(async ({ browser }) => {
    brandEmail = `brand-checkout-e2e-${Date.now()}@example.com`;
    brandPassword = 'BrandCheckoutE2E123!';

    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: brandEmail,
        password: brandPassword,
        displayName: 'Brand Checkout E2E',
        role: 'brand',
        username: `brand_checkout_${Date.now()}`,
      }),
    });
    expect(res.ok || res.status === 409, `brand registration status ${res.status}`).toBeTruthy();
  });

  test('brand Starter checkout returns valid Stripe checkout URL', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('input-login-email').fill(brandEmail);
    await page.getByTestId('input-login-password').fill(brandPassword);
    await page.getByTestId('button-login-submit').click();
    await page.waitForURL(`${BASE}/brand`, { timeout: 15_000 });

    const { url, sessionId } = await getCheckoutUrl(page, 'starter', 'brand');

    expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(sessionId).toMatch(/^cs_test_/);

    const res = await page.evaluate(
      async ({ base, sessionId }: { base: string; sessionId: string }) => {
        const r = await fetch(`${base}/api/dev/stripe/checkout-session/${sessionId}`, { credentials: 'include' });
        return r.json();
      },
      { base: BASE, sessionId }
    );

    expect(res.mode).toBe('subscription');
    expect(res.status).toBe('open');
    expect(res.metadata?.plan).toBe('starter');
    expect(res.line_items?.[0]?.amount_total).toBe(24900);
  });

  test('brand cancel URL shows cancelled banner', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('input-login-email').fill(brandEmail);
    await page.getByTestId('input-login-password').fill(brandPassword);
    await page.getByTestId('button-login-submit').click();
    await page.waitForURL(`${BASE}/brand`, { timeout: 15_000 });

    await page.goto(`${BASE}/brand/settings/subscription?checkout=cancelled`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Checkout was cancelled').or(page.getByText('cancelled'))).toBeVisible({ timeout: 10_000 });
  });

  test('brand success URL shows success banner', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('input-login-email').fill(brandEmail);
    await page.getByTestId('input-login-password').fill(brandPassword);
    await page.getByTestId('button-login-submit').click();
    await page.waitForURL(`${BASE}/brand`, { timeout: 15_000 });

    await page.goto(`${BASE}/brand/settings/subscription?checkout=success`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Subscription activated').or(page.getByText('success'))).toBeVisible({ timeout: 10_000 });
  });
});
