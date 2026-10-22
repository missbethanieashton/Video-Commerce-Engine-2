import { describe, expect, it } from "vitest";
import { parisSignupSchema } from "../../shared/paris-campaign";
import { withParisCampaignMeta } from "../../server/parisCampaignMeta";
import type { Request } from "express";

const valid = {
  fullName: "Test Creator", email: " CREATOR@example.com ", platform: "instagram",
  creatorHandle: "@@Creator.One", friendHandle: "@Friend_2",
};
describe("Paris campaign validation", () => {
  it("normalizes emails and optional leading @ symbols", () => {
    const result = parisSignupSchema.parse(valid);
    expect(result.email).toBe("creator@example.com");
    expect(result.creatorHandle).toBe("creator.one");
    expect(result.friendHandle).toBe("friend_2");
  });
  it.each([
    { fullName: "" }, { email: "not-email" }, { platform: "twitter" },
    { creatorHandle: "https://instagram.com/person" }, { friendHandle: "@creator.one" },
    { creatorHandle: ".name" }, { friendHandle: "friend..name" }, { friendHandle: "" },
  ])("rejects invalid or identical handles: %o", patch => {
    expect(parisSignupSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it("accepts TikTok", () => {
    expect(parisSignupSchema.safeParse({ ...valid, platform: "tiktok" }).success).toBe(true);
  });
});

describe("campaign link metadata", () => {
  const request = (path: string, host = "events.example.com") => ({
    path, secure: false, get: (key: string) => key === "host" ? host : key === "x-forwarded-proto" ? "https" : undefined,
  }) as Request;
  it("is in server HTML and uses the current origin", () => {
    const result = withParisCampaignMeta("<html><head></head></html>", request("/paris-creator-week/"));
    expect(result).toContain("https://events.example.com/paris-creator-week");
    expect(result).toContain('property="og:image"');
    expect(result).toContain("Paris Creator Week 2026");
  });
  it("does not alter the homepage or permit hostile host markup", () => {
    const html = "<head></head>";
    expect(withParisCampaignMeta(html, request("/"))).toBe(html);
    expect(withParisCampaignMeta(html, request("/paris-creator-week", '"><script>'))).toBe(html);
  });
  it("recognizes the original URL inside Express wildcard middleware", () => {
    const req = { ...request("/"), originalUrl: "/paris-creator-week?invite=friend" } as Request;
    expect(withParisCampaignMeta("<head></head>", req)).toContain('property="og:title"');
  });
});
