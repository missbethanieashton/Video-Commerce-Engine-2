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
  brandName: string;
  videoTitle: string;
  videoPreviewUrl: string;
  authorizeUrl: string;
  creatorMessage?: string;
}): Promise<void> {
  const firstName = opts.prContactName.split(" ")[0];

  const body = `
    <h1>Hey ${firstName},</h1>
    <p>
      <strong>${opts.creatorDisplayName}</strong> would like to make their latest video featuring
      <strong>${opts.brandName}</strong> products shoppable using Materialized — turning it into
      a fully interactive, commission-tracked experience your customers can shop directly from.
    </p>
    ${opts.creatorMessage ? `<p style="font-style:italic;border-left:3px solid #677A67;padding-left:14px;color:#444;">"${opts.creatorMessage}"</p>` : ""}
    <div class="video-box">
      <p><strong>📹 ${opts.videoTitle || "Video Preview"}</strong></p>
      <p style="margin-top:8px;">You can <a href="${opts.videoPreviewUrl}">preview the video here →</a></p>
    </div>
    <p>
      Clicking the button below authorises ${opts.creatorDisplayName} to make this video shoppable
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

export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}
