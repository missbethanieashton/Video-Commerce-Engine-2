import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Clock, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type EarningsData = {
  months: { label: string; earned: number; paid: number; upcoming: number }[];
  totalEarned: number;
  totalPaid: number;
  totalUpcoming: number;
  walletTokens: number;
};

export default function EarningsPage() {
  const { data, isLoading } = useQuery<EarningsData>({
    queryKey: ["/api/users/me/earnings"],
  });

  const stats = [
    {
      label: "Total Earned",
      value: `$${(data?.totalEarned ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Paid Out",
      value: `$${(data?.totalPaid ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      label: "Upcoming",
      value: `$${(data?.totalUpcoming ?? 0).toFixed(2)}`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Wallet Tokens",
      value: `${data?.walletTokens ?? 0}`,
      icon: Wallet,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your performance and payouts overview for the last 6 months.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("text-2xl font-bold mt-1", color)} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {value}
                    </p>
                  </div>
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                    <Icon className={cn("h-4 w-4", color)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (data?.months?.length ?? 0) === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No earnings data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.months} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="paid" name="Paid" fill="hsl(142 72% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="upcoming" name="Upcoming" fill="hsl(38 92% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Month cards — swipeable on mobile */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Monthly Breakdown</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="min-w-[200px] snap-start">
                  <Skeleton className="h-28 w-full rounded-xl" />
                </div>
              ))
            : (data?.months ?? []).slice().reverse().map((m, i) => (
                <Card key={i} className="min-w-[200px] snap-start shrink-0">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-2">{m.label}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Earned</span>
                        <span className="font-medium">${m.earned.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="font-medium text-green-600">${m.paid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Upcoming</span>
                        <span className="font-medium text-amber-600">${m.upcoming.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      {m.paid > 0 ? (
                        <Badge className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Paid</Badge>
                      ) : m.upcoming > 0 ? (
                        <Badge className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Upcoming</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">No earnings</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
        {!isLoading && (data?.months?.length ?? 0) > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">Swipe to see previous months</p>
        )}
      </div>

      {/* Payout note */}
      <Card className="bg-muted/40">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Payout schedule:</strong> Payouts are processed monthly and typically arrive within{" "}
            <strong className="text-foreground">3–7 business days</strong> once issued via Stripe. Upcoming amounts will update to Paid once the transfer is confirmed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
