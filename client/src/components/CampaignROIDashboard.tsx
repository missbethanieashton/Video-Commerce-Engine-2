import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Percent, Activity } from "lucide-react";
import type { Campaign } from "@shared/schema";

interface CampaignROIDashboardProps {
  campaigns: Campaign[];
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpent: number;
    totalRevenue: number;
    averageROI: number;
  };
}

export function CampaignROIDashboard({ campaigns, stats }: CampaignROIDashboardProps) {
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const spendVsRevenueData = campaigns.map((c) => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
    spent: Number(c.spentAmount || 0),
    revenue: Number(c.actualRevenue || 0),
  }));

  const statusDistribution = [
    { name: "Active", value: campaigns.filter((c) => c.status === "active").length },
    { name: "Paused", value: campaigns.filter((c) => c.status === "paused").length },
    { name: "Draft", value: campaigns.filter((c) => c.status === "draft").length },
    { name: "Completed", value: campaigns.filter((c) => c.status === "completed").length },
  ].filter((s) => s.value > 0);

  const conversionFunnelData = campaigns.map((c) => ({
    name: c.name.length > 12 ? c.name.substring(0, 12) + "..." : c.name,
    views: c.actualViews || 0,
    clicks: c.actualClicks || 0,
    conversions: c.actualConversions || 0,
  }));

  const budgetUtilization = stats.totalBudget > 0 
    ? (stats.totalSpent / stats.totalBudget) * 100 
    : 0;

  const overallConversionRate = campaigns.reduce((acc, c) => {
    const clicks = c.actualClicks || 0;
    const conversions = c.actualConversions || 0;
    if (clicks > 0) {
      acc.totalClicks += clicks;
      acc.totalConversions += conversions;
    }
    return acc;
  }, { totalClicks: 0, totalConversions: 0 });

  const avgConversionRate = overallConversionRate.totalClicks > 0
    ? (overallConversionRate.totalConversions / overallConversionRate.totalClicks) * 100
    : 0;

  const costPerAcquisition = overallConversionRate.totalConversions > 0
    ? stats.totalSpent / overallConversionRate.totalConversions
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget Utilization</p>
                <p className="text-lg font-bold">{budgetUtilization.toFixed(1)}%</p>
              </div>
            </div>
            <Progress value={budgetUtilization} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stats.averageROI >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {stats.averageROI >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average ROI</p>
                <p className={`text-lg font-bold ${stats.averageROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.averageROI >= 0 ? '+' : ''}{stats.averageROI.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-lg font-bold">{avgConversionRate.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cost per Acquisition</p>
                <p className="text-lg font-bold">${costPerAcquisition.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Spend vs Revenue</CardTitle>
            <p className="text-xs text-muted-foreground">Compare campaign investment to returns</p>
          </CardHeader>
          <CardContent>
            {spendVsRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={spendVsRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }} 
                    className="fill-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    className="fill-muted-foreground"
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                  <Legend />
                  <Bar dataKey="spent" name="Spent" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No campaign data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Campaign Status</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution of campaign states</p>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={chartColors[index % chartColors.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No campaigns to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
          <p className="text-xs text-muted-foreground">Track performance across the funnel stages</p>
        </CardHeader>
        <CardContent>
          {conversionFunnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={conversionFunnelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  className="fill-muted-foreground"
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  className="fill-muted-foreground"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  name="Views"
                  stackId="1" 
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  name="Clicks"
                  stackId="2" 
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  name="Conversions"
                  stackId="3" 
                  stroke="hsl(var(--chart-3))" 
                  fill="hsl(var(--chart-3))" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Create campaigns to see funnel analytics</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
