import { useEffect, useRef, useState, type FormEvent } from "react";
import * as QRCode from "qrcode";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Copy,
  Instagram,
  Link2,
  LoaderCircle,
  Radio,
  Share2,
  Sparkles,
  Ticket,
  Users,
  Video,
  WalletCards,
  X,
} from "lucide-react";
import materializedLogo from "@assets/MTRLZD_Logo_white_transparent.png";
import "./paris-creator-week.css";

type Platform = "instagram" | "tiktok";
type ClaimResult = {
  creatorCode: string;
  friendCode: string;
  expiresAt: string;
  emailStatus: "sent" | "unavailable" | "failed" | "previously-issued";
};
type ClaimFields = "fullName" | "email" | "platform" | "creatorHandle" | "friendHandle";
type FieldErrors = Partial<Record<ClaimFields, string>>;

const INVITE_TITLE = "Paris Creator Week 2026";
const INVITE_TEXT = "Join me at Paris Creator Week 2026. Claim your creator pass here:";

function inviteUrl() {
  return new URL("/paris-creator-week", window.location.origin).href;
}

export default function ParisCreatorWeek() {
  const claimRequestId = useRef(crypto.randomUUID());
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    platform: "instagram" as Platform,
    creatorHandle: "",
    friendHandle: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = INVITE_TITLE + " | MTRLZD";
    QRCode.toDataURL(inviteUrl(), {
      width: 240, margin: 4,
      color: { dark: "#14121a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setQrData).catch(() => setShareMessage("QR code unavailable. Use Share or copy the invitation link."));
  }, []);

  useEffect(() => {
    const firstInvalid = document.querySelector<HTMLInputElement>(".pcw input[aria-invalid='true']");
    firstInvalid?.focus();
  }, [fieldErrors]);

  const updateValue = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field as ClaimFields]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
    setRequestError("");
  };

  const claimPasses = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setRequestError("");
    setShareMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/paris-creator-week/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: claimRequestId.current,
          ...values,
          creatorHandle: values.creatorHandle.replace(/^@+/, ""),
          friendHandle: values.friendHandle.replace(/^@+/, ""),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        const errors = body?.fieldErrors;
        if (errors && typeof errors === "object") {
          setFieldErrors(Object.fromEntries(Object.entries(errors).map(([key, value]) =>
            [key, Array.isArray(value) ? value.join(" ") : String(value)])) as FieldErrors);
        }
        setRequestError(
          response.status === 409
            ? body?.error || "A pass has already been claimed with these details. Check your email or try another address."
            : body?.error || "We couldn't reserve your passes. Check the details and try again.",
        );
        return;
      }
      if (!body.creatorCode || !body.friendCode || !body.expiresAt) {
        setRequestError("Your claim could not be confirmed. Please try again.");
        return;
      }
      const result = {
        creatorCode: String(body.creatorCode),
        friendCode: String(body.friendCode),
        expiresAt: String(body.expiresAt),
        emailStatus: body.emailStatus,
      };
      setClaim(result);
      requestAnimationFrame(() => document.getElementById("passes")?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } catch {
      setRequestError("We're having trouble connecting. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    const url = inviteUrl();
    setShareMessage("");
    if (navigator.share) {
      try {
        await navigator.share({ title: INVITE_TITLE, text: INVITE_TEXT, url });
        setShareMessage("Your invitation is ready to share.");
        return;
      } catch {
        // A dismissed native share sheet falls through to a readable copy option.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareMessage("Invite link copied. Send it to your friend.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setShareMessage(`Copy this link to invite your friend: ${url}`);
    }
  };

  const formatExpiry = (dateString: string) => {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime())
      ? dateString
      : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const inputClass = (name: ClaimFields) => `pcw-input${fieldErrors[name] ? " has-error" : ""}`;

  return (
    <main className="pcw">
      <div className="pcw-grain" aria-hidden="true" />
      <header className="pcw-header">
        <a className="pcw-brand" href="/" aria-label="MTRLZD home">
          <img src={materializedLogo} alt="MTRLZD" />
          <span className="pcw-brand-divider" />
          <span className="pcw-brand-event">PARIS<br />CREATOR WEEK</span>
        </a>
        <div className="pcw-header-right">
          <span className="pcw-edition"><i /> 2026 EDITION</span>
          <button className="pcw-share-button" type="button" onClick={shareInvite}><Share2 size={16} /> Share</button>
          <a className="pcw-header-cta" href="#claim">Claim your passes <ArrowRight size={15} /></a>
        </div>
      </header>

      <section className="pcw-hero" aria-labelledby="pcw-title">
        <div className="pcw-hero-content">
          <p className="pcw-eyebrow"><span>01</span> Paris Creator Week 2026</p>
          <h1 id="pcw-title">The Future: <br /><em>Interactive</em> <br />Entertainment</h1>
          <p className="pcw-hero-deck">A meeting point for creators shaping how stories are seen, shared and experienced.</p>
          <div className="pcw-hero-actions">
            <a className="pcw-button pcw-button-primary" href="#claim">Get two free passes <ArrowDownRight size={17} /></a>
            <span className="pcw-no-cost"><span className="pcw-no-cost-mark">€</span> Two free Creator Passes</span>
          </div>
          <div className="pcw-hero-meta">
            <span><span className="pcw-meta-dot" /> PARIS · 2026</span>
            <span>CREATOR + FRIEND</span>
          </div>
        </div>

        <div className="pcw-hero-art" aria-label="Abstract luminous, layered event artwork">
          <div className="pcw-art-orbit pcw-orbit-one" />
          <div className="pcw-art-orbit pcw-orbit-two" />
          <div className="pcw-art-ring pcw-ring-one" />
          <div className="pcw-art-ring pcw-ring-two" />
          <div className="pcw-art-core"><span>M</span></div>
          <div className="pcw-art-ray pcw-ray-a" />
          <div className="pcw-art-ray pcw-ray-b" />
          <div className="pcw-art-caption"><span>MAKE IT<br />INTERACTIVE</span><span>48°51' N<br />02°21' E</span></div>
          <div className="pcw-art-index">PCW—26 <span aria-hidden="true" /> 001</div>
        </div>
        <div className="pcw-hero-bottom"><span>SCROLL TO DISCOVER</span><span className="pcw-scroll-line" /></div>
      </section>

      <section className="pcw-public-share" aria-labelledby="pcw-share-title">
        <div>
          <p className="pcw-eyebrow">SHARE THE INVITATION</p>
          <h2 id="pcw-share-title">Meet you in Paris.</h2>
          <p>Share this page or let a friend scan the code. On supported Apple devices, the system share sheet may offer AirDrop.</p>
          <button className="pcw-button pcw-button-primary" type="button" onClick={shareInvite}><Share2 size={18} /> {copied ? "Link copied" : "Share Paris Creator Week"}</button>
          <p className="pcw-share-message" role="status">{shareMessage}</p>
          <a className="pcw-share-link" href={inviteUrl()}>{inviteUrl()}</a>
        </div>
        {qrData && <img src={qrData} alt="Scan to open the Paris Creator Week campaign" width="200" height="200" />}
      </section>

      <section className="pcw-invitation" aria-label="Your invitation">
        <div className="pcw-invitation-label"><span className="pcw-label-line" /> YOUR INVITATION</div>
        <div className="pcw-invitation-main">
          <h2>Bring your<br /><span>creative co-pilot.</span></h2>
          <div className="pcw-invitation-copy">
            <p>One pass for you. One for a friend who gets what you’re making.</p>
            <p className="pcw-required-line">Register at Paris Creator Week to get your unique voucher code.</p>
          </div>
        </div>
        <div className="pcw-perks" aria-label="Pass benefits">
          <div className="pcw-perk"><span className="pcw-perk-icon"><Ticket size={18} /></span><span>Creator Pass</span><span className="pcw-perk-arrow">↗</span></div>
          <div className="pcw-perk"><span className="pcw-perk-icon"><Users size={18} /></span><span>Friend Voucher</span><span className="pcw-perk-arrow">↗</span></div>
          <div className="pcw-perk"><span className="pcw-perk-icon"><WalletCards size={18} /></span><span>Cash Prize Competition</span><span className="pcw-perk-arrow">↗</span></div>
        </div>
      </section>

      <section className="pcw-interactive" aria-labelledby="interactive-title">
        <div className="pcw-starfield" aria-hidden="true" />
        <div className="pcw-interactive-top"><span>02 / THE FORMAT</span><span className="pcw-live-mark"><i /> MADE TO PARTICIPATE</span></div>
        <div className="pcw-interactive-body">
          <div className="pcw-interactive-title">
            <span className="pcw-outline-number">02</span>
            <h2 id="interactive-title">Most Engaged<br /><span>Interactive Video</span></h2>
          </div>
          <div className="pcw-prize">
            <div className="pcw-prize-label"><Sparkles size={15} /> CASH PRIZE COMPETITION</div>
            <p className="pcw-prize-amount">€2,000</p>
            <p className="pcw-prize-desc">A spotlight on the video that makes people stop, tap and take part.</p>
            <div className="pcw-prize-rule" />
            <div className="pcw-prize-footer"><Video size={16} /><span>Make something people can’t just scroll past.</span></div>
          </div>
        </div>
        <div className="pcw-interactive-bottom"><span>WATCH · TAP · ENGAGE</span><span>THE AUDIENCE IS PART OF THE STORY</span></div>
      </section>

      <section className="pcw-claim-section" id="claim" aria-labelledby="claim-title">
        <div className="pcw-claim-intro">
          <p className="pcw-eyebrow"><span>03</span> Your place is one form away</p>
          <h2 id="claim-title">Two passes.<br /><em>One good idea.</em></h2>
          <p>Tell us where to send your creator pass and your friend’s voucher. Your unique codes appear here as soon as your claim is confirmed.</p>
          <div className="pcw-claim-note"><Radio size={16} /><span>Free creator access, reserved for you and one friend.</span></div>
        </div>
        <div className="pcw-claim-layout">
          <form className="pcw-form" onSubmit={claimPasses} noValidate>
            <div className="pcw-form-heading"><span>CLAIM YOUR INVITATION</span><span>ALL FIELDS REQUIRED</span></div>
            <label className="pcw-field">
              <span>Full name</span>
              <input required name="fullName" maxLength={100} className={inputClass("fullName")} autoComplete="name" placeholder="Your name" value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} aria-invalid={!!fieldErrors.fullName} aria-describedby={fieldErrors.fullName ? "err-fullName" : undefined} />
              {fieldErrors.fullName && <small id="err-fullName" className="pcw-field-error">{fieldErrors.fullName}</small>}
            </label>
            <label className="pcw-field">
              <span>Email address</span>
              <input required name="email" maxLength={254} className={inputClass("email")} type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={(event) => updateValue("email", event.target.value)} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "err-email" : undefined} />
              {fieldErrors.email && <small id="err-email" className="pcw-field-error">{fieldErrors.email}</small>}
            </label>
            <fieldset className="pcw-field pcw-platform-field">
              <legend>Primary platform</legend>
              <div className="pcw-platform-options">
                {(["instagram", "tiktok"] as const).map((platform) => (
                  <button key={platform} className={`pcw-platform-choice${values.platform === platform ? " is-selected" : ""}`} type="button" aria-pressed={values.platform === platform} onClick={() => updateValue("platform", platform)}>
                    {platform === "instagram" ? <Instagram size={16} aria-hidden="true" /> : <span className="pcw-tiktok-mark" aria-hidden="true">t</span>}
                    {platform === "instagram" ? "Instagram" : "TikTok"}
                    {values.platform === platform && <Check size={14} className="pcw-choice-check" />}
                  </button>
                ))}
              </div>
              {fieldErrors.platform && <small className="pcw-field-error">{fieldErrors.platform}</small>}
            </fieldset>
            <label className="pcw-field">
              <span>Your creator handle</span>
              <div className={`pcw-handle-wrap${fieldErrors.creatorHandle ? " has-error" : ""}`}><b aria-hidden="true">@</b><input required name="creatorHandle" maxLength={30} aria-label="Your creator handle" autoComplete="off" placeholder="yourhandle" value={values.creatorHandle.replace(/^@/, "")} onChange={(event) => updateValue("creatorHandle", event.target.value.replace(/^@+/, ""))} aria-invalid={!!fieldErrors.creatorHandle} aria-describedby={fieldErrors.creatorHandle ? "err-creatorHandle" : undefined} /></div>
              {fieldErrors.creatorHandle && <small id="err-creatorHandle" className="pcw-field-error">{fieldErrors.creatorHandle}</small>}
            </label>
            <label className="pcw-field">
              <span>Your friend’s handle</span>
              <div className={`pcw-handle-wrap${fieldErrors.friendHandle ? " has-error" : ""}`}><b aria-hidden="true">@</b><input required name="friendHandle" maxLength={30} aria-label="Your friend’s handle" autoComplete="off" placeholder="friendshandle" value={values.friendHandle.replace(/^@/, "")} onChange={(event) => updateValue("friendHandle", event.target.value.replace(/^@+/, ""))} aria-invalid={!!fieldErrors.friendHandle} aria-describedby={fieldErrors.friendHandle ? "err-friendHandle" : undefined} /></div>
              {fieldErrors.friendHandle && <small id="err-friendHandle" className="pcw-field-error">{fieldErrors.friendHandle}</small>}
            </label>
            {requestError && <div className="pcw-request-error" role="alert"><X size={16} /><span>{requestError}</span></div>}
            <button className="pcw-button pcw-submit" type="submit" disabled={busy}>
              {busy ? <><LoaderCircle className="pcw-spinner" size={17} /> Reserving your passes…</> : <>Claim both free passes <ArrowRight size={17} /></>}
            </button>
            <p className="pcw-privacy">By submitting, you agree to receive information about your Paris Creator Week passes.</p>
          </form>

          <aside className={`pcw-pass-panel${claim ? " has-claim" : ""}`} id="passes" aria-live="polite">
            {claim ? (
              <>
                <div className="pcw-pass-panel-head"><div><span className="pcw-result-kicker"><Check size={14} /> CLAIM CONFIRMED</span><h3>Your passes are ready.</h3></div><span className="pcw-pass-count">02 / 02</span></div>
                <div className="pcw-pass-stack">
                  <PassCard label="CREATOR PASS" code={claim.creatorCode} index="01" />
                  <PassCard label="FRIEND VOUCHER" code={claim.friendCode} index="02" />
                </div>
                <p className="pcw-expiry">Your passes have a <strong>14-day activation window</strong>. Activate both codes by <strong>{formatExpiry(claim.expiresAt)}</strong>.</p>
                <div className={`pcw-email-status is-${claim.emailStatus}`} role="status">
                  {claim.emailStatus === "sent" ? (
                    <>Confirmation email sent. <strong>Save both codes now</strong> so you have them ready.</>
                  ) : claim.emailStatus === "previously-issued" ? (
                    <>These codes were previously issued. <strong>Save both codes from this screen</strong>; no new email was sent.</>
                  ) : claim.emailStatus === "unavailable" ? (
                    <>Email delivery is unavailable. <strong>Save both codes from this screen</strong>; they will not be emailed.</>
                  ) : (
                    <>Confirmation email could not be sent. <strong>Save both codes from this screen</strong>; they will not be emailed.</>
                  )}
                </div>
                <div className="pcw-share-area">
                  <div className="pcw-qr-wrap">{qrData ? <img src={qrData} alt="QR code linking to the Paris Creator Week 2026 invitation" /> : <div className="pcw-qr-placeholder" aria-label="Preparing QR code" />}</div>
                  <div className="pcw-share-copy"><span>BRING YOUR FRIEND IN</span><p>Share the invite link. You can send it from your phone’s share sheet or copy the link to any app.</p><button type="button" className="pcw-share-button" onClick={shareInvite}>{copied ? <Check size={16} /> : <Share2 size={16} />}{copied ? "Copied" : "Share invitation"}</button></div>
                </div>
                {shareMessage && <p className="pcw-share-message" role="status">{shareMessage}</p>}
                <button className="pcw-copy-url" type="button" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteUrl());
                    setCopied(true);
                    setShareMessage("Invite link copied. Send it to your friend.");
                    window.setTimeout(() => setCopied(false), 2200);
                  } catch {
                    setShareMessage(`Copy this link to invite your friend: ${inviteUrl()}`);
                  }
                }}><Link2 size={14} /><code>{inviteUrl()}</code><Copy size={13} /></button>
              </>
            ) : (
              <>
                <div className="pcw-pass-panel-head"><div><span className="pcw-result-kicker"><Ticket size={14} /> THE INVITATION</span><h3>Two ways in.</h3></div><span className="pcw-pass-count">01 + 01</span></div>
                <p className="pcw-panel-copy">One registration reserves both passes. Your codes are generated only after the claim is accepted.</p>
                <div className="pcw-preview-pass pcw-preview-creator">
                  <span className="pcw-preview-index">01 / FOR YOU</span><span className="pcw-preview-glyph"><Ticket size={23} /></span><strong>Creator<br />Pass</strong><span className="pcw-preview-bottom">UNIQUE CODE AFTER CLAIM <span>↗</span></span>
                </div>
                <div className="pcw-preview-pass pcw-preview-friend">
                  <span className="pcw-preview-index">02 / BRING ONE</span><span className="pcw-preview-glyph"><Users size={23} /></span><strong>Friend<br />Voucher</strong><span className="pcw-preview-bottom">UNIQUE CODE AFTER CLAIM <span>↗</span></span>
                </div>
                <div className="pcw-panel-foot"><span className="pcw-panel-pulse" /> No payment details. No purchase required.</div>
              </>
            )}
          </aside>
        </div>
      </section>

      <footer className="pcw-footer">
        <a className="pcw-footer-brand" href="/" aria-label="MTRLZD home"><img src={materializedLogo} alt="MTRLZD" /></a>
        <span>AN OPEN INVITATION TO WHAT’S NEXT.</span>
        <a href="#claim">Get your passes <ArrowRight size={14} /></a>
        <small>© 2026 MTRLZD</small>
      </footer>
    </main>
  );
}

function PassCard({ label, code, index }: { label: string; code: string; index: string }) {
  return (
    <article className={`pcw-voucher-card ${index === "01" ? "voucher-creator" : "voucher-friend"}`}>
      <div className="pcw-voucher-top"><span>MTRLZD <b>×</b> PCW 2026</span><span>PASS {index}</span></div>
      <div className="pcw-voucher-mid"><div><span className="pcw-voucher-label">{label}</span><h4>{index === "01" ? "Creator" : "Friend"}<br />access.</h4></div><div className="pcw-voucher-mark"><Ticket size={22} /></div></div>
      <div className="pcw-voucher-code"><span>YOUR UNIQUE VOUCHER CODE</span><strong>{code}</strong></div>
      <div className="pcw-voucher-bottom"><span>PARIS CREATOR WEEK · 2026</span><span>FREE ACCESS <ArrowRight size={13} /></span></div>
      <div className="pcw-voucher-notch pcw-notch-left" aria-hidden="true" /><div className="pcw-voucher-notch pcw-notch-right" aria-hidden="true" />
    </article>
  );
}
