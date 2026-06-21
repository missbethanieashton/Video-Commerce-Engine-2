import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReferralsTable } from "@/components/ReferralsTable";
import { Send, CheckCircle, Clock, XCircle, Plus, ShoppingBag, Gift } from "lucide-react";
import { Link } from "wouter";
import type { BrandReferral } from "@shared/schema";

export default function Referrals() {
  const { data: referrals = [], isLoading } = useQuery<BrandReferral[]>({
    queryKey: ["/api/referrals"],
  });

  const statusCounts = {
    pending: referrals.filter((r) => r.status === "pending").length,
    sent: referrals.filter((r) => r.status === "sent").length,
    accepted: referrals.filter((r) => r.status === "accepted").length,
    declined: referrals.filter((r) => r.status === "declined").length,
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Connect with Brands</h1>
          <p className="text-muted-foreground mt-1">
            Refer your PR contact at a brand to enable the shoppable feature in your video uploads
          </p>
        </div>
        <Button className="rounded-full gap-2" data-testid="button-new-referral">
          <Plus className="h-4 w-4" />
          Connect a Brand
        </Button>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-primary/10 to-chart-2/10 border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Enable Shoppable Videos</h3>
              <p className="text-muted-foreground mt-1">
                Connect your PR contact at a brand to unlock the shoppable feature in your video uploads for that brand's products. When the brand subscribes to a paid plan, you receive a <strong>€49 credit</strong> — redeemable towards uploading your videos to the Global Video Library. Without a credit, listing costs €49 per video.
              </p>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2 bg-primary text-primary-foreground shrink-0">
              €49 Credit
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Get Discovered */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Get Discovered</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Upload your video to the Global Video Library to get reposted, and check in with your affiliate publishers to see how they're performing. Increase your presence, get noticed globally, and earn more from a broader consumer audience.
              </p>
              <Link href="/creator/library">
                <Button variant="outline" size="sm" className="rounded-full mt-3 gap-2" data-testid="button-go-to-library">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Browse Global Library
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-lg bg-yellow-500/10 flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.sent}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.accepted}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold">{statusCounts.declined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
      </div>

      <ReferralsTable referrals={referrals} isLoading={isLoading} />
    </div>
  );
}
