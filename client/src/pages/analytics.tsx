import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { AffiliateTable } from "@/components/AffiliateTable";
import {
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
} from "lucide-react";
import type { Video } from "@shared/schema";

export default function Analytics() {
  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: stats } = useQuery<{
    totalViews: number;
    totalClicks: number;
    totalRevenue: number;
    averageCTR: number;
    topCountries: { country: string; views: number }[];
    deviceBreakdown: { device: string; percentage: number }[];
  }>({
    queryKey: ["/api/analytics/detailed"],
  });

  const defaultStats = {
    totalViews: 0,
    totalClicks: 0,
    totalRevenue: 0,
    averageCTR: 0,
    topCountries: [],
    deviceBreakdown: [
      { device: "Mobile", percentage: 62 },
      { device: "Desktop", percentage: 31 },
      { device: "Tablet", percentage: 7 },
    ],
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your video performance and revenue metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={currentStats.totalViews.toLocaleString()}
          subtitle="All-time video views"
          icon={Eye}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Total Clicks"
          value={currentStats.totalClicks.toLocaleString()}
          subtitle="Product interactions"
          icon={MousePointer}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Revenue"
          value={`$${currentStats.totalRevenue.toFixed(2)}`}
          subtitle="Total earnings"
          icon={DollarSign}
          trend={{ value: 23.1, isPositive: true }}
        />
        <StatCard
          title="Avg. CTR"
          value={`${currentStats.averageCTR.toFixed(2)}%`}
          subtitle="Click-through rate"
          icon={TrendingUp}
          trend={{ value: 4.3, isPositive: true }}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">By Video</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Chart visualization will appear here</p>
                  <p className="text-sm">Upload videos to start tracking performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <AffiliateTable videos={videos} isLoading={videosLoading} />
        </TabsContent>

        <TabsContent value="videos">
          <AffiliateTable videos={videos} isLoading={videosLoading} />
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStats.topCountries.length > 0 ? (
                <div className="space-y-4">
                  {currentStats.topCountries.map((country, i) => (
                    <div key={country.country} className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{country.country}</span>
                          <span className="text-sm text-muted-foreground">
                            {country.views.toLocaleString()} views
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(country.views / currentStats.topCountries[0].views) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No geographic data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentStats.deviceBreakdown.map((device) => {
              const Icon = device.device === "Mobile" 
                ? Smartphone 
                : device.device === "Desktop" 
                ? Monitor 
                : Smartphone;
              return (
                <Card key={device.device}>
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">{device.percentage}%</p>
                    <p className="text-muted-foreground mt-1">{device.device}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
