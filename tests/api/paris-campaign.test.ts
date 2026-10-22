import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

// Explicit opt-in: exercises real PostgreSQL and the running app, then removes fixtures.
const origin = process.env.PARIS_API_ORIGIN;
describe.skipIf(!origin)("Paris campaign real API + legacy voucher compatibility", () => {
  it("issues two persisted passes, retries safely, and preserves legacy validation/redemption", async () => {
    const { db, pool } = await import("../../server/db");
    const { storage } = await import("../../server/storage");
    const { eventVouchers, parisCampaignSignups } = await import("../../shared/schema");
    const { eq, inArray } = await import("drizzle-orm");
    const suffix = randomUUID();
    const email = `paris-fixture-${suffix}@example.invalid`;
    const legacyEmail = `legacy-fixture-${suffix}@example.invalid`;
    const requestId = randomUUID();
    const post = (data: unknown) => fetch(`${origin}/api/paris-creator-week/claim`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    try {
      const invalid = await post({ fullName: "", email: "broken", platform: "x" });
      expect(invalid.status).toBe(400);
      expect((await invalid.json()).fieldErrors.email).toBeTruthy();
      const data = { fullName: "Campaign Test", email, platform: "instagram", creatorHandle: "@Test.Creator", friendHandle: "@Test.Friend", requestId };
      const issued = await post(data);
      expect(issued.status).toBe(201);
      const body = await issued.json();
      expect(body.creatorCode).not.toBe(body.friendCode);
      expect(body.creatorCode).toMatch(/^PCW26-C-/);
      expect(body.friendCode).toMatch(/^PCW26-F-/);
      const [signup] = await db.select().from(parisCampaignSignups).where(eq(parisCampaignSignups.email, email));
      expect(signup.creatorHandle).toBe("test.creator");
      expect(signup.friendHandle).toBe("test.friend");
      const vouchers = await db.select().from(eventVouchers).where(inArray(eventVouchers.code, [body.creatorCode, body.friendCode]));
      expect(vouchers).toHaveLength(2);
      const retry = await post(data);
      expect(retry.status).toBe(200);
      expect((await retry.json()).creatorCode).toBe(body.creatorCode);
      const duplicate = await post({ ...data, requestId: randomUUID() });
      expect(duplicate.status).toBe(409);
      expect((await duplicate.json()).creatorCode).toBeUndefined();
      for (const code of [body.creatorCode, body.friendCode]) {
        const validated = await fetch(`${origin}/api/event-voucher/validate/${code}`);
        expect(validated.status).toBe(200);
        expect((await validated.json()).event).toBe("paris-creator-week");
      }
      // A Paris claim must not block the separate pre-existing event offer.
      expect(await storage.getEventVoucherByEmail(email)).toBeUndefined();
      // The existing redeem helper remains authoritative for both campaign and legacy.
      const { users } = await import("../../shared/schema");
      const [user] = await db.select({ id: users.id }).from(users).limit(1);
      expect(user).toBeTruthy();
      await storage.redeemEventVoucher(body.friendCode, user.id);
      expect((await fetch(`${origin}/api/event-voucher/validate/${body.friendCode}`)).status).toBe(409);
      for (const event of ["vivatech", "cannes"] as const) {
        const code = `TEST-${event}-${suffix}`;
        await storage.createEventVoucher({ code, event, firstName: "Legacy Test", email: legacyEmail, expiresAt: new Date(Date.now() + 86400_000) });
        const check = await fetch(`${origin}/api/event-voucher/validate/${code}`);
        expect(check.status).toBe(200);
        expect((await check.json()).event).toBe(event);
        await storage.redeemEventVoucher(code, user.id);
        expect((await fetch(`${origin}/api/event-voucher/validate/${code}`)).status).toBe(409);
      }
      const page = await fetch(`${origin}/paris-creator-week`);
      expect(page.status).toBe(200);
      expect((await page.text()).includes('property="og:title"')).toBe(true);
    } finally {
      await db.delete(parisCampaignSignups).where(eq(parisCampaignSignups.email, email));
      await db.delete(eventVouchers).where(inArray(eventVouchers.email, [email, legacyEmail]));
      await pool.end();
    }
  }, 45_000);
});
