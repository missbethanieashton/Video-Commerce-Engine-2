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
  await expect(page.getByRole("heading", { name: "The Future: Interactive Entertainment" })).toBeVisible();
  await expect(page.getByAltText("QR code for the Paris Creator Week invitation")).toHaveAttribute("src", /^data:image\/png/);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      return [...document.querySelectorAll(".pcw h1, .pcw h2, .pcw form, .pcw-input, .pcw-demo-stage, .pcw-pass-panel")]
        .filter(el => {
          const bounds = el.getBoundingClientRect();
          return bounds.left < -1 || bounds.right > viewport + 1 || el.scrollWidth > el.clientWidth + 1;
        }).map(el => el.className);
    });
    expect(overflow, `overflow at ${width}px`).toEqual([]);
  }
  const shareButton = page.getByRole("button", { name: "Share invitation", exact: true }).first();
  expect(await shareButton.innerText()).toBe("");
  await shareButton.click();
  expect(await page.evaluate(() => (window as any).__copiedInvite)).toBe(new URL("/paris-creator-week", page.url()).href);
  await page.getByRole("button", { name: "Get your voucher", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("check");
  await expect(page.getByLabel("Creator name")).toHaveAttribute("aria-invalid", "true");
  let submitted: any;
  await page.route("**/api/paris-creator-week/claim", async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
      success: true, creatorCode: "PCW26-C-TEST-ONLY", friendCode: "PCW26-F-TEST-ONLY",
      expiresAt: new Date(Date.now() + 14 * 86400_000).toISOString(), emailStatus: "unavailable",
    }) });
  });
  await page.getByLabel("Creator name").fill("Browser Test");
  await page.getByLabel("Email address").fill("browser-test@example.invalid");
  await page.getByRole("button", { name: "TikTok", exact: true }).click();
  await page.getByLabel("Your Instagram or TikTok handle", { exact: true }).fill("@creator");
  await page.getByLabel("Friend’s handle", { exact: true }).fill("@friend");
  await page.getByRole("button", { name: "Get your voucher", exact: true }).click();
  await expect(page.getByText("Your passes are ready.")).toBeVisible();
  await expect(page.getByText("PCW26-C-TEST-ONLY")).toBeVisible();
  await expect(page.getByText("PCW26-F-TEST-ONLY")).toBeVisible();
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
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
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

test("homepage header uses the campaign logo and omits redundant Get Started", async ({ page }) => {
  await page.goto("/");
  const campaignLink = page.getByTestId("link-nav-paris-creator-week");
  await expect(campaignLink.getByRole("img", { name: "Paris Creator Week" })).toBeVisible();
  await expect(page.getByTestId("button-nav-get-started")).toHaveCount(0);
  await expect(page.getByTestId("button-nav-signin")).toBeVisible();
  await expect(page.getByTestId("button-nav-pricing")).toBeVisible();
  await campaignLink.click();
  await expect(page).toHaveURL(/\/paris-creator-week$/);
});
