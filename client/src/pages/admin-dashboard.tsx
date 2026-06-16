import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  Video,
  Library,
  TrendingUp,
  DollarSign,
  Globe,
  Ticket,
  BarChart2,
  LogOut,
  RefreshCw,
  Eye,
  MousePointer,
  ShoppingBag,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const TOKEN_KEY = "admin_dashboard_token";

// ─── Login Gate ──────────────────────────────────────────────────────────────

function LoginGate({ onAuth }: { onAuth: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: async (pw: string) => {
      const res = await apiRequest("POST", "/api/admin-dashboard/auth", { password: pw });
      if (!res.ok) throw new Error("Invalid password");
      return res.json();
    },
    onSuccess: (data) => {
      sessionStorage.setItem(TOKEN_KEY, data.token);
      onAuth(data.token);
    },
    onError: () => setError("Incorrect password. Try again."),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1010]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Materialized Internal</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "#1a1b1b", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && authMutation.mutate(password)}
            data-testid="input-admin-password"
            className="bg-[#252626] border-white/10 text-white placeholder:text-white/30 mb-3"
          />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <Button
            onClick={() => authMutation.mutate(password)}
            disabled={authMutation.isPending}
            data-testid="btn-admin-login"
            className="w-full bg-[#1351aa] hover:bg-[#1a63c9] text-white font-bold"
          >
            {authMutation.isPending ? "Checking…" : "Enter Dashboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon: Icon, color = "#1351aa" }: {
  title: string; value: string | number; sub?: string; icon: any; color?: string;
}) {
  return (
    <Card className="bg-[#1a1b1b] border-white/8 text-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">{title}</p>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
            <Icon size={16} style={{ color }} />
          </div>
        </div>
        <p className="text-3xl font-bold text-white">{value ?? "—"}</p>
        {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ stats }: { stats: any }) {
  const u = stats.userStats ?? {};
  const v = stats.videoStats ?? {};
  const g = stats.globalLibStats ?? {};
  const r = stats.referralStats ?? {};
  const e = stats.embedStats ?? {};
  const rev = stats.revenueStats ?? {};

  const roleData = [
    { name: "Creators", value: Number(u.creator_count ?? 0), color: "#1351aa" },
    { name: "Brands", value: Number(u.brand_count ?? 0), color: "#c8962a" },
    { name: "Affiliates", value: Number(u.affiliate_count ?? 0), color: "#16a34a" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={Number(u.total_users ?? 0).toLocaleString()} icon={Users} color="#1351aa" />
        <StatCard title="Total Videos" value={Number(v.total_videos ?? 0).toLocaleString()} sub={`${v.trial_videos ?? 0} trial`} icon={Video} color="#8b5cf6" />
        <StatCard title="Library Listings" value={Number(g.total_listed ?? 0)} icon={Library} color="#c8962a" />
        <StatCard title="Total Views" value={Number(v.total_views ?? 0).toLocaleString()} sub={`${Number(v.total_clicks ?? 0).toLocaleString()} clicks`} icon={Eye} color="#16a34a" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Brand Referrals" value={Number(r.total_referrals ?? 0)} sub={`${r.converted_referrals ?? 0} converted`} icon={TrendingUp} color="#ef4444" />
        <StatCard title="Embed Deployments" value={Number(e.total_embeds ?? 0)} sub={`${e.unique_domains ?? 0} domains`} icon={Globe} color="#06b6d4" />
        <StatCard title="Embed Loads" value={Number(e.total_embed_loads ?? 0).toLocaleString()} icon={MousePointer} color="#f59e0b" />
        <StatCard title="Total Revenue" value={`€${Number(rev.total_revenue ?? 0).toFixed(2)}`} sub={`Listing: €${Number(rev.listing_revenue ?? 0).toFixed(2)} · License: €${Number(rev.license_revenue ?? 0).toFixed(2)}`} icon={DollarSign} color="#16a34a" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1a1b1b] border-white/8 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white/70 uppercase tracking-widest">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {roleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#252626", border: "none", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1b1b] border-white/8 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white/70 uppercase tracking-widest">Top Videos by Views</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats.topVideosByViews ?? []).slice(0, 5).length === 0 ? (
              <p className="text-white/40 text-sm">No video data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(stats.topVideosByViews ?? []).slice(0, 5)} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="title" width={100} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#252626", border: "none", color: "#fff" }} />
                  <Bar dataKey="total_views" fill="#1351aa" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

function UsersTab({ stats }: { stats: any }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const users = (stats.allUsers ?? []).filter((u: any) => {
    const matchSearch = !search ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { creator: "#1351aa", brand: "#c8962a", affiliate: "#16a34a", publisher: "#16a34a" };
    return <Badge style={{ background: map[role] ?? "#555", color: "#fff", fontSize: 10 }}>{role}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-user-search"
          className="bg-[#1a1b1b] border-white/10 text-white placeholder:text-white/30 max-w-xs"
        />
        <div className="flex gap-2">
          {["all", "creator", "brand", "affiliate"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              data-testid={`btn-role-filter-${r}`}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: roleFilter === r ? "#1351aa" : "rgba(255,255,255,0.07)",
                color: roleFilter === r ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/8">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-white/50 text-xs">User</TableHead>
              <TableHead className="text-white/50 text-xs">Role</TableHead>
              <TableHead className="text-white/50 text-xs text-right">Videos</TableHead>
              <TableHead className="text-white/50 text-xs text-right">Views</TableHead>
              <TableHead className="text-white/50 text-xs text-right">Embeds</TableHead>
              <TableHead className="text-white/50 text-xs">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-white/30 text-center py-8">No users found.</TableCell>
              </TableRow>
            ) : users.map((u: any, i: number) => (
              <TableRow key={u.id ?? i} className="border-white/5 hover:bg-white/5" data-testid={`row-user-${u.id}`}>
                <TableCell>
                  <div>
                    <p className="text-white text-sm font-medium">{u.display_name || "—"}</p>
                    <p className="text-white/40 text-xs">{u.email}</p>
                  </div>
                </TableCell>
                <TableCell>{roleBadge(u.role)}</TableCell>
                <TableCell className="text-white/70 text-sm text-right">{u.video_count ?? 0}</TableCell>
                <TableCell className="text-white/70 text-sm text-right">{Number(u.total_views ?? 0).toLocaleString()}</TableCell>
                <TableCell className="text-white/70 text-sm text-right">{u.embed_count ?? 0}</TableCell>
                <TableCell className="text-white/40 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-white/30 text-xs">{users.length} user{users.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ─── Vouchers Tab ─────────────────────────────────────────────────────────────

function VouchersTab({ vouchers, voucherStats }: { vouchers: any[]; voucherStats: any[] }) {
  const [filter, setFilter] = useState<"all" | "vivatech" | "cannes">("all");
  const filtered = filter === "all" ? vouchers : vouchers.filter((v: any) => v.event === filter);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {(voucherStats ?? []).map((s: any, i: number) => (
          <Card key={i} className="bg-[#1a1b1b] border-white/8 text-white">
            <CardContent className="p-4">
              <p className="text-white/50 text-xs uppercase font-bold tracking-wider mb-1">{s.event}</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold">{s.claimed ?? 0}</p>
                  <p className="text-white/40 text-xs">Claimed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{s.redeemed ?? 0}</p>
                  <p className="text-white/40 text-xs">Redeemed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(["all", "vivatech", "cannes"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`btn-voucher-filter-${f}`}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f ? "#1351aa" : "rgba(255,255,255,0.07)",
              color: filter === f ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border border-white/8">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-white/50 text-xs">Code</TableHead>
              <TableHead className="text-white/50 text-xs">Event</TableHead>
              <TableHead className="text-white/50 text-xs">Name</TableHead>
              <TableHead className="text-white/50 text-xs">Email</TableHead>
              <TableHead className="text-white/50 text-xs">Status</TableHead>
              <TableHead className="text-white/50 text-xs">Claimed</TableHead>
              <TableHead className="text-white/50 text-xs">Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-white/30 text-center py-8">No vouchers yet.</TableCell>
              </TableRow>
            ) : filtered.map((v: any, i: number) => (
              <TableRow key={v.id ?? i} className="border-white/5 hover:bg-white/5" data-testid={`row-voucher-${v.id}`}>
                <TableCell className="font-mono text-xs text-white/80">{v.code}</TableCell>
                <TableCell>
                  <Badge style={{ background: v.event === "vivatech" ? "#1351aa" : "#c8962a", color: "#fff", fontSize: 10 }}>
                    {v.event}
                  </Badge>
                </TableCell>
                <TableCell className="text-white/70 text-sm">{v.first_name ?? v.firstName ?? "—"}</TableCell>
                <TableCell className="text-white/50 text-xs">{v.email}</TableCell>
                <TableCell>
                  {v.used_at || v.usedAt ? (
                    <Badge className="bg-green-700 text-white text-xs">Redeemed</Badge>
                  ) : new Date() > new Date(v.expires_at ?? v.expiresAt) ? (
                    <Badge className="bg-red-800 text-white text-xs">Expired</Badge>
                  ) : (
                    <Badge className="bg-blue-700 text-white text-xs">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-white/40 text-xs">
                  {(v.claimed_at ?? v.claimedAt) ? new Date(v.claimed_at ?? v.claimedAt).toLocaleDateString("en-GB") : "—"}
                </TableCell>
                <TableCell className="text-white/40 text-xs">
                  {(v.expires_at ?? v.expiresAt) ? new Date(v.expires_at ?? v.expiresAt).toLocaleDateString("en-GB") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-white/30 text-xs">{filtered.length} voucher{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin-dashboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin-dashboard/stats", {
        headers: { "x-dashboard-token": token ?? "" },
      });
      if (!res.ok) {
        if (res.status === 401) { setToken(null); sessionStorage.removeItem(TOKEN_KEY); }
        throw new Error("Failed to fetch stats");
      }
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 60_000,
  });

  const { data: vouchersData, refetch: refetchVouchers } = useQuery({
    queryKey: ["/api/admin-dashboard/vouchers"],
    queryFn: async () => {
      const res = await fetch("/api/admin-dashboard/vouchers", {
        headers: { "x-dashboard-token": token ?? "" },
      });
      if (!res.ok) throw new Error("Failed to fetch vouchers");
      return res.json();
    },
    enabled: !!token,
  });

  if (!token) return <LoginGate onAuth={setToken} />;

  return (
    <div className="min-h-screen bg-[#0f1010] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4" style={{ background: "#0f1010cc", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1351aa] flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-none">Materialized Admin</p>
            <p className="text-white/30 text-xs">Internal Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { refetch(); refetchVouchers(); }}
            disabled={isRefetching}
            data-testid="btn-refresh-stats"
            className="text-white/50 hover:text-white gap-2"
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(null); }}
            data-testid="btn-admin-logout"
            className="text-white/50 hover:text-white gap-2"
          >
            <LogOut size={14} />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <RefreshCw size={24} className="animate-spin text-[#1351aa]" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="mb-6 bg-[#1a1b1b] border border-white/8">
              <TabsTrigger value="overview" data-testid="tab-overview" className="data-[state=active]:bg-[#1351aa] data-[state=active]:text-white text-white/50">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users" className="data-[state=active]:bg-[#1351aa] data-[state=active]:text-white text-white/50">
                Users ({data?.allUsers?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="vouchers" data-testid="tab-vouchers" className="data-[state=active]:bg-[#1351aa] data-[state=active]:text-white text-white/50">
                Vouchers ({vouchersData?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {data ? <OverviewTab stats={data} /> : <p className="text-white/40">No data available.</p>}
            </TabsContent>

            <TabsContent value="users">
              {data ? <UsersTab stats={data} /> : <p className="text-white/40">No data available.</p>}
            </TabsContent>

            <TabsContent value="vouchers">
              <VouchersTab vouchers={vouchersData ?? []} voucherStats={data?.voucherStats ?? []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
