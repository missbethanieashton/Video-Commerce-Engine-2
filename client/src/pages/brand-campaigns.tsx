import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, differenceInDays, addDays } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, ChevronRight, Video, TrendingUp, Users, DollarSign, RefreshCw } from "lucide-react";
import type { Campaign } from "@shared/schema";

const CAMPAIGN_TOTAL_DAYS = 60;

function daysRemaining(campaign: Campaign): number {
  if (!campaign.startDate) return CAMPAIGN_TOTAL_DAYS;
  const totalDays = (campaign as any).totalDays ?? CAMPAIGN_TOTAL_DAYS;
  const end = addDays(new Date(campaign.startDate), totalDays);
  return Math.max(0, differenceInDays(end, new Date()));
}

function affiliateFees(campaign: Campaign): number {
  return parseFloat((campaign as any).affiliateFeesDue ?? campaign.spentAmount ?? "0");
}

function netValue(campaign: Campaign): number {
  return parseFloat(campaign.actualRevenue ?? "0") - affiliateFees(campaign);
}

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const rem = daysRemaining(campaign);
  const total = (campaign as any).totalDays ?? CAMPAIGN_TOTAL_DAYS;
  const pct = Math.max(0, Math.min(100, ((total - rem) / total) * 100));
  const isExpired = campaign.status === "completed" || campaign.status === "cancelled" || rem === 0;
  const gross = parseFloat(campaign.actualRevenue ?? "0");
  const fees = affiliateFees(campaign);
  const net = gross - fees;

  return (
    <div
      data-testid={`card-campaign-${campaign.id}`}
      onClick={onClick}
      className="bg-[#1a1c1b] border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-[#677A67]/60 hover:bg-[#1e201f] transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#677A67]/20 flex items-center justify-center shrink-0">
            <Video size={18} className="text-[#677A67]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{campaign.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {campaign.startDate
                ? `Launched ${format(new Date(campaign.startDate), "d MMM yyyy")}`
                : "Not started"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`text-[10px] px-2 py-0.5 rounded-full border-0 font-medium ${
              isExpired ? "bg-white/10 text-white/50" : "bg-[#677A67]/20 text-[#677A67]"
            }`}
          >
            {isExpired ? "Expired" : "Active"}
          </Badge>
          <ChevronRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
        </div>
      </div>

      {/* Days progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-white/40">Day {total - rem} of {total}</span>
          <span className="text-[11px] font-medium text-white/70">
            {rem > 0 ? `${rem} days remaining` : "Ended"}
          </span>
        </div>
        <Progress
          value={pct}
          className="h-1.5 bg-white/10"
          data-testid={`progress-campaign-${campaign.id}`}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <RefreshCw size={12} className="text-white/30 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-white">{(campaign as any).repostCount ?? 0}</div>
            <div className="text-[10px] text-white/40">Reposts</div>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <TrendingUp size={12} className="text-white/30 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-white">{campaign.actualConversions ?? 0}</div>
            <div className="text-[10px] text-white/40">Units Sold</div>
          </div>
        </div>
      </div>

      {/* Financial triptych */}
      <div className="border-t border-white/8 pt-3 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-semibold text-white/80">€{gross.toFixed(2)}</span>
          <span className="text-[10px] text-white/35 mt-0.5">Gross Value</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-semibold text-red-400">€{fees.toFixed(2)}</span>
          <span className="text-[10px] text-white/35 mt-0.5">Affiliate Fees</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-semibold text-emerald-400">€{Math.abs(net).toFixed(2)}</span>
          <span className="text-[10px] text-white/35 mt-0.5">Net Earned</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Play size={24} className="text-white/20" />
      </div>
      <p className="text-white/40 text-sm">{label}</p>
    </div>
  );
}

export default function BrandCampaigns() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"active" | "expired">("active");

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const active = campaigns.filter(
    (c) => c.status === "active" || c.status === "paused" || c.status === "draft"
  );
  const expired = campaigns.filter(
    (c) => c.status === "completed" || c.status === "cancelled"
  );
  const totalNet = campaigns.reduce((s, c) => s + netValue(c), 0);

  return (
    <div className="min-h-screen bg-[#111211] text-white">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <Button
            data-testid="button-new-campaign"
            size="sm"
            onClick={() => navigate("/brand/campaigns/new")}
            className="bg-[#677A67] hover:bg-[#5a6b5a] text-white text-xs px-4 h-8 rounded-full"
          >
            + New
          </Button>
        </div>
        <p className="text-sm text-white/40">Video-linked campaigns with publisher performance</p>
      </div>

      {/* Summary strip */}
      {!isLoading && (
        <div className="px-5 mb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/8 rounded-2xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-white/40">
                <Play size={14} />
                <span className="text-[10px]">Active</span>
              </div>
              <span className="text-lg font-bold text-white">{active.length}</span>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-white/40">
                <Users size={14} />
                <span className="text-[10px]">Total</span>
              </div>
              <span className="text-lg font-bold text-white">{campaigns.length}</span>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-white/40">
                <DollarSign size={14} />
                <span className="text-[10px]">Net Earned</span>
              </div>
              <span className="text-lg font-bold text-white">€{totalNet.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "expired")} className="px-5">
        <TabsList
          className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-5 w-full h-10"
          data-testid="tabs-campaign-status"
        >
          <TabsTrigger
            value="active"
            data-testid="tab-active"
            className="flex-1 rounded-xl text-xs data-[state=active]:bg-[#677A67] data-[state=active]:text-white text-white/50 transition-all"
          >
            Active <span className="ml-1.5 opacity-60">({active.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="expired"
            data-testid="tab-expired"
            className="flex-1 rounded-xl text-xs data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 transition-all"
          >
            Expired <span className="ml-1.5 opacity-60">({expired.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-52 rounded-2xl bg-white/5" />
              <Skeleton className="h-52 rounded-2xl bg-white/5" />
            </>
          ) : active.length === 0 ? (
            <EmptyState label="No active campaigns yet. Launch one to get started." />
          ) : (
            active.map((c) => (
              <CampaignCard key={c.id} campaign={c} onClick={() => navigate(`/brand/campaigns/${c.id}`)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-52 rounded-2xl bg-white/5" />
          ) : expired.length === 0 ? (
            <EmptyState label="No expired campaigns yet." />
          ) : (
            expired.map((c) => (
              <CampaignCard key={c.id} campaign={c} onClick={() => navigate(`/brand/campaigns/${c.id}`)} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <div className="h-24" />
    </div>
  );
}
