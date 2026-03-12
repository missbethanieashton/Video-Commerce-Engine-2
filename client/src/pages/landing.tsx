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
import { COUNTRIES, insertSubscriberIntakeSchema } from "@shared/schema";
import { Play, ChevronDown, Users, DollarSign, TrendingUp, ShoppingBag, ArrowRight, Star, Quote, Smartphone, Monitor, Video, Building2, Share2 } from "lucide-react";
import heroVideo from "@assets/Materialized_APP_Intro_Screen_1767864559824.mp4";
import buyTheRunwayImage from "@assets/BUY_THE_RUNWAY_email_header_1767870012968.png";
import discoveryPacksVideo from "@assets/Discovery_Packs_1767870108965.mp4";
import verticalDemoVideo from "@assets/Materialized_APP_Intro_Screen_1767873358319.mp4";

const formSchema = insertSubscriberIntakeSchema;
type FormData = z.infer<typeof formSchema>;

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
    <section className="px-4 bg-[#202120]" style={{ paddingTop: "100px", paddingBottom: "100px" }}>
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
          Upload your videos to our Global Video Directory to multiply your sales and earnings
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
    <section className="py-20 px-4 bg-[#202120]">
      <div className="max-w-4xl mx-auto">
        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Quote className="w-12 h-12 mx-auto mb-6 text-[#677A67] opacity-70" />
              <p className="text-xl md:text-2xl text-white/90 mb-6 italic leading-relaxed">
                "{TESTIMONIALS[activeIndex].quote}"
              </p>
              <div className="text-[#677A67] font-semibold text-lg">
                {TESTIMONIALS[activeIndex].company}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Testimonial navigation">
          {TESTIMONIALS.map((testimonial, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === activeIndex ? "bg-[#677A67] w-8" : "bg-white/30"
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
          Whether you create vertical Reels or horizontal long-form content, our platform adapts to your style.
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
          >
            <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-shadow group">
              <div className="aspect-video bg-gradient-to-b from-[#677A67] to-[#43484D] relative flex items-center justify-center">
                <Monitor className="w-16 h-16 text-white/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-white font-semibold text-sm">Horizontal / YouTube</div>
                  <div className="text-white/70 text-xs">16:9 Format</div>
                </div>
              </div>
            </Card>
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
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-[140%] -top-[20%]"
      >
        <img
          src={buyTheRunwayImage}
          alt="Buy The Runway"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </motion.div>
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

  return (
    <section className="py-20 px-4 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:text-4xl font-bold text-center mb-4 text-[#43484D] dark:text-white text-[24px]"
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
          {/* Mobile Phone Frame */}
          <div className="relative w-[280px] md:w-[320px]">
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
                  <div className="text-white/70 text-xs">@mterlizd_official</div>
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
            Create your free account and see how AI is transforming entertainment & building new wealth today
          </p>

          {!selectedRole ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { role: "creator" as const, title: "Creator", desc: "Upload videos & earn commissions" },
                { role: "brand" as const, title: "Brand", desc: "Connect with creators" },
                { role: "publisher" as const, title: "Publisher", desc: "License & publish videos" },
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
      <TestimonialCarousel />
      <VideoOfTheWeekSection />
      <SignupSection />

      <footer className="py-12 px-4 bg-[#202120] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#677A67] to-white bg-clip-text text-transparent mb-4">
              MTERLIZD
            </div>
            <p className="text-white/60 text-sm mb-6">
              Choose your portal to get started
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <Link href="/creator">
              <Button 
                variant="outline" 
                className="w-full border-[#677A67]/50 text-white hover:bg-[#677A67]/20 rounded-lg py-6"
                data-testid="button-portal-creator"
              >
                <Video className="w-5 h-5 mr-2" />
                Creator Portal
              </Button>
            </Link>
            <Link href="/brand">
              <Button 
                variant="outline" 
                className="w-full border-[#677A67]/50 text-white hover:bg-[#677A67]/20 rounded-lg py-6"
                data-testid="button-portal-brand"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Brand Portal
              </Button>
            </Link>
            <Link href="/affiliate">
              <Button 
                variant="outline" 
                className="w-full border-[#677A67]/50 text-white hover:bg-[#677A67]/20 rounded-lg py-6"
                data-testid="button-portal-affiliate"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Affiliate Portal
              </Button>
            </Link>
          </div>
          
          <p className="text-white/40 text-xs text-center">
            2024 MTERLIZD. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
