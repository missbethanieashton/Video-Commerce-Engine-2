import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Tag } from "lucide-react";

export type PricingTier = "creator" | "brand" | "publisher";

interface PricingModalProps {
  open: boolean;
  initialTier?: PricingTier | null;
  onClose: () => void;
  onSubscribe: (tier: PricingTier) => void;
  onVoucher: (tier: PricingTier, code: string) => void;
}

const TIERS = [
  {
    id: "creator" as PricingTier,
    title: "Creator",
    icon: "🎬",
    price: 149,
    accentColor: "#1351aa",
    bgActive: "rgba(19,81,170,0.22)",
    glowColor: "rgba(19,81,170,0.4)",
    borderColor: "rgba(19,81,170,0.65)",
    benefits: [
      "Upload and monetize 8 videos per month",
      "Tag brands for unlimited credits per month",
      "Publish shoppable videos to Substack, website, ecommerce",
      "Engage your audience through interactive storytelling",
      "Integrates with your existing Affiliate Commission partnerships with your brand partners",
      "Expand your audience by getting reposted on major websites",
      "Content discovery and reposts from Global Video Library",
    ],
  },
  {
    id: "brand" as PricingTier,
    title: "Brand",
    icon: "🛍️",
    price: 249,
    accentColor: "#6dbf7e",
    bgActive: "rgba(49,77,59,0.28)",
    glowColor: "rgba(109,191,126,0.35)",
    borderColor: "rgba(109,191,126,0.65)",
    benefits: [
      "Upload and monetize 4 campaigns per month",
      "Sync your inventory via API quickly & seamlessly",
      "Invite 10 of your top influencers (free account vouchers)",
      "Curate a playlist of UGC and Influencer campaigns for your ecommerce (up to 40 shopified videos per month)",
      "Engage your customers through interactive storytelling",
      "Customer acquisition and lead generation on your eCommerce",
      "Marketplace fee (15%)",
      "Integrate your existing Influencers and Affiliate program",
      "Dashboard and Analytics from Affiliate network and reposts",
      "Product and Content discovery from Global Video Library and Marketplace",
    ],
  },
  {
    id: "publisher" as PricingTier,
    title: "Publisher",
    icon: "📡",
    price: 499,
    accentColor: "#c8a54a",
    bgActive: "rgba(60,45,10,0.28)",
    glowColor: "rgba(200,165,74,0.35)",
    borderColor: "rgba(200,165,74,0.65)",
    benefits: [
      "Curate up to 4 playlists per month, for each page on your media platform",
      "Play up to 10 short films or campaigns per playlist (40 videos hosted per month)",
      "Cookie policy 30 days",
      "Filter quality artistic, curated and cultural content from the Global Video Library based on your audience niche",
      "Generate new revenues simply from reposting content",
      "Earn up to 3% gross sales from audience conversions",
    ],
  },
];

export function PricingModal({ open, initialTier, onClose, onSubscribe, onVoucher }: PricingModalProps) {
  const [voucherTier, setVoucherTier] = useState<PricingTier | null>(null);
  const [voucherCode, setVoucherCode] = useState("");

  const handleApplyVoucher = (tierId: PricingTier) => {
    if (!voucherCode.trim()) return;
    onVoucher(tierId, voucherCode.trim());
    setVoucherCode("");
    setVoucherTier(null);
  };

  const toggleVoucher = (tierId: PricingTier) => {
    if (voucherTier === tierId) {
      setVoucherTier(null);
      setVoucherCode("");
    } else {
      setVoucherTier(tierId);
      setVoucherCode("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(2,4,16,0.93)", backdropFilter: "blur(18px)" }}
          />

          {/* Scroll container */}
          <div
            className="fixed inset-0 z-[61] overflow-y-auto"
            style={{ pointerEvents: "none" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="min-h-full flex items-start justify-center py-10 px-4"
              style={{ pointerEvents: "none" }}
            >
              <div style={{ pointerEvents: "auto", maxWidth: 1080, width: "100%" }}>

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2
                      className="text-3xl sm:text-4xl font-bold text-white"
                      style={{ fontFamily: "'Aileron', sans-serif", letterSpacing: "-0.02em" }}
                    >
                      Subscription Plans
                    </h2>
                    <p className="text-white/45 mt-1.5 text-sm">
                      All plans include a one-time €29 admin setup fee · Overage charges apply
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-1 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                    data-testid="button-close-pricing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tier cards */}
                <div className="grid md:grid-cols-3 gap-5">
                  {TIERS.map((tier, idx) => {
                    const isHighlighted = initialTier === tier.id;
                    const showVoucher = voucherTier === tier.id;
                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.07, type: "spring", stiffness: 260, damping: 24 }}
                        className="flex flex-col rounded-3xl p-7"
                        style={{
                          background: isHighlighted ? tier.bgActive : "rgba(255,255,255,0.055)",
                          border: `1.5px solid ${isHighlighted ? tier.borderColor : "rgba(255,255,255,0.11)"}`,
                          boxShadow: isHighlighted ? `0 8px 48px ${tier.glowColor}, 0 0 0 1px ${tier.borderColor}` : "none",
                        }}
                      >
                        {/* Icon + Title */}
                        <div className="mb-5">
                          <span className="text-2xl mb-2 block">{tier.icon}</span>
                          <div
                            className="text-xl font-bold text-white mb-3"
                            style={{ fontFamily: "'Aileron', sans-serif" }}
                          >
                            {tier.title}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white">€{tier.price}</span>
                            <span className="text-white/45 text-sm">/month</span>
                          </div>
                          <div className="text-white/35 text-xs mt-1.5 leading-snug">
                            + €29 one-time setup fee + overage
                          </div>
                        </div>

                        {/* Divider */}
                        <div
                          className="mb-5"
                          style={{ height: 1, background: "rgba(255,255,255,0.09)" }}
                        />

                        {/* Benefits list */}
                        <ul className="flex-1 space-y-3 mb-7">
                          {tier.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-white/75 leading-snug">
                              <Check
                                className="w-3.5 h-3.5 shrink-0 mt-[3px]"
                                style={{ color: tier.accentColor }}
                                strokeWidth={2.5}
                              />
                              {benefit}
                            </li>
                          ))}
                        </ul>

                        {/* Subscribe button */}
                        <motion.button
                          whileHover={{ scale: 1.03, boxShadow: `0 8px 32px ${tier.glowColor}` }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => onSubscribe(tier.id)}
                          className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm mb-3 transition-all"
                          style={{ background: tier.accentColor, border: "none" }}
                          data-testid={`button-subscribe-${tier.id}`}
                        >
                          Subscribe — €{tier.price}/mo
                        </motion.button>

                        {/* Enter Voucher */}
                        <AnimatePresence initial={false}>
                          {showVoucher ? (
                            <motion.div
                              key="voucher-open"
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={voucherCode}
                                  onChange={e => setVoucherCode(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && handleApplyVoucher(tier.id)}
                                  placeholder="Enter voucher code"
                                  autoFocus
                                  className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
                                  style={{
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.16)",
                                  }}
                                  data-testid={`input-voucher-${tier.id}`}
                                />
                                <button
                                  onClick={() => handleApplyVoucher(tier.id)}
                                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                                  style={{ background: tier.accentColor, flexShrink: 0 }}
                                  data-testid={`button-apply-voucher-${tier.id}`}
                                >
                                  Apply
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="voucher-closed"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => toggleVoucher(tier.id)}
                              className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-1.5 py-1"
                              data-testid={`button-enter-voucher-${tier.id}`}
                            >
                              <Tag className="w-3 h-3" />
                              Enter Voucher
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer note */}
                <p className="text-center text-white/20 text-xs mt-8 pb-4">
                  Secure payment via Stripe · Mastercard, Visa & more · Cancel anytime · VAT may apply
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
