import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, CheckCircle, Clock, Zap, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { BrandSubscription } from "@shared/schema";

// ─── Plan catalogue ───────────────────────────────────────────────────────────
const PLAN_DETAILS: Record<string, { label: string; price: string; features: string[] }> = {
  starter: {
    label: "Starter",
    price: "€249 / month",
    features: [
      "Up to 10 videos",
      "30 minutes data storage included",
      "5 active campaigns",
      "Basic analytics",
      "Email support",
    ],
  },
  pro: {
    label: "Pro",
    price: "€499 / month",
    features: [
      "Unlimited videos",
      "Unlimited data storage",
      "Unlimited campaigns",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
  },
  enterprise: {
    label: "Enterprise",
    price: "Custom",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
};

// Surplus pricing constants
const RATE_PER_VIEW   = 0.05;  // €0.05 per view
const RATE_PER_MINUTE = 0.15;  // €0.15 per minute consumed

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active:    { label: "Active",    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    trialing:  { label: "Trialing",  className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  };
  const s = map[status] ?? map["active"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function fmt(n: number) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BrandSettingsSubscription() {
  const { data: sub, isLoading } = useQuery<BrandSubscription | null>({
    queryKey: ["/api/brand/subscription"],
  });

  // Surplus calculator state
  const [views,      setViews]      = useState(5000);
  const [minutes,    setMinutes]    = useState(60);
  const [publishers, setPublishers] = useState(3);

  const viewsCost   = views   * RATE_PER_VIEW   * publishers;
  const minutesCost = minutes * RATE_PER_MINUTE * publishers;
  const totalSurplus = viewsCost + minutesCost;

  const plan = PLAN_DETAILS[sub?.plan ?? "starter"] ?? PLAN_DETAILS.starter;

  return (
    <div className="space-y-6 max-w-2xl pb-12">
      <div className="flex items-center gap-3">
        <Link href="/brand/settings">
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back-settings">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground text-sm">Your current plan and renewal details</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{plan.label} Plan</CardTitle>
                <p className="text-2xl font-bold mt-1">{plan.price}</p>
              </div>
              <StatusBadge status={sub?.status ?? "active"} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Renewal dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Date Subscribed
                </p>
                <p className="font-medium" data-testid="text-subscribed-at">
                  {sub?.subscribedAt ? format(new Date(sub.subscribedAt), "d MMM yyyy") : "13 Mar 2026"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Next Renewal
                </p>
                <p className="font-medium" data-testid="text-period-end">
                  {sub?.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), "d MMM yyyy") : "13 Apr 2026"}
                </p>
              </div>
            </div>

            {/* Plan features */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Plan includes</p>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Surplus fee calculator ─────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Estimate overage charges</p>
              </div>
              <p className="text-xs text-muted-foreground -mt-3">
                Usage beyond your plan limits is billed at <strong>€0.05 / view</strong> and <strong>€0.15 / minute</strong>, multiplied by active publishers.
              </p>

              {/* Views slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground">Views</label>
                  <span className="text-xs tabular-nums font-semibold" data-testid="text-views-value">
                    {views.toLocaleString()} views
                  </span>
                </div>
                <Slider
                  min={0} max={100000} step={500}
                  value={[views]}
                  onValueChange={([v]) => setViews(v)}
                  data-testid="slider-views"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {views.toLocaleString()} × €{RATE_PER_VIEW.toFixed(2)} × {publishers} publishers
                  {" "}= <span className="font-semibold text-foreground">€{fmt(viewsCost)}</span>
                </p>
              </div>

              {/* Minutes slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground">Minutes consumed</label>
                  <span className="text-xs tabular-nums font-semibold" data-testid="text-minutes-value">
                    {minutes.toLocaleString()} min
                  </span>
                </div>
                <Slider
                  min={0} max={5000} step={10}
                  value={[minutes]}
                  onValueChange={([v]) => setMinutes(v)}
                  data-testid="slider-minutes"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {minutes.toLocaleString()} min × €{RATE_PER_MINUTE.toFixed(2)} × {publishers} publishers
                  {" "}= <span className="font-semibold text-foreground">€{fmt(minutesCost)}</span>
                </p>
              </div>

              {/* Publishers slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground">Active publishers</label>
                  <span className="text-xs tabular-nums font-semibold" data-testid="text-publishers-value">
                    {publishers} publisher{publishers !== 1 ? "s" : ""}
                  </span>
                </div>
                <Slider
                  min={1} max={50} step={1}
                  value={[publishers]}
                  onValueChange={([v]) => setPublishers(v)}
                  data-testid="slider-publishers"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-sm font-medium">Estimated overage</p>
                <p className="text-xl font-bold tabular-nums" data-testid="text-total-surplus">
                  €{fmt(totalSurplus)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/ mo</span>
                </p>
              </div>
            </div>
            {/* ──────────────────────────────────────────────────────────── */}

            <div className="flex gap-2">
              <Button className="rounded-full gap-2" data-testid="button-upgrade-plan">
                <Zap className="h-4 w-4" /> Upgrade Plan
              </Button>
              <Button variant="outline" className="rounded-full" data-testid="button-cancel-plan">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
