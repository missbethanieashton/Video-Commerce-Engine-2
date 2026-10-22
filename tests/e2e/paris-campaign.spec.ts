import { test, expect } from "@playwright/test";

test("direct links, QR sharing, form errors, and two-pass success work across screen sizes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new Error("cancelled"); } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { (window as any).__copiedInvite = text; } } });
  });
  await page.goto("/paris-creator-week");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/YOUR CONTENT.*YOUR COMMERCE.*YOUR CUT/);
  await expect(page.locator(".pcw > section")).toHaveCount(3);
  await expect(page.getByText("EXCLUSIVE COMPETITION", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "ENTER NOW", exact: true })).toHaveAttribute("href", "#claim");
  await expect(page.locator(".pcw-competition-instructions")).toHaveText("Sign up. Publish your shoppable videos by November 19.Most engaged video receives €2000 cash prize.Announced December 19.");
  await expect(page.locator(".pcw-privacy")).toContainText("MTRLZD Creator Passes");
  await expect(page.locator(".pcw-header > a").first()).toHaveAttribute("aria-label", "MTRLZD home");
  await expect(page.locator(".pcw-brand img")).toHaveAttribute("src", "/paris-creator-week-logo.png");
  await expect(page.locator(".pcw-hero-deck")).toContainText("Enhance your brand partnerships.");
  await expect(page.getByRole("link", { name: "Claim A Creator Pass", exact: true })).toHaveAttribute("href", "#claim");
  await expect(page.locator(".pcw-demo-rail")).toContainText("Enable or Disable Commerce within your videos for your audience to shop instantly");
  await expect(page.locator(".pcw-voucher-label")).toHaveText(["YOUR PASS", "FRIEND'S PASS"]);
  await expect(page.locator(".pcw-voucher-mid h4")).toHaveText(["Creator Pass", "Creator Pass"]);
  await expect(page.locator(".pcw")).not.toContainText(/YOUR TWO VOUCHERS|CREATOR SUMMIT ACTIVATION|Explore the summit|The Future:|Register at Paris|Pause the demo|SUMMIT COMPETITION/);
  await expect(page.locator(".pcw-header button")).toHaveCount(1);
  await expect(page.getByAltText("QR code for the Paris Creator Week invitation")).toHaveAttribute("src", /^data:image\/png/);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      return [...document.querySelectorAll(".pcw h1, .pcw h2, .pcw form, .pcw-input, .pcw-demo-stage, .pcw-pass-panel, .pcw-voucher-card, .pcw-voucher-mid h4, .pcw-voucher-code strong")]
        .filter(el => {
          const bounds = el.getBoundingClientRect();
          // Ticket notch decorations intentionally extend outside a clipped card.
          // Check the card bounds and its actual text, not that decorative bleed.
          return bounds.left < -1 || bounds.right > viewport + 1
            || (!el.matches(".pcw-voucher-card") && el.scrollWidth > el.clientWidth + 1);
        }).map(el => el.className);
    });
    expect(overflow, `overflow at ${width}px`).toEqual([]);
    expect(await page.locator(".pcw-footer-home img").evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return Math.abs((bounds.left + bounds.right) / 2 - document.documentElement.clientWidth / 2);
    })).toBeLessThan(1);
  }
  const shareButton = page.getByRole("button", { name: "Share invitation", exact: true }).first();
  expect(await shareButton.innerText()).toBe("");
  await shareButton.click();
  expect(await page.evaluate(() => (window as any).__copiedInvite)).toBe(new URL("/paris-creator-week", page.url()).href);
  await page.getByRole("button", { name: "Get your voucher", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("check");
  await expect(page.getByLabel("First Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  let submitted: any;
  await page.route("**/api/paris-creator-week/claim", async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
      success: true, creatorCode: "PCW26-C-TEST-ONLY", friendCode: "PCW26-F-TEST-ONLY",
      expiresAt: new Date(Date.now() + 14 * 86400_000).toISOString(), emailStatus: "unavailable",
    }) });
  });
  await page.getByLabel("First Name", { exact: true }).fill("Browser");
  await page.getByLabel("Email", { exact: true }).fill("browser-test@example.invalid");
  await page.getByRole("button", { name: "TikTok", exact: true }).click();
  await page.getByLabel("Your Instagram or TikTok handle", { exact: true }).fill("@creator");
  await page.getByLabel("Friend’s handle", { exact: true }).fill("@friend");
  await page.getByRole("button", { name: "Get your voucher", exact: true }).click();
  await expect(page.getByText("Your passes are ready.")).toBeVisible();
  await expect(page.getByText("PCW26-C-TEST-ONLY")).toBeVisible();
  await expect(page.getByText("PCW26-F-TEST-ONLY")).toBeVisible();
  await expect(page.locator(".pcw-voucher-label")).toHaveText(["YOUR PASS", "FRIEND'S PASS"]);
  await expect(page.locator(".pcw-voucher-mid h4")).toHaveText(["Creator Pass", "Creator Pass"]);
  await expect(page.getByRole("status").filter({ hasText: /Email delivery.*unavailable/ })).toBeVisible();
  expect(submitted.platform).toBe("tiktok");
  expect(submitted.creatorHandle).toBe("creator");
  expect(submitted.friendHandle).toBe("friend");
  expect(submitted.requestId).toMatch(/^[a-f0-9-]{36}$/);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.locator("#passes").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test("video playback, seeking, product hotspot and motion controls work", async ({ page }) => {
  await page.goto("/paris-creator-week");
  const video = page.locator("video");
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).readyState)).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Pause video", exact: true }).click();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.getByRole("button", { name: "Play video", exact: true }).click();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(false);
  await page.getByRole("button", { name: "Unmute video", exact: true }).click();
  expect(await video.evaluate(v => (v as HTMLVideoElement).muted)).toBe(false);
  await page.getByRole("slider", { name: "Seek video demo" }).fill("12");
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThanOrEqual(12);
  const hotspot = page.getByRole("button", { name: /Show Miro/ });
  await hotspot.click();
  await expect(hotspot).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "View the look" })).toBeVisible();
  await page.getByRole("button", { name: "Pause video", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(() => page.locator("video").evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("cash prize animation repeats while visible and Enter Now reaches signup", async ({ page }) => {
  await page.goto("/paris-creator-week");
  const prize = page.locator(".pcw-prize strong");
  await page.locator("#summit").scrollIntoViewIfNeeded();
  await expect.poll(() => prize.textContent()).not.toBe("€2,000");
  await expect(prize).toHaveText("€2,000");
  await expect.poll(() => prize.textContent(), { timeout: 7000 }).not.toBe("€2,000");
  await expect(prize).toHaveText("€2,000");
  await page.getByRole("link", { name: "ENTER NOW", exact: true }).click();
  await expect(page).toHaveURL(/#claim$/);
  await expect(page.getByPlaceholder("First Name", { exact: true })).toBeInViewport();
  await expect(page.locator(".pcw-sponsor img")).toHaveAttribute("alt", "MTRLZD");
  await expect(page.locator(".pcw-footer-home a")).toHaveAttribute("href", "/");
});

test("homepage campaign tab stays fixed on the right and reuses the unchanged product carousel", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("link-nav-paris-creator-week")).toHaveCount(0);
  const campaignLink = page.getByTestId("link-paris-creator-week-tab");
  await expect(campaignLink.getByRole("img", { name: "Paris Creator Week" })).toBeVisible();
  await expect(campaignLink.getByRole("img")).toHaveAttribute("src", "/paris-creator-week-logo.png");
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const initial = await campaignLink.boundingBox();
    expect(initial!.x + initial!.width).toBeCloseTo(width, 0);
    await page.evaluate(() => window.scrollTo(0, 1200));
    const after = await campaignLink.boundingBox();
    expect(after!.y).toBeCloseTo(initial!.y, 0);
    expect(await campaignLink.evaluate(el => getComputedStyle(el).position)).toBe("fixed");
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await expect(page.getByTestId("button-nav-get-started")).toHaveCount(0);
  await expect(page.getByTestId("button-nav-signin")).toBeVisible();
  await expect(page.getByTestId("button-nav-pricing")).toBeVisible();
  const cardStyle = await page.getByTestId("card-miro-black-dress-hero").locator("div").first().evaluate(el => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, padding: s.padding, background: s.backgroundColor };
  });
  await campaignLink.click();
  await expect(page).toHaveURL(/\/paris-creator-week$/);
  expect(await page.getByTestId("card-miro-black-dress-hero").locator("div").first().evaluate(el => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, padding: s.padding, background: s.backgroundColor };
  })).toEqual(cardStyle);
  expect(await page.locator(".pcw-hero").evaluate(el => getComputedStyle(el).backgroundImage
    + getComputedStyle(el, "::before").backgroundImage
    + getComputedStyle(el, "::after").backgroundImage)).toContain("paris-haussmann-chromatic.webp");
  expect(await page.locator(".pcw-interactive").evaluate(el => getComputedStyle(el).backgroundImage
    + getComputedStyle(el, "::before").backgroundImage
    + getComputedStyle(el, "::after").backgroundImage)).not.toContain("haussmann");
});
