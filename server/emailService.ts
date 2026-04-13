import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_ADDRESS = process.env.GMAIL_USER
  ? `"Materialized" <${process.env.GMAIL_USER}>`
  : '"Materialized" <hello@join.materialized>';

function baseTemplate(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #f6f6f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #202120; padding: 32px 40px; text-align: center; }
    .header img { height: 40px; }
    .header-title { color: #ffffff; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin-top: 12px; opacity: 0.6; }
    .body { padding: 40px; }
    .body h1 { font-size: 22px; color: #202120; margin: 0 0 16px; font-weight: 700; }
    .body p { font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 16px; }
    .video-box { background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 10px; padding: 20px; margin: 24px 0; }
    .video-box p { margin: 0; font-size: 14px; color: #777; }
    .video-box a { color: #677A67; font-weight: 600; text-decoration: none; }
    .cta-wrap { text-align: center; margin: 32px 0; }
    .cta { display: inline-block; background: #677A67; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 50px; letter-spacing: 0.5px; }
    .cta:hover { background: #556655; }
    .note { font-size: 12px; color: #aaa; text-align: center; margin-top: 8px; }
    .footer { background: #202120; padding: 24px 40px; text-align: center; }
    .footer p { color: #ffffff; opacity: 0.4; font-size: 11px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:2px;">MATERIALIZED</div>
      <div class="header-title">Video Commerce Platform</div>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>© 2026 Materialized. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendBrandOutreachEmail(opts: {
  prContactName: string;
  prContactEmail: string;
  creatorDisplayName: string;
  creatorFirstName?: string;
  creatorInstagramHandle?: string | null;
  brandName: string;
  videoTitle: string;
  videoPreviewUrl: string;
  authorizeUrl: string;
  creatorMessage?: string;
}): Promise<void> {
  const recipientFirstName = opts.prContactName.split(" ")[0];
  const creatorFirst = opts.creatorFirstName ?? opts.creatorDisplayName.split(" ")[0];
  const igLine = opts.creatorInstagramHandle
    ? `<span style="color:#677A67;font-weight:600;">@${opts.creatorInstagramHandle.replace(/^@/, "")}</span>`
    : "";

  const body = `
    <h1>Hey ${recipientFirstName},</h1>
    <p>
      <strong>${creatorFirst}${igLine ? ` (${igLine})` : ""}</strong> would like to make their latest video featuring
      <strong>${opts.brandName}</strong> products shoppable using Materialized — turning it into
      a fully interactive, commission-tracked experience your customers can shop directly from.
    </p>
    ${opts.creatorMessage ? `<p style="font-style:italic;border-left:3px solid #677A67;padding-left:14px;color:#444;">"${opts.creatorMessage}"</p>` : ""}
    <div class="video-box">
      <p><strong>📹 ${opts.videoTitle || "Video Preview"}</strong></p>
      <p style="margin-top:8px;">You can <a href="${opts.videoPreviewUrl}">preview the video here →</a></p>
    </div>
    <p>
      Clicking the button below authorises ${creatorFirst} to make this video shoppable
      with your brand's products. You'll then receive a <strong>Materialized Brand Agreement</strong>
      (via DocuSign) covering video marketplace commissions. Once signed, you'll receive the
      embeddable code to publish the shoppable video on your website.
    </p>
    <p style="font-size:13px;color:#999;">
      Note: A separate Materialized Brand subscription is required to access the full Brand
      dashboard and product management features.
    </p>
    <div class="cta-wrap">
      <a href="${opts.authorizeUrl}" class="cta">Let's Do This!</a>
    </div>
    <p class="note">If you weren't expecting this email, you can safely ignore it.</p>
  `;

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: opts.prContactEmail,
    subject: `${opts.creatorDisplayName} wants to make their video shoppable with ${opts.brandName}`,
    html: baseTemplate(body),
  });
}

export async function sendBrandAgreementEmail(opts: {
  prContactName: string;
  prContactEmail: string;
  creatorDisplayName: string;
  brandName: string;
  videoTitle: string;
  docuSignUrl: string;
  embedCode: string;
}): Promise<void> {
  const firstName = opts.prContactName.split(" ")[0];

  const body = `
    <h1>Hey ${firstName}, you're almost there!</h1>
    <p>
      Thank you for authorising <strong>${opts.creatorDisplayName}</strong> to make their
      <em>${opts.videoTitle || "video"}</em> shoppable with <strong>${opts.brandName}</strong> products.
    </p>
    <p>
      The next step is to review and sign the <strong>Materialized Brand Agreement</strong>,
      which covers the video marketplace commission terms. Click below to open the agreement in DocuSign:
    </p>
    <div class="cta-wrap">
      <a href="${opts.docuSignUrl}" class="cta">Review & Sign Agreement</a>
    </div>
    <p>
      Once signed, here is the <strong>embeddable code</strong> you can use to publish the
      shoppable video on your website:
    </p>
    <div class="video-box">
      <p style="font-family:monospace;font-size:12px;word-break:break-all;color:#333;">${opts.embedCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    </div>
    <p style="font-size:13px;color:#999;">
      To access the full Brand dashboard, campaign management, and product analytics, subscribe
      to Materialized as a Brand at <a href="https://join.materialized.com/brand" style="color:#677A67;">join.materialized.com/brand</a>.
    </p>
  `;

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: opts.prContactEmail,
    subject: `Your Materialized Brand Agreement — ${opts.brandName} × ${opts.creatorDisplayName}`,
    html: baseTemplate(body),
  });
}

export async function sendDocuSignReminderEmail(opts: {
  prContactName: string;
  prContactEmail: string;
  brandName: string;
  videoTitle: string;
  docuSignUrl: string;
}): Promise<void> {
  const firstName = opts.prContactName.split(" ")[0];
  const body = `
    <h1>Hey ${firstName}, just a nudge 👋</h1>
    <p>
      You authorised <strong>${opts.brandName}</strong> to feature in a shoppable video on Materialized —
      that's great! The final step is reviewing and signing the <strong>Materialized Brand Agreement</strong>
      via DocuSign. It takes less than two minutes.
    </p>
    <p>Once signed, your brand's products will be shoppable directly from <em>${opts.videoTitle || "the video"}</em>.</p>
    <div class="cta-wrap">
      <a href="${opts.docuSignUrl}" class="cta">Sign the Agreement</a>
    </div>
    <p class="note">Questions? Reply to this email and our team will be happy to help.</p>
  `;
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: opts.prContactEmail,
    subject: `Reminder: Your Materialized Brand Agreement is waiting — ${opts.brandName}`,
    html: baseTemplate(body),
  });
}

export async function sendVideoResultsExcitementEmail(opts: {
  prContactName: string;
  prContactEmail: string;
  brandName: string;
  videoTitle: string;
  videoViews: number;
  videoClicks: number;
  subscribeUrl: string;
}): Promise<void> {
  const firstName = opts.prContactName.split(" ")[0];
  const body = `
    <h1>The results are in, ${firstName}! 🚀</h1>
    <p>
      Your shoppable video — <em>${opts.videoTitle}</em> — is already making waves.
      Here's a snapshot of how <strong>${opts.brandName}</strong> is performing:
    </p>
    <div class="video-box" style="text-align:center;">
      <p style="font-size:28px;font-weight:800;color:#202120;margin:0;">${opts.videoViews.toLocaleString()}</p>
      <p style="margin-top:4px;color:#677A67;font-weight:600;">Video views</p>
      <p style="font-size:28px;font-weight:800;color:#202120;margin:16px 0 0;">${opts.videoClicks.toLocaleString()}</p>
      <p style="margin-top:4px;color:#677A67;font-weight:600;">Product clicks</p>
    </div>
    <p>
      Imagine scaling this across <strong>hundreds of creator campaigns globally</strong> — each one driving
      tracked, commission-based sales directly attributed to your brand. Materialized makes that possible.
    </p>
    <p>
      Brands already using Materialized are seeing up to <strong>3× higher engagement</strong> from shoppable
      video versus traditional display advertising — and every click is attributable, every sale is tracked.
    </p>
    <div class="cta-wrap">
      <a href="${opts.subscribeUrl}" class="cta">Start Your Brand Journey</a>
    </div>
    <p class="note">Join the brands turning creator content into their highest-performing sales channel.</p>
  `;
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: opts.prContactEmail,
    subject: `📈 Your video results are in — here's what Materialized did for ${opts.brandName}`,
    html: baseTemplate(body),
  });
}

export async function sendGlobalPitchEmail(opts: {
  prContactName: string;
  prContactEmail: string;
  brandName: string;
  subscribeUrl: string;
}): Promise<void> {
  const firstName = opts.prContactName.split(" ")[0];
  const body = `
    <h1>Think bigger, ${firstName}.</h1>
    <p>
      One shoppable video is just the beginning. The world's fastest-growing brands are building
      entire creator ecosystems — and Materialized is the infrastructure that powers them.
    </p>
    <p>
      With a <strong>${opts.brandName} Brand subscription</strong>, your team gets:
    </p>
    <div class="video-box">
      <p>✅ <strong>Unlimited shoppable video campaigns</strong> across any creator, any region</p>
      <p>✅ <strong>Real-time ROI dashboard</strong> — revenue, clicks, commissions, by creator</p>
      <p>✅ <strong>Affiliate management</strong> — invite, manage, and pay creators automatically</p>
      <p>✅ <strong>Global product catalogue</strong> — sync your inventory once, sell everywhere</p>
      <p>✅ <strong>Stripe Connect payouts</strong> — automated, compliant, instant</p>
    </div>
    <p>
      Whether you're activating 5 creators or 5,000, Materialized scales with you — from one
      market to every market your brand serves.
    </p>
    <div class="cta-wrap">
      <a href="${opts.subscribeUrl}" class="cta">Scale ${opts.brandName} Globally</a>
    </div>
    <p class="note">
      Book a 20-minute demo with our team and we'll show you exactly what a full creator programme
      looks like for ${opts.brandName}. Reply to this email to arrange a time.
    </p>
  `;
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: opts.prContactEmail,
    subject: `${opts.brandName} × Materialized — let's build your global creator programme`,
    html: baseTemplate(body),
  });
}

export async function sendSubscriptionNudgeEmail(opts: {
  prContactName: string;
  prContactEmail: string;
  brandName: string;
  subscribeUrl: string;
}): Promise<void> {
  const firstName = opts.prContactName.split(" ")[0];
  const body = `
    <h1>Ready to unlock everything, ${firstName}?</h1>
    <p>
      Your shoppable video is live — and your brand's products are already being discovered by
      new audiences through Materialized. Now it's time to take full control.
    </p>
    <p>
      A <strong>${opts.brandName} Brand subscription</strong> gives you the complete Materialized
      dashboard: campaign management, product analytics, affiliate recruitment, and one-click
      payouts — all in one place.
    </p>
    <div class="cta-wrap">
      <a href="${opts.subscribeUrl}" class="cta">Subscribe &amp; Unlock Your Dashboard</a>
    </div>
    <p>
      Our team can walk you through everything in under 20 minutes. Just reply and we'll set it up.
    </p>
    <p class="note">Your first 14 days are on us. No credit card required to start.</p>
  `;
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: opts.prContactEmail,
    subject: `Unlock your full Brand dashboard — ${opts.brandName} × Materialized`,
    html: baseTemplate(body),
  });
}

export async function sendContactEnquiryEmail(opts: {
  firstName: string;
  surname: string;
  email: string;
  role: string;
  igHandle: string;
  message: string;
}): Promise<void> {
  const roleLabel = opts.role === "creator" ? "Creator" : opts.role === "brand" ? "Brand" : "Publisher";
  const body = `
    <h1>New Contact Enquiry</h1>
    <div class="video-box">
      <p><strong>Name:</strong> ${opts.firstName} ${opts.surname}</p>
      <p><strong>Email:</strong> <a href="mailto:${opts.email}">${opts.email}</a></p>
      <p><strong>Role:</strong> ${roleLabel}</p>
      <p><strong>Instagram:</strong> @${opts.igHandle.replace(/^@/, "")}</p>
    </div>
    <p><strong>Message:</strong></p>
    <p style="background:#f9f9f9;border-left:3px solid #677A67;padding:12px 16px;border-radius:6px;font-style:italic;color:#444;">${opts.message}</p>
    <p style="font-size:12px;color:#aaa;">Submitted via the Materialized website contact form.</p>
  `;
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: "missbethanieashton@gmail.com",
    replyTo: opts.email,
    subject: `[Materialized] New ${roleLabel} Enquiry — ${opts.firstName} ${opts.surname}`,
    html: baseTemplate(body),
  });
}

export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}
