import type { Express } from "express";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { eventVouchers, parisCampaignSignups } from "@shared/schema";
import { parisSignupSchema } from "@shared/paris-campaign";
import { isEmailConfigured, sendParisPassEmail } from "./emailService";

// Both passes and the signup commit together. No changes to legacy voucher storage.
export async function issueParisPasses(input: unknown) {
  const data = parisSignupSchema.parse(input);
  return db.transaction(async tx => {
    const [existing] = await tx.select().from(parisCampaignSignups)
      .where(eq(parisCampaignSignups.email, data.email));
    if (existing) {
      if (data.requestId && existing.requestId === data.requestId &&
          existing.fullName === data.fullName && existing.platform === data.platform &&
          existing.creatorHandle === data.creatorHandle && existing.friendHandle === data.friendHandle) {
        return { signup: existing, created: false };
      }
      const error = new Error("Passes have already been claimed for this email. Check your saved passes or use another email.");
      Object.assign(error, { status: 409 });
      throw error;
    }
    const creatorCode = `PCW26-C-${randomBytes(12).toString("hex").toUpperCase()}`;
    const friendCode = `PCW26-F-${randomBytes(12).toString("hex").toUpperCase()}`;
    // Matches the existing event-voucher activation window, not an invented event date.
    const expiresAt = new Date(Date.now() + 14 * 86400_000);
    await tx.insert(eventVouchers).values([
      { code: creatorCode, event: "paris-creator-week", firstName: data.fullName, email: data.email, expiresAt },
      { code: friendCode, event: "paris-creator-week", firstName: data.friendHandle, email: data.email, expiresAt },
    ]);
    const [signup] = await tx.insert(parisCampaignSignups).values({
      ...data, requestId: data.requestId ?? null, creatorCode, friendCode, expiresAt,
    }).returning();
    return { signup, created: true };
  });
}

export function registerParisCampaignRoutes(app: Express) {
  const attempts = new Map<string, { count: number; until: number }>();
  app.post("/api/paris-creator-week/claim", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const now = Date.now();
    attempts.forEach((entry, ip) => { if (entry.until < now) attempts.delete(ip); });
    // The preview/deployment reverse proxy may share an IP across visitors.
    // Scope by email too, so one event attendee cannot throttle the whole room.
    const ip = `${req.ip || "unknown"}:${createHash("sha256").update(String(req.body?.email ?? "").trim().toLowerCase()).digest("hex")}`;
    const entry = attempts.get(ip) ?? { count: 0, until: now + 3600_000 };
    if (attempts.size >= 10000) attempts.clear();
    entry.count++;
    attempts.set(ip, entry);
    if (entry.count > 20) {
      res.set("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
      return res.status(429).json({ error: "Too many attempts. Please try again in an hour." });
    }
    try {
      const { signup, created } = await issueParisPasses(req.body);
      let emailStatus: "sent" | "unavailable" | "failed" | "previously-issued" = created ? "unavailable" : "previously-issued";
      if (created && isEmailConfigured()) {
        try {
          await sendParisPassEmail({
            email: signup.email, creatorCode: signup.creatorCode,
            friendCode: signup.friendCode, expiresAt: signup.expiresAt,
          });
          emailStatus = "sent";
        } catch {
          emailStatus = "failed";
          console.error("Paris pass email delivery failed; passes remain saved.");
        }
      }
      return res.status(created ? 201 : 200).json({
        success: true, creatorCode: signup.creatorCode, friendCode: signup.friendCode,
        expiresAt: signup.expiresAt, emailStatus,
      });
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({
        error: "Please check the highlighted fields.", fieldErrors: error.flatten().fieldErrors,
      });
      if (error.status === 409 || error.code === "23505") return res.status(409).json({
        error: "Passes have already been claimed for this email. Check your saved passes or use another email.",
      });
      console.error("Paris pass persistence failed.");
      return res.status(503).json({ error: "We couldn't save your passes. Nothing has been issued. Please try again." });
    }
  });
}
