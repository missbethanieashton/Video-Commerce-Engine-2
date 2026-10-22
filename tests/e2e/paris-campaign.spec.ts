import { test, expect } from "@playwright/test";

test("direct links, QR sharing, form errors, and two-pass success work across screen sizes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new Error("cancelled"); } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { (window as any).__copiedInvite = text; } } });
  });
  await page.goto("/paris-creator-week");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Future: Interactive Entertainment");
  await expect(page.getByAltText("Scan to open the Paris Creator Week campaign")).toHaveAttribute("src", /^data:image\/png/);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      return [...document.querySelectorAll(".pcw h1, .pcw form, .pcw-input, .pcw-public-share img, .pcw-pass-panel")]
        .filter(el => {
          const bounds = el.getBoundingClientRect();
          return bounds.left < -1 || bounds.right > viewport + 1 || el.scrollWidth > el.clientWidth + 1;
        }).map(el => el.className);
    });
    expect(overflow, `overflow at ${width}px`).toEqual([]);
  }
  await page.getByRole("button", { name: "Share", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__copiedInvite)).toBe(new URL("/paris-creator-week", page.url()).href);
  await page.getByRole("button", { name: "Claim both free passes" }).click();
  await expect(page.getByRole("alert")).toContainText("check");
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
  let submitted: any;
  await page.route("**/api/paris-creator-week/claim", async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
      success: true, creatorCode: "PCW26-C-TEST-ONLY", friendCode: "PCW26-F-TEST-ONLY",
      expiresAt: new Date(Date.now() + 14 * 86400_000).toISOString(), emailStatus: "unavailable",
    }) });
  });
  await page.getByLabel("Full name").fill("Browser Test");
  await page.getByLabel("Email address").fill("browser-test@example.invalid");
  await page.getByRole("button", { name: "TikTok", exact: true }).click();
  await page.getByLabel("Your creator handle", { exact: true }).fill("@creator");
  await page.getByLabel("Your friend’s handle", { exact: true }).fill("@friend");
  await page.getByRole("button", { name: "Claim both free passes" }).click();
  await expect(page.getByText("Your passes are ready.")).toBeVisible();
  await expect(page.getByText("PCW26-C-TEST-ONLY")).toBeVisible();
  await expect(page.getByText("PCW26-F-TEST-ONLY")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Email delivery is unavailable" })).toBeVisible();
  expect(submitted.platform).toBe("tiktok");
  expect(submitted.creatorHandle).toBe("creator");
  expect(submitted.friendHandle).toBe("friend");
  expect(submitted.requestId).toMatch(/^[a-f0-9-]{36}$/);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.locator("#passes").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});
