import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import * as QRCode from "qrcode";
import {
  ArrowDownRight, ArrowRight, Check, Copy, Instagram, LoaderCircle,
  Pause, Play, Share2, Volume2, VolumeX, X,
} from "lucide-react";
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
const VIDEO_SRC = "/miro-misljen-black-dress.mp4";
const inviteUrl = () => new URL("/paris-creator-week", window.location.origin).href;

function CashPrizeAmount({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [amount, setAmount] = useState(2000);
  useEffect(() => {
    if (paused) { setAmount(2000); return; }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1300, 1);
        setAmount(Math.round(2000 * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: .5 });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [paused]);
  return <strong ref={ref} aria-label="€2,000">€{amount.toLocaleString("en-GB")}</strong>;
}

export default function ParisCreatorWeek() {
  const claimRequestId = useRef(crypto.randomUUID());
  const videoRef = useRef<HTMLVideoElement>(null);
  const [values, setValues] = useState({
    fullName: "", email: "", platform: "instagram" as Platform, creatorHandle: "", friendHandle: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(30);
  const [muted, setMuted] = useState(true);
  const [motionPaused, setMotionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    document.title = `${INVITE_TITLE} | MTRLZD`;
    QRCode.toDataURL(inviteUrl(), {
      width: 176, margin: 4,
      color: { dark: "#d9e3ff", light: "#111525" },
      errorCorrectionLevel: "M",
    }).then(setQrData).catch(() => setShareMessage("QR code unavailable. Use Share or copy the invitation link."));
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if ((reducedMotion || motionPaused) && videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, [reducedMotion, motionPaused]);

  useEffect(() => {
    const firstInvalid = document.querySelector<HTMLInputElement>(".pcw input[aria-invalid='true']");
    firstInvalid?.focus();
  }, [fieldErrors]);

  const updateValue = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field as ClaimFields]) setFieldErrors((current) => ({ ...current, [field]: undefined }));
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
        setRequestError(response.status === 409
          ? body?.error || "A pass has already been claimed with these details. Check your email or try another address."
          : body?.error || "We couldn't reserve your passes. Check the details and try again.");
        return;
      }
      if (!body.creatorCode || !body.friendCode || !body.expiresAt) {
        setRequestError("Your claim could not be confirmed. Please try again.");
        return;
      }
      setClaim({
        creatorCode: String(body.creatorCode),
        friendCode: String(body.friendCode),
        expiresAt: String(body.expiresAt),
        emailStatus: body.emailStatus,
      });
      requestAnimationFrame(() => document.getElementById("passes")?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "center" }));
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
        setShareMessage("Invitation shared.");
        return;
      } catch {
        // Dismissal or unavailable native share falls through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareMessage("Invitation link copied.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setShareMessage(`Copy this invitation link: ${url}`);
    }
  };

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else { video.pause(); setPlaying(false); }
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };
  const tiltCard = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || motionPaused || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const rx = ((event.clientY - bounds.top) / bounds.height - .5) * -8;
    const ry = ((event.clientX - bounds.left) / bounds.width - .5) * 9;
    event.currentTarget.style.setProperty("--tilt-x", `${rx}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${ry}deg`);
  };
  const resetTilt = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };
  const formatExpiry = (dateString: string) => {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? dateString
      : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };
  const inputClass = (name: ClaimFields) => `pcw-input${fieldErrors[name] ? " has-error" : ""}`;
  const ambientPaused = motionPaused || reducedMotion;

  return (
    <main className={`pcw${ambientPaused ? " motion-paused" : ""}`}>
      <div className="pcw-grain" aria-hidden="true" />
      <header className="pcw-header">
        <a className="pcw-brand" href="#top" aria-label="Paris Creator Week — campaign top">
          <img src="/paris-creator-week-logo.png" alt="Paris Creator Week 2026" />
        </a>
        <a className="pcw-mtrlzd" href="/" aria-label="MTRLZD home"><img src="/mtrlzd-wordmark.png" alt="MTRLZD" /></a>
        <div className="pcw-header-right">
          <button className="pcw-motion-toggle" type="button" onClick={() => setMotionPaused((value) => !value)} aria-pressed={motionPaused} aria-label={motionPaused ? "Resume animations" : "Pause animations"}>
            {motionPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button className="pcw-share-button" type="button" onClick={shareInvite} aria-label="Share invitation">
            {copied ? <Check size={17} /> : <Share2 size={17} />}
          </button>
          <a className="pcw-header-cta" href="#claim">Get your voucher <ArrowRight size={15} /></a>
        </div>
      </header>

      <section className="pcw-hero" id="top" aria-labelledby="pcw-title">
        <div className="pcw-hero-atmosphere" aria-hidden="true" />
        <div className="pcw-hero-content">
          <p className="pcw-eyebrow"><span /> CREATOR SUMMIT ACTIVATION <b>×</b> PARIS</p>
          <h1 id="pcw-title"><span>YOUR CONTENT.</span><span className="chromatic">YOUR COMMERCE.</span><span>YOUR CUT.</span></h1>
          <p className="pcw-hero-deck">Turn videos into shoppable experiences.<br />Keep your brand partnerships.<br />Unlock an extra 5% MTRLZD affiliate commission.</p>
          <div className="pcw-hero-actions">
            <a className="pcw-button pcw-button-primary" href="#claim">Claim my creator pass <ArrowDownRight size={16} /></a>
            <button className="pcw-button pcw-button-ghost" type="button" onClick={toggleVideo} aria-label={playing ? "Pause video demo" : "Play video demo"}>
              {playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />} {playing ? "Pause the demo" : "Watch the video demo"}
            </button>
          </div>
        </div>

        <div className="pcw-demo-stage">
          <div className="pcw-demo-frame">
            <video ref={videoRef} className="pcw-demo-video" poster="/paris-commerce-demo-poster.webp" playsInline muted loop preload="metadata"
              autoPlay={!reducedMotion} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
              onTimeUpdate={event => setVideoTime(event.currentTarget.currentTime)}
              onLoadedMetadata={event => setVideoDuration(event.currentTarget.duration)}
              aria-label="MTRLZD interactive fashion video demo featuring a model in a black dress">
              <source src="/paris-commerce-demo.webm" type="video/webm" />
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
            <div className="pcw-demo-shade" />
            <span className="pcw-demo-live"><i /> VIDEO COMMERCE DEMO</span>
            <div className={`pcw-hotspot${productOpen ? " is-open" : ""}`}>
              <button className="pcw-hotspot-trigger" type="button" onClick={() => setProductOpen((open) => !open)} aria-expanded={productOpen} aria-label="Show Miro Misljen Little Black Dress product details">
                <span className="pcw-hotspot-pulse" />
              </button>
              <span className="pcw-hotspot-card"><b>MIRO MISLJEN</b><strong>Little Black Dress</strong><small>€790</small><a href="https://www.etsy.com/listing/4454443883/one-shoulder-black-dress-one-size-34-to?ref=shop_home_active_14&amp;frs=1&amp;logging_key=b2c6b649fb5b9c4ad8cea5cc9f68f260b736d7a4%3A4454443883" target="_blank" rel="noopener noreferrer">View the look <ArrowRight size={11} /></a></span>
            </div>
            <div className="pcw-demo-timeline">
              <input type="range" aria-label="Seek video demo" min={0} max={videoDuration || 30} step={.1} value={videoTime}
                onChange={event => { if (videoRef.current) videoRef.current.currentTime = Number(event.target.value); setVideoTime(Number(event.target.value)); }} />
            </div>
            <div className="pcw-video-controls">
              <button type="button" onClick={toggleVideo} aria-label={playing ? "Pause video" : "Play video"}>{playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}</button>
              <span>INTERACTIVE VIDEO</span>
              <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            </div>
          </div>
          <div className="pcw-demo-rail" aria-label="Video commerce benefits">
            <div><span className="pcw-rail-icon"><Play size={17} /></span><b>VIDEO</b><small>Showcase your products</small></div>
            <div><span className="pcw-rail-icon"><ArrowRight size={17} /></span><b>SHOPPABLE STORIES</b><small>Tap into the moment</small></div>
            <div><span className="pcw-rail-icon"><Instagram size={17} /></span><b>CREATOR / BRAND / PUBLISHER</b><small>One video. More ways to earn.</small></div>
          </div>
        </div>
        <div className="pcw-hero-bottom"><span>PARIS CREATOR WEEK · 2026</span><a href="#summit">Explore the summit <ArrowDownRight size={14} /></a></div>
      </section>

      <section className="pcw-future" aria-label="The future of interactive entertainment">
        <h2>The Future: <span>Interactive Entertainment</span></h2>
      </section>

      <section className="pcw-invitation" aria-label="Creator Week invitation">
        <div className="pcw-invitation-head">
          <p className="pcw-required-line">Register at Paris Creator Week to get your unique voucher code.</p>
        </div>
        <div className="pcw-perks" aria-label="Included">
          <div className="pcw-perk">Creator Pass</div>
          <div className="pcw-perk">Friend Voucher</div>
          <div className="pcw-perk">Cash Prize Competition</div>
        </div>
      </section>

      <section className="pcw-interactive" id="summit" aria-labelledby="interactive-title">
        <div className="pcw-starfield" aria-hidden="true" />
        <div className="pcw-competition" aria-label="Most Engaged Interactive Video cash prize competition">
          <div className="pcw-competition-title">
            <p className="pcw-eyebrow">SUMMIT COMPETITION</p>
            <h2 id="interactive-title">MOST ENGAGED<br /><span>INTERACTIVE VIDEO</span></h2>
          </div>
          <div className="pcw-prize" onPointerMove={tiltCard} onPointerLeave={resetTilt}>
            <span className="pcw-prize-label">CASH PRIZE</span>
            <CashPrizeAmount paused={ambientPaused} />
          </div>
          <a className="pcw-competition-cta" href="#claim" aria-label="Register for the competition">Register <ArrowRight size={16} /></a>
        </div>
      </section>

      <section className="pcw-claim-section" id="claim" aria-labelledby="claim-title">
        <div className="pcw-claim-heading">
          <p className="pcw-eyebrow">PARIS CREATOR WEEK 2026</p>
          <h2 id="claim-title">YOUR SUMMIT <span>DROP</span></h2>
        </div>
        <div className="pcw-claim-layout">
          <form className="pcw-form" onSubmit={claimPasses} noValidate>
            <label className="pcw-field">
              <span className="sr-only">Creator name</span>
              <input required name="fullName" maxLength={100} className={inputClass("fullName")} autoComplete="name" placeholder="Creator name" value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} aria-invalid={!!fieldErrors.fullName} aria-describedby={fieldErrors.fullName ? "err-fullName" : undefined} />
              {fieldErrors.fullName && <small id="err-fullName" className="pcw-field-error">{fieldErrors.fullName}</small>}
            </label>
            <label className="pcw-field">
              <span className="sr-only">Email address</span>
              <input required name="email" maxLength={254} className={inputClass("email")} type="email" autoComplete="email" placeholder="Email address" value={values.email} onChange={(event) => updateValue("email", event.target.value)} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "err-email" : undefined} />
              {fieldErrors.email && <small id="err-email" className="pcw-field-error">{fieldErrors.email}</small>}
            </label>
            <fieldset className="pcw-field pcw-platform-field">
              <legend className="sr-only">Primary platform</legend>
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
              <span className="sr-only">Your Instagram or TikTok handle</span>
              <div className={`pcw-handle-wrap${fieldErrors.creatorHandle ? " has-error" : ""}`}><b aria-hidden="true">@</b><input required name="creatorHandle" maxLength={30} autoComplete="off" aria-label="Your Instagram or TikTok handle" placeholder="Your Instagram / TikTok handle" value={values.creatorHandle.replace(/^@/, "")} onChange={(event) => updateValue("creatorHandle", event.target.value.replace(/^@+/, ""))} aria-invalid={!!fieldErrors.creatorHandle} aria-describedby={fieldErrors.creatorHandle ? "err-creatorHandle" : undefined} /></div>
              {fieldErrors.creatorHandle && <small id="err-creatorHandle" className="pcw-field-error">{fieldErrors.creatorHandle}</small>}
            </label>
            <label className="pcw-field">
              <span className="sr-only">Friend’s handle</span>
              <div className={`pcw-handle-wrap${fieldErrors.friendHandle ? " has-error" : ""}`}><b aria-hidden="true">@</b><input required name="friendHandle" maxLength={30} autoComplete="off" aria-label="Friend’s handle" placeholder="Friend’s handle" value={values.friendHandle.replace(/^@/, "")} onChange={(event) => updateValue("friendHandle", event.target.value.replace(/^@+/, ""))} aria-invalid={!!fieldErrors.friendHandle} aria-describedby={fieldErrors.friendHandle ? "err-friendHandle" : undefined} /></div>
              {fieldErrors.friendHandle && <small id="err-friendHandle" className="pcw-field-error">{fieldErrors.friendHandle}</small>}
            </label>
            {requestError && <div className="pcw-request-error" role="alert"><X size={16} /><span>{requestError}</span></div>}
            <button className="pcw-button pcw-submit" type="submit" disabled={busy}>
              {busy ? <><LoaderCircle className="pcw-spinner" size={17} /> Reserving your passes…</> : <>Get your voucher <ArrowRight size={17} /></>}
            </button>
            <p className="pcw-privacy">By submitting, you agree to receive information about your Paris Creator Week passes.</p>
          </form>

          <aside className={`pcw-pass-panel${claim ? " has-claim" : ""}`} id="passes" aria-live="polite">
            {claim ? (
              <>
                <div className="pcw-pass-panel-head"><div><span className="pcw-result-kicker"><Check size={14} /> CLAIM CONFIRMED</span><h3>Your passes are ready.</h3></div></div>
                <div className="pcw-pass-stack">
                  <PassCard label="CREATOR PASS" code={claim.creatorCode} index="01" onPointerMove={tiltCard} onPointerLeave={resetTilt} />
                  <PassCard label="FRIEND VOUCHER" code={claim.friendCode} index="02" onPointerMove={tiltCard} onPointerLeave={resetTilt} />
                </div>
                <p className="pcw-expiry">Activate both codes within <strong>14 days</strong>, by <strong>{formatExpiry(claim.expiresAt)}</strong>.</p>
                <div className={`pcw-email-status is-${claim.emailStatus}`} role="status">
                  {claim.emailStatus === "sent" ? <>Confirmation email sent. <strong>Save both codes now.</strong></>
                    : claim.emailStatus === "previously-issued" ? <>These codes were previously issued. <strong>Save both codes from this screen</strong>; no new email was sent.</>
                    : claim.emailStatus === "unavailable" ? <>Email delivery is unavailable. <strong>Save both codes from this screen</strong>; they will not be emailed.</>
                    : <>Confirmation email could not be sent. <strong>Save both codes from this screen</strong>; they will not be emailed.</>}
                </div>
              </>
            ) : (
              <>
                <div className="pcw-preview-heading"><span>YOUR TWO VOUCHERS</span><span>UNIQUE CODES AFTER CLAIM</span></div>
                <div className="pcw-preview-stack">
                  <PreviewPass label="CREATOR PASS" index="01" onPointerMove={tiltCard} onPointerLeave={resetTilt} />
                  <PreviewPass label="FRIEND VOUCHER" index="02" onPointerMove={tiltCard} onPointerLeave={resetTilt} />
                </div>
              </>
            )}
            <div className="pcw-share-area">
              {qrData && <img className="pcw-qr" src={qrData} alt="QR code for the Paris Creator Week invitation" width="72" height="72" />}
              <div className="pcw-share-tools">
                <button type="button" className="pcw-share-button" onClick={shareInvite} aria-label="Share invitation">{copied ? <Check size={16} /> : <Share2 size={16} />}</button>
                <button type="button" className="pcw-share-button" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteUrl());
                    setCopied(true); setShareMessage("Invitation link copied.");
                    window.setTimeout(() => setCopied(false), 2200);
                  } catch { setShareMessage(`Copy this invitation link: ${inviteUrl()}`); }
                }} aria-label="Copy invitation link">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
                {shareMessage && <span className="pcw-share-message" role="status">{shareMessage}</span>}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <footer className="pcw-footer">
        <a className="pcw-footer-brand" href="#top" aria-label="Paris Creator Week — campaign top"><img src="/paris-creator-week-logo.png" alt="Paris Creator Week 2026" /></a>
        <a href="/">MTRLZD <ArrowRight size={14} /></a>
        <small>© 2026 MTRLZD</small>
      </footer>
    </main>
  );
}

function PreviewPass({ label, index, onPointerMove, onPointerLeave }: {
  label: string; index: string;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
}) {
  return <article className={`pcw-voucher-card pcw-voucher-preview voucher-${index}`} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
    <div className="pcw-voucher-top"><span>MTRLZD <b>×</b> PCW 2026</span><span>PASS {index}</span></div>
    <div className="pcw-voucher-mid"><div><span className="pcw-voucher-label">{label}</span><h4>{index === "01" ? "Creator Pass" : "Friend Voucher"}</h4></div><span className="pcw-voucher-mark"><span>{index}</span></span></div>
    <div className="pcw-voucher-code"><span>UNIQUE VOUCHER CODE</span><strong>•••• •••• ••••</strong></div>
    <div className="pcw-voucher-notch pcw-notch-left" aria-hidden="true" /><div className="pcw-voucher-notch pcw-notch-right" aria-hidden="true" />
  </article>;
}

function PassCard({ label, code, index, onPointerMove, onPointerLeave }: {
  label: string; code: string; index: string;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
}) {
  return (
    <article className={`pcw-voucher-card voucher-${index}`} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div className="pcw-voucher-top"><span>MTRLZD <b>×</b> PCW 2026</span><span>PASS {index}</span></div>
      <div className="pcw-voucher-mid"><div><span className="pcw-voucher-label">{label}</span><h4>{index === "01" ? "Creator Pass" : "Friend Voucher"}</h4></div><span className="pcw-voucher-mark"><span>{index}</span></span></div>
      <div className="pcw-voucher-code"><span>YOUR UNIQUE VOUCHER CODE</span><strong>{code}</strong></div>
      <div className="pcw-voucher-bottom"><span>PARIS CREATOR WEEK · 2026</span><span>14-DAY WINDOW</span></div>
      <div className="pcw-voucher-notch pcw-notch-left" aria-hidden="true" /><div className="pcw-voucher-notch pcw-notch-right" aria-hidden="true" />
    </article>
  );
}
