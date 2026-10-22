import type { Request } from "express";

function escape(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

// Render in the initial HTML, not just React, so link-preview crawlers can read it.
export function withParisCampaignMeta(template: string, req: Request) {
  const pathname = (req.originalUrl || req.path).split("?")[0].replace(/\/$/, "");
  if (pathname !== "/paris-creator-week") return template;
  const host = req.get("host") ?? "";
  if (!/^[a-z0-9.:[\]-]+$/i.test(host)) return template;
  const protocol = req.get("x-forwarded-proto")?.split(",")[0].trim() === "https" || req.secure ? "https" : "http";
  const origin = `${protocol}://${host}`;
  const url = escape(`${origin}/paris-creator-week`);
  const image = escape(`${origin}/paris-creator-week-social.png`);
  return template.replace("</head>", `
    <title>Paris Creator Week 2026 | MTRLZD</title>
    <meta name="description" content="Claim two free Creator Passes: one for you and one for a friend. Discover interactive entertainment with MTRLZD at Paris Creator Week 2026." />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Paris Creator Week 2026 | MTRLZD" />
    <meta property="og:description" content="Two free Creator Passes. One for you, one for a friend. Explore the future of interactive entertainment." />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Paris Creator Week 2026 — MTRLZD — two free Creator Passes" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>`);
}
