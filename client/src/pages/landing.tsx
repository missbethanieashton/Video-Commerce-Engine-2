import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import starIcon from "@assets/Materialized_Star_icon_1773416195409.png";
import chromeBlobIcon from "@assets/2Iconography_Icons_1773417096477.png";
import bagCartImage from "@assets/bag_cart_1773417992382.png";
import celineBagImage from "@assets/celine_bag_1773420370038.png";
import { COUNTRIES } from "@shared/schema";
import { Play, ChevronDown, Users, DollarSign, TrendingUp, ShoppingBag, ArrowRight, Star, Smartphone, Monitor, Video, Volume2, VolumeX, CircleUserRound, X } from "lucide-react";
import { DemoPopup } from "@/components/DemoPopup";
import { SiInstagram, SiLinkedin } from "react-icons/si";
import discoveryPacksVideo from "@assets/Discovery_Packs_1767870108965.mp4";
import verticalDemoVideo from "@assets/Materialized_APP_Intro_Screen_1767873358319.mp4";
import materializedLogo from "@assets/MTRLZD_Logo_white_transparent.png";
import iphoneFrameTransparent from "@assets/iphone_frame_transparent.png";
import tabletFrameTransparent from "@assets/tablet_frame_transparent.png";
import chromeTabletFrame from "@/assets/chrome_tablet_frame_no_bg.png";
const mtrlzdVideoBanner = "/mtrlzd-video-banner.mp4";

const formSchema = z.object({
  role: z.enum(["creator", "brand", "publisher"]),
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  accessCode: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

const contactSchema = z.object({
  firstName: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["creator", "brand", "publisher"], { required_error: "Select a role" }),
  igHandle: z.string().min(1, "Required"),
  message: z.string().min(1, "Required").max(200, "Max 200 characters"),
});
type ContactData = z.infer<typeof contactSchema>;

function ContactForm() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const form = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { firstName: "", surname: "", email: "", role: undefined, igHandle: "", message: "" },
  });
  const msg = form.watch("message") ?? "";

  const mutation = useMutation({
    mutationFn: (data: ContactData) => apiRequest("POST", "/api/contact", data),
    onSuccess: () => {
      setSent(true);
      form.reset();
    },
    onError: () => toast({ title: "Couldn't send", description: "Please try again shortly.", variant: "destructive" }),
  });

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-[#1351aa] font-semibold text-sm">Message sent!</p>
        <p className="text-white/50 text-xs mt-1">We'll be in touch soon.</p>
        <button onClick={() => setSent(false)} className="mt-3 text-xs text-white/40 underline">Send another</button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-2">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormControl>
                <input {...field} data-testid="input-contact-firstName" placeholder="First Name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1351aa] transition-colors" />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )} />
          <FormField control={form.control} name="surname" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormControl>
                <input {...field} data-testid="input-contact-surname" placeholder="Surname"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1351aa] transition-colors" />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )} />
        </div>

        {/* Email */}
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormControl>
              <input {...field} type="email" data-testid="input-contact-email" placeholder="Your Email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1351aa] transition-colors" />
            </FormControl>
            <FormMessage className="text-xs text-red-400" />
          </FormItem>
        )} />

        {/* Role radio */}
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-white/60 text-xs">I am a *</FormLabel>
            <div className="flex gap-2">
              {(["creator", "brand", "publisher"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => field.onChange(r)}
                  data-testid={`radio-role-${r}`}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                    field.value === r
                      ? "border-[#1351aa] bg-[#1351aa]/20 text-[#6b8fd6]"
                      : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
                  }`}
                >
                  {r === "creator" ? "Creator" : r === "brand" ? "Brand" : "Publisher"}
                </button>
              ))}
            </div>
            <FormMessage className="text-xs text-red-400" />
          </FormItem>
        )} />

        {/* IG handle */}
        <FormField control={form.control} name="igHandle" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormControl>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden focus-within:border-[#1351aa] transition-colors">
                <span className="px-3 text-white/30 text-sm select-none">@</span>
                <input {...field} data-testid="input-contact-igHandle" placeholder="Instagram Handle"
                  className="flex-1 bg-transparent py-2 pr-3 text-white text-sm placeholder:text-white/30 focus:outline-none"
                  onChange={e => field.onChange(e.target.value.replace(/^@/, ""))} />
              </div>
            </FormControl>
            <FormMessage className="text-xs text-red-400" />
          </FormItem>
        )} />

        {/* Message */}
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem className="space-y-1">
            <div className="flex items-center justify-between">
              <FormLabel className="sr-only">Message</FormLabel>
              <span className={`text-xs ${msg.length > 190 ? "text-amber-400" : "text-white/30"}`}>{msg.length}/200</span>
            </div>
            <FormControl>
              <textarea {...field} data-testid="textarea-contact-message" rows={3} maxLength={200}
                placeholder="Message"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1351aa] transition-colors resize-none" />
            </FormControl>
            <FormMessage className="text-xs text-red-400" />
          </FormItem>
        )} />

        <button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-contact-submit"
          className="w-full py-2.5 rounded-full bg-[#314d3b] text-white font-semibold text-sm hover:bg-[#24372b] transition-colors disabled:opacity-50 mt-1"
        >
          {mutation.isPending ? "Sending..." : "Connect"}
        </button>
      </form>
    </Form>
  );
}

const TYPEWRITER_PHRASES = [
  "Turn videos into revenue",
  "Connect with brands",
  "Build your affiliate empire",
  "Monetize your content",
];

function TypewriterText() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseDuration = 2000;

    if (!isDeleting && charIndex === currentPhrase.length) {
      setTimeout(() => setIsDeleting(true), pauseDuration);
      return;
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCharIndex((prev) => (isDeleting ? prev - 1 : prev + 1));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

  return (
    <span className="inline-block min-w-[280px] text-left text-[32px]">
      {TYPEWRITER_PHRASES[phraseIndex].slice(0, charIndex)}
      <span className="animate-pulse">|</span>
    </span>
  );
}

const STATS = [
  { icon: Users, value: "50K+", label: "Active Creators", color: "text-[#1351aa]" },
  { icon: DollarSign, value: "$12M", label: "Creator Earnings", color: "text-[#1351aa]" },
  { icon: TrendingUp, value: "340%", label: "Avg. ROI Increase", color: "text-[#43484D]" },
  { icon: ShoppingBag, value: "2.1M", label: "Products Tagged", color: "text-[#1351aa]" },
];

const TESTIMONIALS = [
  {
    quote: "Most Innovative Tech",
    author: "",
    role: "",
    company: "Forbes",
  },
  {
    quote: "Top 100 Fast Moving Companies",
    author: "",
    role: "",
    company: "Fast Company",
  },
  {
    quote: "Touch Technology Tells Brands Exactly What Consumers WANT To Shop",
    author: "",
    role: "",
    company: "Fashionista",
  },
];

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
  const prefix = value.replace(/[0-9.]/g, "").replace(suffix, "");
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [inView, numericValue]);

  return (
    <span ref={ref}>
      {prefix}{count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K` : Math.round(count)}{suffix.includes("+") ? "+" : suffix.includes("%") ? "%" : suffix.includes("M") ? "M" : ""}
    </span>
  );
}

function StatsSection() {
  return (
    <section className="relative px-4 bg-[#33415c]" style={{ paddingTop: "100px", paddingBottom: "40px" }}>
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-6 text-white"
        >
          Video Commerce
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="md:text-xl text-white/80 max-w-2xl mx-auto text-[16px] not-italic"
        >
          <em className="italic">Shoppable video technology</em> has existed for more than a decade. Materialized has built an affiliate eco-system that rewards reposts, where content provides multi-layered revenues and impact
        </motion.p>
      </div>

    </section>
  );
}

function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pt-4 pb-10 px-4 bg-[#33415c]">
      <div className="max-w-4xl mx-auto">
        <div className="relative min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
                <defs>
                  <linearGradient id="chrome-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                    <stop offset="30%" stopColor="#c0c0c0" stopOpacity={0.85} />
                    <stop offset="60%" stopColor="#888888" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#d4d4d4" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <text x="0" y="36" fontSize="56" fontFamily="Georgia, serif" fill="url(#chrome-grad)">&ldquo;</text>
              </svg>
              <p className="text-lg md:text-xl text-white/90 mb-3 italic leading-relaxed">
                {TESTIMONIALS[activeIndex].quote}
              </p>
              <div className="font-semibold mt-2 font-accent text-[#001233] text-[22px]">
                <span className="mr-2 text-[#001233]">|</span>{TESTIMONIALS[activeIndex].company}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-1.5 mt-5" role="tablist" aria-label="Testimonial navigation">
          {TESTIMONIALS.map((testimonial, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-[2px] rounded-full transition-all ${
                index === activeIndex ? "bg-[#1351aa] w-6" : "bg-white/20 w-4"
              }`}
              data-testid={`button-testimonial-${index}`}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View testimonial from ${testimonial.author}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoOrientationSection() {
  return (
    <section className="py-20 px-4 bg-[#00000094]">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:text-4xl font-bold text-center mb-8 text-white text-[24px] px-[10px]"
        >
          One Platform,<br />
          <span style={{ color: "transparent", WebkitTextStroke: "1.5px white" }}>Every Format</span>
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Upload your Reels or Film Series for dynamic product carousels on all content formats
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center gap-0">
              <div
                className="relative w-[220px] md:w-[260px]"
                style={{ aspectRatio: "1024 / 1536" }}
              >
                {/* Screen area — inset to match the frame's cutout, clipped edge-to-edge */}
                <div
                  className="absolute overflow-hidden z-0"
                  style={{ top: "2.6%", bottom: "3.3%", left: "21.5%", right: "16.6%", borderRadius: "30px" }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    aria-label="Vertical video demo"
                  >
                    <source src={verticalDemoVideo} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Bag product carousel — bottom of screen */}
                  <div className="absolute left-2 right-2 z-10" style={{ bottom: 5 }}>
                    <div className="bg-black/40 backdrop-blur-md rounded-lg px-2 py-1.5 border border-white/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-md bg-white/10 flex-shrink-0 overflow-hidden">
                          <img src={bagCartImage} alt="Metallic Chain Handbag" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white/70 text-[7px] leading-tight truncate">Metallic Chain Bag</div>
                          <div className="text-white font-bold text-[10px] leading-tight">€720</div>
                        </div>
                        <button className="bg-white/90 text-[#43484D] text-[6.5px] font-black tracking-wide px-1.5 py-1 rounded flex-shrink-0">
                          BUY NOW
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Transparent iPhone frame overlay */}
                <img
                  src={iphoneFrameTransparent}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full z-10 pointer-events-none select-none"
                  style={{ filter: "drop-shadow(0 25px 60px rgba(0,0,0,0.4)) drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}
                />
              </div>
              {/* Format label */}
              <div className="w-[220px] md:w-[260px] px-1 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold text-sm">Vertical</div>
                  <div className="text-white/60 text-xs">9:16</div>
                </div>
                <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase">REELS</div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            {/* iPad landscape frame */}
            <div className="flex flex-col items-center gap-0 w-full max-w-[560px]">
              <div className="relative w-full" style={{ aspectRatio: "1536 / 1024" }}>
                {/* Screen area — inset to match the frame's cutout, clipped edge-to-edge */}
                <div
                  className="absolute overflow-hidden z-0"
                  style={{ top: "6.0%", bottom: "5.4%", left: "5.3%", right: "4.2%", borderRadius: "30px" }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 60%" }}
                    aria-label="Jetski vessels video"
                  >
                    <source src="/vessels-jetski.mp4" type="video/mp4" />
                  </video>
                  {/* Subtle screen glare */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                  {/* Seasonal Leasing carousel card — bottom of screen */}
                  <div className="absolute left-3 right-3 z-10" style={{ bottom: 5 }}>
                    <div className="rounded-xl px-3 py-2 border border-white/15" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white/50 text-[8px] uppercase tracking-widest leading-tight">Lund Group</div>
                          <div className="text-white text-[11px] font-semibold leading-tight mt-0.5">Luxury Yacht Charters</div>
                        </div>
                        <a
                          href="https://www.lund-group.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white/10 hover:bg-white/20 text-white text-[8px] font-black tracking-wider px-3 py-1.5 rounded-lg flex-shrink-0 border border-white/20 transition-colors whitespace-nowrap"
                        >
                          SEASONAL LEASING
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Transparent tablet frame overlay */}
                <img
                  src={tabletFrameTransparent}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full z-10 pointer-events-none select-none"
                  style={{ filter: "drop-shadow(0 30px 70px rgba(0,0,0,0.45)) drop-shadow(0 10px 25px rgba(0,0,0,0.3))" }}
                />
              </div>
              {/* Format label */}
              <div className="w-full px-1 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold text-sm">Horizontal</div>
                  <div className="text-white/60 text-xs">16:9</div>
                </div>
                <div className="text-white/50 text-[10px] font-bold tracking-widest uppercase">YOUTUBE</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ParallaxImageSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <section ref={ref} className="relative h-[64vh] overflow-hidden">
      {/* Parallax video layer */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-[140%] -top-[20%]"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          aria-label="Materialized video banner"
        >
          <source src={mtrlzdVideoBanner} type="video/mp4" />
        </video>
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#6b8fd6] text-xs font-semibold tracking-[0.25em] uppercase mb-4"
        >
          Shopifying Creator Content
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="text-white max-w-3xl text-center pl-[10px] pr-[10px] text-[24px]"
          style={{ fontFamily: "inherit" }}
        >
          Buy directly from{" "}
          <span
            className="inline-flex items-center overflow-hidden align-middle bg-[#6b8fd6]"
            style={{ borderRadius: 50, height: 44, width: 230, verticalAlign: "middle", position: "relative", top: -2 }}
          >
            <span
              className="pill-marquee-track font-accent text-[#ffffff]"
              style={{ fontStyle: "italic", fontSize: 18, whiteSpace: "nowrap", paddingLeft: 16 }}
            >
              creator content &nbsp;&nbsp;&nbsp;&nbsp; creator content &nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </span>
          , music videos, or film series
        </motion.p>
      </div>

    </section>
  );
}


const ROLE_ROUTES: Record<string, string> = {
  creator: "/creator",
  brand: "/brand",
  publisher: "/affiliate",
};

// ─── Event Voucher Section ───────────────────────────────────────────────────

const voucherSchema = z.object({
  firstName: z.string().min(1, "First name required").max(100),
  email: z.string().email("Valid email required"),
  linkedin: z.string().min(1, "LinkedIn URL required"),
  event: z.enum(["vivatech", "cannes"]),
});
type VoucherFormData = z.infer<typeof voucherSchema>;

const EVENT_CONFIG = {
  vivatech: {
    label: "VivaTech 2026",
    badge: "VivaTech",
    color: "#1351aa",
    codePrefix: "VIVA2026",
  },
  cannes: {
    label: "Cannes Lions 2026",
    badge: "Cannes Lions",
    color: "#c8962a",
    codePrefix: "LIONS2026",
  },
};

function EventVoucherSection() {
  const { toast } = useToast();
  const [activeEvent, setActiveEvent] = useState<"vivatech" | "cannes">("vivatech");
  const [claimed, setClaimed] = useState<boolean>(false);

  const form = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: { firstName: "", email: "", linkedin: "", event: "vivatech" },
  });

  const claimMutation = useMutation({
    mutationFn: (data: VoucherFormData) =>
      apiRequest("POST", "/api/event-voucher/claim", data).then((r) => r.json()),
    onSuccess: () => {
      setClaimed(true);
    },
    onError: async (err: any) => {
      try {
        const body = err?.response ? await err.response.json() : null;
        if (body?.code) {
          setClaimed(true);
          return;
        }
        toast({ title: body?.error ?? "Something went wrong", variant: "destructive" });
      } catch {
        toast({ title: "Something went wrong", variant: "destructive" });
      }
    },
  });

  const cfg = EVENT_CONFIG[activeEvent];

  const onSubmit = (data: VoucherFormData) => {
    claimMutation.mutate({ ...data, event: activeEvent });
  };

  return (
    <section id="have-we-met" className="relative py-24 overflow-hidden">
      {/* Chrome animated background */}
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(120deg, #1a1a1a 0%, #3a3a3a 15%, #8c8c8c 28%, #d8d8d8 40%, #f2f2f2 50%, #d8d8d8 60%, #8c8c8c 72%, #3a3a3a 85%, #1a1a1a 100%)",
          backgroundSize: "300% 100%",
        }}
      />
      {/* Overlay for legibility */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />

      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-3">Exclusive Offer</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5" style={{ fontFamily: "'Aileron', sans-serif" }}>
            Have we met?
          </h2>
          <p className="text-white/75 text-base leading-relaxed text-center">
            Get 30 days FREE as part of our Cannes Pilot Cohort. Invite up to 10 clients to sample & analyze the increase in sales conversions. No credit card required.
          </p>
        </div>

        {/* Event toggle — equal-width, no emojis */}
        <div className="flex justify-center mb-8">
          <div className="flex rounded-full p-1 w-full max-w-xs" style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {(["vivatech", "cannes"] as const).map((ev) => {
              const c = EVENT_CONFIG[ev];
              const active = activeEvent === ev;
              return (
                <button
                  key={ev}
                  onClick={() => { setActiveEvent(ev); form.setValue("event", ev); setClaimed(false); }}
                  data-testid={`btn-event-${ev}`}
                  className="flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-200 text-center"
                  style={{
                    background: active ? c.color : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {c.badge}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form / Success */}
        <AnimatePresence mode="wait">
          {!claimed ? (
            <motion.div
              key={activeEvent}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl p-6"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="First name"
                            data-testid="input-voucher-firstname"
                            className="bg-white/10 border-white/15 text-white placeholder:text-white/40 focus:border-white/50 h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Work email"
                            data-testid="input-voucher-email"
                            className="bg-white/10 border-white/15 text-white placeholder:text-white/40 focus:border-white/50 h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="LinkedIn URL"
                            data-testid="input-voucher-linkedin"
                            className="bg-white/10 border-white/15 text-white placeholder:text-white/40 focus:border-white/50 h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  {/* Button row with LinkedIn circle flush right */}
                  <div className="relative mt-1">
                    <Button
                      type="submit"
                      disabled={claimMutation.isPending}
                      data-testid="btn-voucher-claim"
                      className="w-full font-bold text-white rounded-xl h-12 text-base transition-all pr-16"
                      style={{ background: cfg.color, border: "none" }}
                    >
                      {claimMutation.isPending ? "Sending…" : "GO!"}
                    </Button>
                    <a
                      href="https://www.linkedin.com/showcase/join-materialized/"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-voucher-linkedin-materialized"
                      className="absolute right-0 top-0 flex items-center justify-center w-12 h-12 rounded-full text-white hover:opacity-80 transition-opacity"
                      style={{ background: "#0077b5" }}
                    >
                      <SiLinkedin className="w-5 h-5" />
                    </a>
                  </div>
                </form>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}
            >
              <h3 className="text-white font-bold text-2xl mb-3">Check your inbox.</h3>
              <p className="text-white/65 text-base mb-7 leading-relaxed">
                Your exclusive access details are on the way.<br />
                Sign up to activate your free 14-day trial.
              </p>
              <a href="/register" className="block">
                <Button
                  className="w-full font-bold text-white rounded-xl h-12 text-base"
                  style={{ background: cfg.color, border: "none" }}
                  data-testid="btn-voucher-register"
                >
                  Sign Up Now →
                </Button>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Signup Section ──────────────────────────────────────────────────────────

function SignupSection() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"creator" | "brand" | "publisher" | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "creator",
      firstName: "",
      surname: "",
      email: "",
      password: "",
      instagramHandle: "",
      tiktokHandle: "",
      country: "",
      city: "",
      accessCode: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const backendRole = data.role === "publisher" ? "affiliate" : data.role;
      const response = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        displayName: `${data.firstName} ${data.surname}`.trim(),
        role: backendRole,
        accessCode: data.accessCode,
      });
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Welcome aboard!",
        description: "Your account has been created successfully.",
      });
      const role = (variables.role || selectedRole) as string;
      const destination = ROLE_ROUTES[role] ?? "/creator";
      setLocation(destination);
    },
    onError: (error: Error) => {
      if (error.message.includes("409")) {
        form.setError("email", { message: "This email is already registered." });
        return;
      }
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleRoleSelect = (role: "creator" | "brand" | "publisher") => {
    setSelectedRole(role);
    form.setValue("role", role);
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <section id="signup" className="py-20 px-4 bg-[#33415c]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
            Join the Revolution
          </h2>
          <p className="text-center text-white/70 mb-12 text-lg">
            Choose your subscription & increase your sales performance 
          </p>

          {!selectedRole ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  role: "creator" as const,
                  title: "Creator",
                  tagline: "Built for Content Creators and Filmmakers",
                  accentColor: "#1351aa",
                  hoverBg: "rgba(19,81,170,0.22)",
                  hoverBorder: "rgba(19,81,170,0.7)",
                  glowColor: "rgba(19,81,170,0.35)",
                  icon: "🎬",
                },
                {
                  role: "brand" as const,
                  title: "Brand",
                  tagline: "Designed for Brands and eCommerce Stores",
                  accentColor: "#6dbf7e",
                  hoverBg: "rgba(49,77,59,0.28)",
                  hoverBorder: "rgba(109,191,126,0.7)",
                  glowColor: "rgba(107,143,214,0.3)",
                  icon: "🛍️",
                },
                {
                  role: "publisher" as const,
                  title: "Publisher",
                  tagline: "Affiliate benefits for Publishers who repost from the Global Video Library",
                  accentColor: "#c8a54a",
                  hoverBg: "rgba(200,165,74,0.2)",
                  hoverBorder: "rgba(200,165,74,0.65)",
                  glowColor: "rgba(2,4,16,0.35)",
                  icon: "📡",
                },
              ].map((item) => (
                <motion.button
                  key={item.role}
                  initial={{ boxShadow: "0 0 0px transparent" }}
                  whileHover={{
                    scale: 1.04,
                    backgroundColor: item.hoverBg,
                    borderColor: item.hoverBorder,
                    boxShadow: `0 8px 40px ${item.glowColor}, 0 0 0 1px ${item.hoverBorder}`,
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => handleRoleSelect(item.role)}
                  className="p-8 rounded-3xl backdrop-blur-sm text-left flex flex-col gap-5 group"
                  style={{ background: "rgba(255,255,255,0.07)", border: `1px solid rgba(255,255,255,0.15)`, minHeight: 220 }}
                  data-testid={`button-role-${item.role}`}
                >
                  <div>
                    <div
                      className="text-2xl font-bold text-white mb-3 tracking-tight"
                      style={{ fontFamily: "'Aileron', sans-serif" }}
                    >
                      {item.title}
                    </div>
                    <div className="text-white/75 text-base leading-relaxed">{item.tagline}</div>
                  </div>
                  <div
                    className="mt-auto text-sm font-semibold flex items-center gap-1.5 transition-colors"
                    style={{ color: "#ffffff" }}
                  >
                    Get started
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => setSelectedRole(null)}
                className="text-white/60 hover:text-white mb-6 flex items-center gap-2"
                data-testid="button-back-role"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                Back to role selection
              </button>
              <Card
                className="bg-white/10 backdrop-blur-sm border-white/20 p-6"
                style={{ borderRadius: 50 }}
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                style={{ borderRadius: 30 }}
                                placeholder="First name"
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                style={{ borderRadius: 30 }}
                                placeholder="Surname"
                                data-testid="input-surname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                style={{ borderRadius: 30 }}
                                placeholder="Email address"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                style={{ borderRadius: 30 }}
                                placeholder="Password (min. 6 characters)"
                                data-testid="input-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="instagramHandle"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                style={{ borderRadius: 30 }}
                                placeholder="Instagram @handle"
                                data-testid="input-instagram"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tiktokHandle"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                style={{ borderRadius: 30 }}
                                placeholder="TikTok @handle"
                                data-testid="input-tiktok"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <div style={{ borderRadius: 30, overflow: "hidden" }}>
                                  <SelectTrigger
                                    className="bg-white/10 border-white/20 text-white !rounded-[30px]"
                                    data-testid="select-country"
                                  >
                                    <SelectValue placeholder="Country" />
                                  </SelectTrigger>
                                </div>
                              </FormControl>
                              <SelectContent className="max-h-[200px]">
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                style={{ borderRadius: 30 }}
                                placeholder="City"
                                data-testid="input-city"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="accessCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                              style={{ borderRadius: 30 }}
                              placeholder="Access code (optional — enter for free access)"
                              data-testid="input-access-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <motion.button
                      type="submit"
                      disabled={mutation.isPending}
                      whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(103,122,103,0.7), 0 8px 24px rgba(0,0,0,0.3)" }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-full bg-[#314d3b] text-white font-semibold rounded-full mt-4 disabled:opacity-60"
                      style={{ fontSize: 18, padding: "16px 30px" }}
                      data-testid="button-submit-signup"
                    >
                      {mutation.isPending ? "Creating Account..." : "Create Free Account"}
                    </motion.button>
                  </form>
                </Form>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function RollingText({ children }: { children: string }) {
  return (
    <span
      className="relative inline-flex flex-col overflow-hidden"
      style={{ height: "1.2em", verticalAlign: "bottom" }}
    >
      <span
        className="translate-y-0 transition-transform duration-500 ease-in-out group-hover:-translate-y-full"
        aria-hidden="true"
      >
        {children}
      </span>
      <span
        className="absolute inset-x-0 translate-y-full transition-transform duration-500 ease-in-out group-hover:translate-y-0"
      >
        {children}
      </span>
    </span>
  );
}

export default function Landing() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);
  const [openFooterItem, setOpenFooterItem] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [miroMuted, setMiroMuted] = useState(true);
  const miroVideoRef = useRef<HTMLVideoElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setHeaderScrolled(currentY > 20);
      if (currentY < 10) {
        setHeaderVisible(true);
      } else if (currentY > lastScrollY.current + 4) {
        setHeaderVisible(false);
      } else if (currentY < lastScrollY.current - 4) {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const v = miroVideoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  const heroBlobs = [
    { size: 320, anchor: { top: "5%", left: "2%" }, travelX: [0, 60, 30, -25, 15, 0], travelY: [0, 40, -30, 28, -18, 0], travelDuration: 44, rotateDuration: 20, dir: 1 },
    { size: 260, anchor: { bottom: "5%", right: "2%" }, travelX: [0, -50, -28, 20, -12, 0], travelY: [0, -38, 28, -26, 14, 0], travelDuration: 54, rotateDuration: 26, dir: -1 },
    { size: 180, anchor: { top: "10%", right: "5%" }, travelX: [0, -36, -18, 28, -6, 0], travelY: [0, 22, 40, -24, 10, 0], travelDuration: 38, rotateDuration: 15, dir: -1 },
    { size: 140, anchor: { bottom: "10%", left: "5%" }, travelX: [0, 42, 22, -32, 10, 0], travelY: [0, -26, 22, 14, -14, 0], travelDuration: 32, rotateDuration: 12, dir: 1 },
  ];


  const scrollToSignup = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToHaveWeMet = () => {
    document.getElementById("have-we-met")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <section className="relative min-h-screen overflow-hidden">
        {/* Full-screen hero video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-label="Miro Misljen black dress fashion video"
        >
          <source src="/miro-misljen-black-dress.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/70" />

        {/* Nav bar */}
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 transition-transform duration-300 ease-in-out"
          style={{
            transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
            background: headerScrolled
              ? "linear-gradient(to bottom, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.72) 60%, rgba(10,10,10,0) 100%)"
              : "linear-gradient(to bottom, rgba(10,10,10,0.70) 0%, rgba(10,10,10,0.40) 60%, rgba(10,10,10,0) 100%)",
            backdropFilter: "blur(0px)",
          }}
        >
          <img src={materializedLogo} alt="Materialized" className="h-20 sm:h-32 w-auto" />
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="group text-white/80 hover:text-white rounded-full text-sm overflow-hidden flex items-center gap-1.5"
                style={{ border: "1px solid rgba(180,180,180,0.32)", background: "transparent" }}
                data-testid="button-nav-signin"
              >
                <CircleUserRound className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <RollingText>Sign In</RollingText>
              </Button>
            </Link>
            <Button
              onClick={scrollToSignup}
              variant="ghost"
              size="sm"
              className="group text-white font-semibold rounded-full text-sm overflow-hidden"
              style={{ border: "1px solid rgba(180,180,180,0.32)", background: "transparent" }}
              data-testid="button-nav-get-started"
            >
              <RollingText>Get Started</RollingText>
            </Button>
          </div>
        </div>

        {/* Hero text — bottom left */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 flex flex-col justify-end min-h-screen px-6 sm:px-10 pb-20 pt-24"
        >
          <p className="text-[#6b8fd6] text-xs font-semibold tracking-[0.25em] uppercase mb-4">
            Shoppable Creator Content
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 max-w-2xl">
            Turn Video<br />Into Revenue
          </h1>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="inline-flex"
          >
            <Button
              onClick={scrollToSignup}
              size="lg"
              className="text-white font-semibold rounded-full border-0"
              style={{ paddingLeft: "30px", paddingRight: "30px", paddingTop: "15px", paddingBottom: "15px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}
              data-testid="button-hero-cta"
            >
              Get Started
            </Button>
          </motion.div>
        </motion.div>

        {/* Miro Misljen Little Black Dress floating product card — square */}
        <div className="absolute top-24 right-4 sm:top-auto sm:bottom-16 sm:right-6 z-30" style={{ width: "clamp(160px, 26vw, 260px)" }}>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <a
              href="https://www.etsy.com/listing/4454443883/one-shoulder-black-dress-one-size-34-to?ref=shop_home_active_14&frs=1&logging_key=b2c6b649fb5b9c4ad8cea5cc9f68f260b736d7a4%3A4454443883"
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline"
              data-testid="card-miro-black-dress-hero"
            >
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "rgba(0,0,0,0.58)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.06)",
                  padding: "18px",
                }}
              >
                <div className="space-y-1 mb-4">
                  <div className="text-white/45 text-[8px] uppercase tracking-widest font-medium">MIRO MISLJEN</div>
                  <div className="text-white text-sm font-semibold leading-tight">Little Black Dress</div>
                  <div className="text-white font-bold text-xl leading-tight">€790</div>
                </div>
                <div
                  className="w-full text-center text-[9px] font-black tracking-widest text-[#1a1a1a] py-2.5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.92)" }}
                >
                  BUY NOW
                </div>
              </div>
            </a>
          </motion.div>
        </div>

        {/* Scroll chevron */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="w-8 h-8 text-white/50 animate-bounce" />
        </motion.div>
      </section>

      {/* Mobile-only submenu — below hero video */}
      <div className="sm:hidden bg-[#020410] px-4 py-3 flex items-center justify-between gap-2">
        {[
          { label: "Pricing", onClick: scrollToSignup, testId: "button-mobile-pricing" },
          // { label: "Cannes Lions", onClick: scrollToHaveWeMet, testId: "button-mobile-cannes" }, // hidden with "Have we met?" section, re-enable together
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            data-testid={item.testId}
            className="flex-1 py-2 px-3 rounded-xl text-white/60 text-sm font-medium transition-all duration-300 hover:text-white"
            style={{ background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.textShadow = "0 0 12px rgba(220,230,255,0.9), 0 0 24px rgba(180,200,255,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.textShadow = "none")}
          >
            {item.label}
          </button>
        ))}
        <div className="w-px h-5 bg-white/15 flex-shrink-0" />
        <Link href="/login">
          <button
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-white/60 text-sm font-medium transition-all duration-300 hover:text-white flex-shrink-0"
            style={{ background: "transparent" }}
            data-testid="button-mobile-signin"
            onMouseEnter={e => (e.currentTarget.style.textShadow = "0 0 12px rgba(220,230,255,0.9), 0 0 24px rgba(180,200,255,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.textShadow = "none")}
          >
            <CircleUserRound className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            Sign In
          </button>
        </Link>
      </div>

      {/* ── Section cards ── all float on #020410 background with 50px radius */}
      <div className="bg-[#020410] px-3 md:px-6 space-y-3 py-3">

        {/* Stats + Testimonials — dark card */}
        <div
          className="overflow-hidden"
          style={{
            borderRadius: 50,
            boxShadow: "0 20px 70px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.3)",
          }}
        >
          <StatsSection />
          <TestimonialCarousel />
        </div>

        {/* Parallax video — true full-bleed, breaks out of container padding */}
        <div className="overflow-hidden -mx-3 md:-mx-6">
          <ParallaxImageSection />
        </div>

        {/* One Platform, Every Format — grows over parallax on scroll */}
        <div
          className="overflow-hidden relative"
          style={{
            borderRadius: 50,
            boxShadow: "0 20px 70px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.3)",
            background: "#001233",
            marginTop: -48,
            zIndex: 10,
          }}
        >
          <VideoOrientationSection />
        </div>

        {/* Marquee strip — full bleed */}
        <div className="w-full">
          {(() => {
            const items = [
              "creator content",
              "documentaries",
              "music videos",
              "beauty tutorials",
              "panels & concerts",
              "theatre productions",
              "advertorials",
              "fashion runways",
              "in-flight entertainment",
              "travel blogs",
              "fashion week",
            ];

            const pillText = "creator content  •  creator content  •  creator content  •  creator content  •  ";

            const renderTrack = (prefix: string) =>
              items.map((item, i) =>
                item === "creator content" ? (
                  <span key={`${prefix}-${i}`} className="flex items-center shrink-0 px-3">
                    <span
                      className="inline-flex items-center overflow-hidden shrink-0 bg-[#6b8fd6]"
                      style={{
                        borderRadius: 50,
                        height: 44,
                        width: 220,
                        verticalAlign: "middle",
                      }}
                    >
                      <span className="pill-marquee-track">
                        <span
                          className="whitespace-nowrap px-4 font-accent text-[#ffffff]"
                          style={{
                            fontStyle: "italic",
                            fontSize: 18,
                            letterSpacing: "0.01em",
                          }}
                        >
                          {pillText}
                        </span>
                        <span
                          className="whitespace-nowrap px-4 font-accent text-[#ffffff]"
                          style={{
                            fontStyle: "italic",
                            fontSize: 18,
                            letterSpacing: "0.01em",
                          }}
                        >
                          {pillText}
                        </span>
                      </span>
                    </span>
                  </span>
                ) : (
                  <span key={`${prefix}-${i}`} className="flex items-center shrink-0">
                    <span
                      className="whitespace-nowrap text-white px-4 text-[18px] font-bold"
                    >
                      {item}
                    </span>
                    <img
                      src="/blob-divider.png"
                      alt=""
                      aria-hidden="true"
                      className={`shrink-0${i % 2 === 1 ? " blob-spin-ccw" : ""}`}
                      style={{ width: 28, height: 28, objectFit: "contain" }}
                    />
                  </span>
                )
              );

            return (
              <div className="w-full overflow-hidden bg-[#020410] py-4">
                <div className="marquee-track">
                  {renderTrack("a")}
                  {renderTrack("b")}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sign up — dark card */}
        <div
          className="overflow-hidden"
          style={{
            borderRadius: 50,
            boxShadow: "0 20px 70px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.3)",
          }}
        >
          <SignupSection />
        </div>

        {/* Event Voucher Section — "Have we met?" — temporarily hidden, re-enable at a later date */}
        {/* <EventVoucherSection /> */}

        {/* Data Analytics feature — formerly hero */}
        <div
          className="overflow-hidden relative"
          style={{
            borderRadius: 50,
            background: "#1a1a1a",
            boxShadow: "0 20px 70px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.3)",
          }}
        >
          <section className="relative min-h-screen overflow-hidden bg-[#1a1a1a]">
            {/* Chrome blobs */}
            {heroBlobs.map((blob, i) => (
              <motion.div
                key={i}
                animate={{ x: blob.travelX, y: blob.travelY }}
                transition={{ duration: blob.travelDuration, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
                className="absolute pointer-events-none select-none"
                style={{ top: blob.anchor.top, bottom: blob.anchor.bottom, left: blob.anchor.left, right: blob.anchor.right, zIndex: 0 }}
              >
                <motion.img
                  src={chromeBlobIcon}
                  alt=""
                  aria-hidden="true"
                  animate={{ rotate: [0, blob.dir * 360] }}
                  transition={{ duration: blob.rotateDuration, repeat: Infinity, ease: "linear" }}
                  style={{ width: blob.size, height: blob.size, opacity: 0.14, display: "block" }}
                />
              </motion.div>
            ))}

            {/* Two-column content */}
            <div className="relative z-10 flex items-center min-h-screen px-6 pt-20 pb-12">
              <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-20">

                {/* Left: Data Analytics text */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 text-center lg:text-left"
                >
                  <p className="text-[#6b8fd6] text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                    Data &amp; Analytics
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                    <TypewriterText />
                  </h2>
                  <p className="text-lg md:text-xl text-white/70 max-w-xl mb-10">
                    The all-in-one platform for creators, brands, and publishers to monetize video content with AI-powered product detection and seamless affiliate tracking.
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="inline-flex"
                  >
                    <Button
                      onClick={scrollToSignup}
                      size="lg"
                      className="text-white font-semibold rounded-full border-0"
                      style={{ paddingLeft: "30px", paddingRight: "30px", paddingTop: "15px", paddingBottom: "15px", background: "#1351aa47", backdropFilter: "blur(8px)" }}
                      data-testid="button-analytics-cta"
                    >
                      Try Now
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Right: Miro Misljen product video in tablet */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.2 }}
                  className="flex-1 flex justify-center"
                >
                  <div className="relative w-full max-w-[520px] mx-auto">
                    {/* Chrome tablet frame, rotated to vertical/portrait orientation, enlarged 1.5x */}
                    <div className="relative mx-auto" style={{ width: 450, height: 663 }}>
                      {/* Frame graphic (landscape source image, rotated to appear portrait) */}
                      <div
                        className="absolute top-1/2 left-1/2 pointer-events-none select-none"
                        style={{
                          width: 663,
                          height: 450,
                          transform: "translate(-50%, -50%) rotate(-90deg)",
                        }}
                      >
                        <img
                          src={chromeTabletFrame}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full"
                          style={{
                            objectFit: "fill",
                            filter: "drop-shadow(0 50px 120px rgba(0,0,0,0.45)) drop-shadow(0 15px 40px rgba(0,0,0,0.3))",
                          }}
                        />
                      </div>
                      {/* Video with product carousel fitted into the frame's screen area */}
                      <div
                        className="absolute overflow-hidden bg-black"
                        style={{ left: "8%", top: "9%", width: "84%", height: "82%", borderRadius: 30 }}
                      >
                        <button
                          onClick={() => {
                            const v = miroVideoRef.current;
                            if (!v) return;
                            const next = !miroMuted;
                            v.muted = next;
                            setMiroMuted(next);
                          }}
                          className="absolute top-3 left-3 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
                          data-testid="button-miro-audio-toggle"
                          title={miroMuted ? "Enable audio" : "Mute"}
                        >
                          {miroMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                        </button>
                        <video
                          ref={miroVideoRef}
                          src="/miro-misljen-dress.mp4"
                          autoPlay
                          loop
                          playsInline
                          muted={miroMuted}
                          className="w-full h-full object-cover"
                          data-testid="video-miro-misljen"
                          onLoadedMetadata={(e) => {
                            const v = e.currentTarget;
                            v.currentTime = 3;
                            v.play().catch(() => {});
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent pointer-events-none" />
                        {/* Product carousel card, fitted inside the video/frame */}
                        <div className="absolute bottom-3 right-3 z-30">
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <a
                              href="https://www.etsy.com/listing/4438945876/mixed-media-deconstructed-patchwork?ls=s&ga_order=most_relevant&ga_search_type=all&ga_view_type=gallery&ga_search_query=miro+misljen&ref=sr_gallery-1-7"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block no-underline"
                              style={{ width: "clamp(148px, 18vw, 196px)" }}
                              data-testid="link-miro-product-card"
                            >
                              <div
                                className="rounded-2xl overflow-hidden"
                                style={{
                                  background: "rgba(0,0,0,0.52)",
                                  backdropFilter: "blur(14px)",
                                  border: "1px solid rgba(255,255,255,0.13)",
                                  boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.06)",
                                }}
                              >
                                <div className="p-3 space-y-2.5">
                                  <div className="space-y-0.5">
                                    <div className="text-white/45 text-[7.5px] uppercase tracking-widest font-medium">MIRO MISLJEN</div>
                                    <div className="text-white text-[11px] font-semibold leading-tight">Deconstructed Patchwork Dress</div>
                                    <div className="text-white font-bold text-base leading-tight">€1,129</div>
                                  </div>
                                  <div
                                    className="w-full text-center text-[8.5px] font-black tracking-widest text-[#1a1a1a] py-2 rounded-xl"
                                    style={{ background: "rgba(255,255,255,0.92)" }}
                                  >
                                    BUY NOW
                                  </div>
                                </div>
                              </div>
                            </a>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </section>
        </div>

      </div>


      <DemoPopup open={showDemo} onClose={() => setShowDemo(false)} />

      <footer className="py-12 px-4 border-t border-white/10 bg-[#020410]" style={{ borderTopLeftRadius: 50, borderTopRightRadius: 50, marginTop: -15, position: "relative", zIndex: 10 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <img src={materializedLogo} alt="Materialized" className="h-40 mx-auto w-auto" />
          </div>

          <div className="max-w-md mx-auto mb-8 space-y-1">
            {[
              {
                key: "support",
                label: "Support",
                content: (
                  <div className="text-white/60 text-sm leading-relaxed">
                    <p className="mb-3">Need help? Visit our Help Centre for guides and FAQs, or browse the Creator, Brand, and Publisher dashboards to get started.</p>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <Link href="/creator" className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-creator">Creator Portal</Link>
                      <Link href="/brand" className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-brand">Brand Portal</Link>
                      <Link href="/affiliate" className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-publisher">Publisher Portal</Link>
                    </div>
                    <p>Not registered yet? <a href="#signup" onClick={(e) => { e.preventDefault(); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }} className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-support-signup">Sign Up &rarr;</a> to access full support resources.</p>
                  </div>
                ),
              },
              {
                key: "integrations",
                label: "Integrations",
                content: (
                  <div className="text-white/60 text-sm leading-relaxed">
                    <p className="mb-3">Shoppable videos are exported as embedded code, which can be published on any website or platform. UTM codes provide video performance analytics, and reward the affiliate eco-system. API Keys are used to sync product inventories, that in turn make video imports shoppable.</p>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <Link href="/creator" className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-integrations-creator">Creator Portal</Link>
                      <Link href="/brand" className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-integrations-brand">Brand Portal</Link>
                      <Link href="/affiliate" className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-integrations-publisher">Publisher Portal</Link>
                    </div>
                    <p>Ready to connect? <a href="#signup" onClick={(e) => { e.preventDefault(); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }} className="text-[#1351aa] hover:text-[#4a7ed6] underline" data-testid="link-footer-integrations-signup">Sign Up &rarr;</a> to get started.</p>
                  </div>
                ),
              },
              {
                key: "contact",
                label: "Contact",
                content: <ContactForm />,
              },
            ].map((item) => (
              <div key={item.key} className="border-b border-white/10">
                <button
                  onClick={() => setOpenFooterItem(openFooterItem === item.key ? null : item.key)}
                  className="w-full flex items-center justify-between py-3 text-white text-sm font-medium hover:text-[#1351aa] transition-colors"
                  data-testid={`button-footer-${item.key}`}
                >
                  {item.label}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFooterItem === item.key ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFooterItem === item.key ? (item.key === "contact" ? "max-h-[700px] pb-4" : "max-h-60 pb-4") : "max-h-0"}`}>
                  {item.content}
                </div>
              </div>
            ))}

            {/* Demo — opens video popup */}
            <div className="border-b border-white/10">
              <button
                onClick={() => setShowDemo(true)}
                className="w-full flex items-center justify-between py-3 text-white text-sm font-medium hover:text-[#1351aa] transition-colors"
                data-testid="button-footer-demo"
              >
                Demo
                <Play className="w-4 h-4 text-[#1351aa]" />
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-4">
            <a
              href="https://instagram.com/join.materialized"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Materialized on Instagram"
              data-testid="link-footer-instagram"
              className="text-white/60 hover:text-white transition-colors"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/showcase/join-materialized/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Materialized on LinkedIn"
              data-testid="link-footer-linkedin"
              className="text-white/60 hover:text-white transition-colors"
            >
              <SiLinkedin className="w-5 h-5" />
            </a>
          </div>

          <p className="text-white/40 text-xs text-center" data-testid="text-footer-copyright">
            &copy; 2026 Materialized. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
