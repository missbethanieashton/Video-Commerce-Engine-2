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
import { COUNTRIES, insertSubscriberIntakeSchema } from "@shared/schema";
import { Play, ChevronDown, Users, DollarSign, TrendingUp, ShoppingBag, ArrowRight, Star, Smartphone, Monitor, Video } from "lucide-react";
import { SiInstagram, SiLinkedin } from "react-icons/si";
import heroVideo from "@assets/Materialized_APP_Intro_Screen_1767864559824.mp4";
import discoveryPacksVideo from "@assets/Discovery_Packs_1767870108965.mp4";
import verticalDemoVideo from "@assets/Materialized_APP_Intro_Screen_1767873358319.mp4";
import materializedLogo from "@assets/MATERIALIZED_full_logo_1773324040022.png";

const streetStyleVideo = "/street-style-ss26.mp4";

const formSchema = insertSubscriberIntakeSchema;
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
        <p className="text-[#677A67] font-semibold text-sm">Message sent!</p>
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
              <FormLabel className="text-white/60 text-xs">First Name *</FormLabel>
              <FormControl>
                <input {...field} data-testid="input-contact-firstName" placeholder="Jane"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#677A67] transition-colors" />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )} />
          <FormField control={form.control} name="surname" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-white/60 text-xs">Surname *</FormLabel>
              <FormControl>
                <input {...field} data-testid="input-contact-surname" placeholder="Smith"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#677A67] transition-colors" />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )} />
        </div>

        {/* Email */}
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-white/60 text-xs">Email *</FormLabel>
            <FormControl>
              <input {...field} type="email" data-testid="input-contact-email" placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#677A67] transition-colors" />
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
                      ? "border-[#677A67] bg-[#677A67]/20 text-[#8fb08f]"
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
            <FormLabel className="text-white/60 text-xs">Instagram Handle *</FormLabel>
            <FormControl>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden focus-within:border-[#677A67] transition-colors">
                <span className="px-3 text-white/30 text-sm select-none">@</span>
                <input {...field} data-testid="input-contact-igHandle" placeholder="yourhandle"
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
              <FormLabel className="text-white/60 text-xs">Message *</FormLabel>
              <span className={`text-xs ${msg.length > 190 ? "text-amber-400" : "text-white/30"}`}>{msg.length}/200</span>
            </div>
            <FormControl>
              <textarea {...field} data-testid="textarea-contact-message" rows={3} maxLength={200}
                placeholder="Tell us a bit about yourself and what you're looking for..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#677A67] transition-colors resize-none" />
            </FormControl>
            <FormMessage className="text-xs text-red-400" />
          </FormItem>
        )} />

        <button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-contact-submit"
          className="w-full py-2.5 rounded-full bg-[#677A67] text-white font-semibold text-sm hover:bg-[#556655] transition-colors disabled:opacity-50 mt-1"
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
    <span className="inline-block min-w-[280px] text-center text-[22px]">
      {TYPEWRITER_PHRASES[phraseIndex].slice(0, charIndex)}
      <span className="animate-pulse">|</span>
    </span>
  );
}

const STATS = [
  { icon: Users, value: "50K+", label: "Active Creators", color: "text-[#677A67]" },
  { icon: DollarSign, value: "$12M", label: "Creator Earnings", color: "text-[#677A67]" },
  { icon: TrendingUp, value: "340%", label: "Avg. ROI Increase", color: "text-[#43484D]" },
  { icon: ShoppingBag, value: "2.1M", label: "Products Tagged", color: "text-[#677A67]" },
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
    <section className="relative px-4 bg-[#202120]" style={{ paddingTop: "100px", paddingBottom: "100px" }}>
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-6 text-white"
          style={{ fontFamily: "'Public Pixel', sans-serif" }}
        >
          Video Commerce
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="md:text-xl text-white/80 max-w-2xl mx-auto text-[16px]"
        >
          Shoppable video has existed for more than a decade. Materialized has built an affiliate eco-system that rewards reposts, where content provides multi-layered revenues and impact
        </motion.p>
      </div>

      {/* Star icon — straddles StatsSection + TestimonialCarousel */}
      <motion.img
        src={starIcon}
        alt="Materialized star"
        animate={{ y: [0, -22, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-6 md:right-14 w-40 h-40 md:w-56 md:h-56 object-contain select-none pointer-events-none"
        style={{
          bottom: "-5rem",
          zIndex: 20,
          mixBlendMode: "screen",
        }}
      />
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
    <section className="py-10 px-4 bg-[#202120]">
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
              <div className="text-[#677A67] font-semibold text-sm mt-2">
                <span className="text-white/30 mr-2">|</span>{TESTIMONIALS[activeIndex].company}
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
                index === activeIndex ? "bg-[#677A67] w-6" : "bg-white/20 w-4"
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
    <section className="py-20 px-4 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:text-4xl font-bold text-center mb-4 text-[#43484D] text-[24px]"
          style={{ fontFamily: "'Public Pixel', sans-serif" }}
        >
          One Platform, Every Format
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Whether you create vertical Reels or horizontal long-form content, our platform adapts to your style. Materialized offers multiple customization options, including the layout of your product carousel and branded video players
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center">
              <div className="relative w-[220px] md:w-[260px]">
                <div
                  className="relative bg-[#1a1a1a] rounded-[3rem] p-3"
                  style={{
                    boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.3), 0 0 40px rgba(103,122,103,0.15)",
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />
                  <div className="relative rounded-[2.25rem] overflow-hidden bg-black">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full aspect-[9/16] object-cover"
                      aria-label="Vertical video demo"
                    >
                      <source src={verticalDemoVideo} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white font-semibold text-sm">Vertical / Reels</div>
                      <div className="text-white/70 text-xs">9:16 Format</div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
                </div>
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
            <div className="w-full max-w-[560px]">
              <div
                className="relative rounded-[28px] p-[14px]"
                style={{
                  background: "#1a1a1a",
                  boxShadow: "0 30px 70px rgba(0,0,0,0.45), 0 10px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)",
                }}
              >
                {/* Front camera dot */}
                <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#333] shadow-inner" />
                {/* Side button (right) */}
                <div className="absolute right-[-3px] top-[60px] w-[3px] h-8 rounded-r-full bg-[#2a2a2a]" />
                {/* Volume buttons (left) */}
                <div className="absolute left-[-3px] top-[50px] w-[3px] h-5 rounded-l-full bg-[#2a2a2a]" />
                <div className="absolute left-[-3px] top-[78px] w-[3px] h-5 rounded-l-full bg-[#2a2a2a]" />

                {/* Screen */}
                <div className="relative rounded-[16px] overflow-hidden bg-black" style={{ aspectRatio: "16/10" }}>
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
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="text-white font-semibold text-sm drop-shadow">Horizontal / YouTube</div>
                    <div className="text-white/70 text-xs drop-shadow">16:9 Format</div>
                  </div>
                </div>
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
    <section ref={ref} className="relative h-[80vh] overflow-hidden">
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
          className="w-full h-full object-cover"
          aria-label="Street style fashion video"
        >
          <source src={streetStyleVideo} type="video/mp4" />
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
          className="text-[#8fb08f] text-xs font-semibold tracking-[0.25em] uppercase mb-4"
        >
          Shopifying Creator Content
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="text-white font-bold leading-tight max-w-2xl"
          style={{ fontFamily: "'Public Pixel', sans-serif", fontSize: "clamp(18px, 4vw, 36px)" }}
        >
          Buy directly from creator content, music videos, or film series
        </motion.h2>
      </div>
    </section>
  );
}

function VideoOfTheWeekSection() {
  const engagementBubbles = [
    { label: "Clicks", value: "12.4K", top: "10%", left: "5%", delay: 0, size: 90 },
    { label: "Sales", value: "$8,200", top: "30%", right: "5%", delay: 0.5, size: 100 },
    { label: "Shares", value: "3.2K", bottom: "20%", left: "10%", delay: 1.0, size: 90 },
    { label: "ROI", value: "420%", bottom: "10%", right: "10%", delay: 1.5, size: 85 },
  ];

  const chromeBlobs: Array<{ size: number; top?: string; bottom?: string; left?: string; right?: string; duration: number; dir: number }> = [
    { size: 230, top: "0%",   left: "1%",  duration: 22, dir:  1 },
    { size: 200, bottom: "0%", right: "0%", duration: 28, dir: -1 },
    { size: 155, top: "38%",  left: "3%",  duration: 14, dir:  1 },
    { size: 135, top: "8%",   right: "4%", duration: 18, dir: -1 },
    { size:  88, top: "2%",   left: "38%", duration:  9, dir:  1 },
  ];

  return (
    <section className="py-20 px-4 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:text-4xl font-bold text-center mb-4 text-[#43484D] dark:text-white text-[22px]"
          style={{ fontFamily: "'Public Pixel', sans-serif" }}
        >
          Video of the Week
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12">
          See how top creators drive engagement with shoppable content
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative flex justify-center"
        >
          {/* Chrome blobs — behind phone frame and stat bubbles */}
          {chromeBlobs.map((blob, i) => (
            <motion.img
              key={i}
              src={chromeBlobIcon}
              alt=""
              aria-hidden="true"
              animate={{ rotate: [0, blob.dir * 360] }}
              transition={{ duration: blob.duration, repeat: Infinity, ease: "linear" }}
              className="absolute pointer-events-none select-none"
              style={{
                width: blob.size,
                height: blob.size,
                top: blob.top,
                bottom: blob.bottom,
                left: blob.left,
                right: blob.right,
                opacity: 0.18,
                mixBlendMode: "multiply",
                zIndex: 0,
              }}
            />
          ))}

          {/* Mobile Phone Frame */}
          <div className="relative w-[280px] md:w-[320px]" style={{ zIndex: 1 }}>
            {/* Phone bezel */}
            <div className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-7 bg-[#1a1a1a] rounded-b-2xl z-20" />
              {/* Screen */}
              <div className="relative rounded-[2.25rem] overflow-hidden bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full aspect-[9/16] object-cover"
                  aria-label="Discovery Packs video"
                >
                  <source src={discoveryPacksVideo} type="video/mp4" />
                </video>
                {/* Video overlay info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="text-white font-semibold text-sm">Discovery Packs</div>
                  <div className="text-white/70 text-xs">@join.materialized</div>
                </div>
              </div>
              {/* Home indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
          {engagementBubbles.map((bubble, index) => (
            <motion.div
              key={bubble.label}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{
                scale: [1, 1.2, 1],
                transition: {
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              transition={{
                delay: bubble.delay,
                type: "spring",
                stiffness: 200,
              }}
              className="absolute bg-white shadow-lg flex flex-col items-center justify-center cursor-pointer"
              style={{
                top: bubble.top,
                left: bubble.left,
                right: bubble.right,
                bottom: bubble.bottom,
                width: bubble.size,
                height: bubble.size,
                borderRadius: "50%",
                zIndex: 2,
              }}
            >
              <div className="text-base font-bold text-[#43484D] leading-tight">{bubble.value}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{bubble.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const ROLE_ROUTES: Record<string, string> = {
  creator: "/creator",
  brand: "/brand",
  publisher: "/affiliate",
};

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
      instagramHandle: "",
      tiktokHandle: "",
      country: "",
      city: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/subscriber-intake", data);
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
      toast({
        title: "Something went wrong",
        description: error.message.includes("409") 
          ? "This email is already registered." 
          : "Please try again later.",
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
    <section id="signup" className="py-20 px-4 bg-[#202120]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white" style={{ fontFamily: "'Public Pixel', sans-serif" }}>
            Join the Revolution
          </h2>
          <p className="text-center text-white/70 mb-12">
            Create your free account to see how AI is transforming entertainment & building new wealth today
          </p>

          {!selectedRole ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { role: "creator" as const, title: "Creator", desc: "Import your videos, tag brands, and shopify your video assets in seconds" },
                { role: "brand" as const, title: "Brand", desc: "Connect your inventory, import your recorded runways or fashion films and Materialized will deliver shoppable videos for your website" },
                { role: "publisher" as const, title: "Publisher", desc: "Save on production costs! Search our global video library for categorized entertainment, curate a playlist of content that suits your niche, publish and generate a new revenue stream from affiliate royalties" },
              ].map((item) => (
                <motion.button
                  key={item.role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect(item.role)}
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-left hover:bg-white/20 transition-colors group"
                  data-testid={`button-role-${item.role}`}
                >
                  <div className="text-xl font-semibold text-white mb-2">
                    {item.title}
                  </div>
                  <div className="text-white/60 text-sm">{item.desc}</div>
                  <ArrowRight className="w-5 h-5 text-[#677A67] mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                placeholder="John"
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
                            <FormLabel className="text-white">Surname</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                placeholder="Doe"
                                data-testid="input-surname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                              placeholder="john@example.com"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="instagramHandle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Instagram (optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                placeholder="@yourhandle"
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
                            <FormLabel className="text-white">TikTok (optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                placeholder="@yourhandle"
                                data-testid="input-tiktok"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Country</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-country">
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
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
                            <FormLabel className="text-white">City</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                placeholder="New York"
                                data-testid="input-city"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full bg-[#677A67] hover:bg-[#5a6d5a] text-white font-semibold py-6 rounded-full mt-6"
                      style={{ paddingLeft: "30px", paddingRight: "30px" }}
                      data-testid="button-submit-signup"
                    >
                      {mutation.isPending ? "Creating Account..." : "Create Free Account"}
                    </Button>
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

export default function Landing() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);
  const [openFooterItem, setOpenFooterItem] = useState<string | null>(null);

  const scrollToSignup = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <section className="relative h-screen overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            aria-hidden="true"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </motion.div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: "'Public Pixel', sans-serif" }}>
              <TypewriterText />
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              The all-in-one platform for creators, brands, and publishers to monetize video content with AI-powered product detection and seamless affiliate tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={scrollToSignup}
                size="lg"
                className="bg-[#677A67] hover:bg-[#5a6d5a] text-white font-semibold rounded-full"
                style={{ paddingLeft: "30px", paddingRight: "30px", paddingTop: "15px", paddingBottom: "15px" }}
                data-testid="button-hero-cta"
              >
                Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 rounded-full backdrop-blur-sm"
                style={{ paddingLeft: "30px", paddingRight: "30px", paddingTop: "15px", paddingBottom: "15px" }}
                data-testid="button-hero-learn-more"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-white/60 animate-bounce" />
          </motion.div>
        </div>
      </section>

      <StatsSection />
      <ParallaxImageSection />
      <VideoOrientationSection />
      {/* Announcement marquee bar */}
      {(() => {
        const items = [
          "documentaries",
          "music videos",
          "beauty tutorials",
          "panels and stage performances",
          "theatre productions",
          "advertorials",
          "fashion runways",
          "in-flight entertainment",
          "travel blogs",
          "fashion week",
          "creator content",
        ];
        const track = (
          <>
            {items.map((item, i) => (
              <span key={i} className="flex items-center shrink-0">
                <span className="whitespace-nowrap text-white text-sm font-medium tracking-wide uppercase px-4">
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
            ))}
          </>
        );
        return (
          <div className="w-full overflow-hidden bg-[#202120] border-y border-white/10 py-3">
            <div className="marquee-track">
              {track}
              {track}
            </div>
          </div>
        );
      })()}

      <TestimonialCarousel />
      <VideoOfTheWeekSection />
      <SignupSection />

      <footer className="py-12 px-4 bg-[#202120] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <img src={materializedLogo} alt="Materialized" className="h-40 mx-auto" style={{ filter: "invert(1)" }} />
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
                      <Link href="/creator" className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-creator">Creator Portal</Link>
                      <Link href="/brand" className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-brand">Brand Portal</Link>
                      <Link href="/affiliate" className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-publisher">Publisher Portal</Link>
                    </div>
                    <p>Not registered yet? <a href="#signup" onClick={(e) => { e.preventDefault(); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }} className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-support-signup">Sign Up &rarr;</a> to access full support resources.</p>
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
                      <Link href="/creator" className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-integrations-creator">Creator Portal</Link>
                      <Link href="/brand" className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-integrations-brand">Brand Portal</Link>
                      <Link href="/affiliate" className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-integrations-publisher">Publisher Portal</Link>
                    </div>
                    <p>Ready to connect? <a href="#signup" onClick={(e) => { e.preventDefault(); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }} className="text-[#677A67] hover:text-[#8a9e8a] underline" data-testid="link-footer-integrations-signup">Sign Up &rarr;</a> to get started.</p>
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
                  className="w-full flex items-center justify-between py-3 text-white text-sm font-medium hover:text-[#677A67] transition-colors"
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
