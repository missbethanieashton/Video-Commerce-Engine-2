import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../server/db", () => ({ db: { transaction: vi.fn().mockRejectedValue(new Error("offline")) } }));
vi.mock("../../server/emailService", () => ({ isEmailConfigured: () => false, sendParisPassEmail: vi.fn() }));
import { registerParisCampaignRoutes } from "../../server/parisCampaign";

describe("Paris campaign failure response", () => {
  it("never claims success or returns codes when persistence fails", async () => {
    const app = express();
    app.use(express.json());
    registerParisCampaignRoutes(app);
    const result = await request(app).post("/api/paris-creator-week/claim").send({
      fullName: "Test Person", email: "person@example.invalid", platform: "tiktok",
      creatorHandle: "creator", friendHandle: "friend",
    });
    expect(result.status).toBe(503);
    expect(result.body.success).toBeUndefined();
    expect(result.body.creatorCode).toBeUndefined();
    expect(result.body.error).toContain("Please try again");
  });
});
