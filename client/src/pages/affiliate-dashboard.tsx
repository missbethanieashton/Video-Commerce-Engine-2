import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import {
  DollarSign,
  TrendingUp,
  Video,
  MousePointer,
  ShoppingBag,
  Eye,
  ArrowRight,
  Gift,
  Globe,
  Zap,
  CreditCard,
} from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

type CampaignAffiliate = {
  id: string;
  videoId: string;
  affiliateUserId: string;
  utmCode: string;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: string;
  totalEarnings: string;
  status: string;
  createdAt: string;
};

type VideoLibraryItem = {
  id: string;
  videoId: string;
  creatorId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  listingFee: string;
  publishStatus: string;
  totalLicenses: number;
};

export default function AffiliateDashboard() {
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<CampaignAffiliate[]>({
    queryKey: ["/api/affiliates/campaigns"],
  });

  const { data: libraryItems = [] } = useQuery<VideoLibraryItem[]>({
    queryKey: ["/api/global-library"],
  });

  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalEarnings = campaigns.reduce((sum, c) => sum + parseFloat(c.totalEarnings || "0"), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.totalClicks || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.totalConversions || 0), 0);

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-welcome">
          Welcome back, {currentUser?.displayName || "Publisher"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Curate shoppable content, grow your audience, and earn affiliate commissions
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earnings"
          value={`€${totalEarnings.toFixed(2)}`}
          subtitle="Lifetime earnings"
          icon={DollarSign}
          trend={totalEarnings > 0 ? { value: 15, isPositive: true } : undefined}
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns.toString()}
          subtitle="Currently running"
          icon={Video}
        />
        <StatCard
          title="Total Clicks"
          value={totalClicks.toLocaleString()}
          subtitle="All campaigns"
          icon={MousePointer}
        />
        <StatCard
          title="Conversions"
          value={totalConversions.toString()}
          subtitle="Total sales"
          icon={TrendingUp}
        />
      </div>

      {/* Get Discovered banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-chart-2/10 border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Get Discovered</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Upload your video to the Global Video Library to get reposted, and check in with your affiliate publishers to see how they're performing. Increase your presence, get noticed globally, and earn more from a broader consumer audience.
              </p>
            </div>
            <Link href="/affiliate/library">
              <Button size="sm" className="rounded-full gap-2 shrink-0" data-testid="button-explore-library">
                <ShoppingBag className="h-4 w-4" />
                Explore Library
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Connect with Creators / Brands */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connect with Creators & Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Enable shoppable content — earn a €49 credit</p>
              <p className="text-xs text-muted-foreground mt-1">
                Refer your PR contact at a creator or brand to unlock the shoppable feature in video uploads for their products. When they subscribe to a paid plan, you receive a <strong>€49 credit</strong> towards listing a video in the Global Library. Without a credit, the listing fee is €49 per video.
              </p>
            </div>
            <Link href="/affiliate/wishlist">
              <Button variant="outline" size="sm" className="rounded-full shrink-0 gap-2" data-testid="button-view-wishlist">
                <Eye className="h-3.5 w-3.5" />
                Creator Wishlist
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns + Available Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">My Campaigns</CardTitle>
            <Link href="/affiliate/campaigns">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-campaigns">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No active campaigns yet</p>
                <Link href="/affiliate/library">
                  <Button data-testid="button-browse-library">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Video Library
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.slice(0, 3).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`campaign-item-${campaign.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Campaign #{campaign.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.totalClicks} clicks · {campaign.totalConversions} conversions
                        </p>
                      </div>
                    </div>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Available Videos</CardTitle>
            <Link href="/affiliate/library">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-browse-library">
                Browse All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {libraryItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No videos available in the library yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {libraryItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`library-item-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Video className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          €{item.listingFee} · {item.totalLicenses} licensed
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/affiliate/library">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="action-browse-videos">
                <ShoppingBag className="h-5 w-5" />
                <span>Browse Videos</span>
              </Button>
            </Link>
            <Link href="/affiliate/campaigns">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="action-manage-campaigns">
                <Video className="h-5 w-5" />
                <span>Campaigns</span>
              </Button>
            </Link>
            <Link href="/affiliate/settings/subscription">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="action-subscription">
                <Zap className="h-5 w-5" />
                <span>Subscription</span>
              </Button>
            </Link>
            <Link href="/affiliate/settings">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="action-payout-settings">
                <CreditCard className="h-5 w-5" />
                <span>Payout Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
