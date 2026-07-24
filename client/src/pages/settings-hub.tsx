import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useCurrentUser, useLogout } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import {
  User, Lock, Shield, Bell, CreditCard, Wallet, Receipt, Building2,
  BarChart3, HelpCircle, UserPlus, LogOut, KeyRound,
  MessageCircle, ChevronRight, CheckCircle2, AlertCircle, ExternalLink,
  Save, Eye, EyeOff, Copy, Plus, Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest as fetchApi } from "@/lib/queryClient";
import type { BrandApiKey } from "@shared/schema";

type Section =
  | "personal-info"
  | "login-security"
  | "privacy"
  | "notifications"
  | "payment-method"
  | "your-payments"
  | "wallet"
  | "payout-method"
  | "transaction-history"
  | "api-keys"
  | "get-help"
  | "create-profile";

const NAV_ITEMS: { section: Section; label: string; icon: React.ElementType; group: string; brandOnly?: boolean }[] = [
  { section: "personal-info", label: "Personal Information", icon: User, group: "Account" },
  { section: "login-security", label: "Login & Security", icon: Lock, group: "Account" },
  { section: "privacy", label: "Privacy", icon: Shield, group: "Account" },
  { section: "notifications", label: "Notifications", icon: Bell, group: "Account" },
  { section: "payment-method", label: "Payment Method", icon: CreditCard, group: "Payments" },
  { section: "your-payments", label: "Your Payments", icon: Receipt, group: "Payments" },
  { section: "wallet", label: "Wallet", icon: Wallet, group: "Payments" },
  { section: "payout-method", label: "Payout Method", icon: Building2, group: "Payments" },
  { section: "transaction-history", label: "Transaction History", icon: BarChart3, group: "Payments" },
  { section: "api-keys", label: "API Keys", icon: KeyRound, group: "Brand", brandOnly: true },
  { section: "get-help", label: "Get Help", icon: HelpCircle, group: "Support" },
  { section: "create-profile", label: "Create a New Profile", icon: UserPlus, group: "Support" },
];

const personalInfoSchema = z.object({
  legalName: z.string().optional(),
  preferredFirstName: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email("Valid email required").optional(),
  mailingAddress: z.string().optional(),
  countryOrigin: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(3, "Min 3 characters").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Min 8 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine(d => !d.newPassword || d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SettingsHub() {
  const [activeSection, setActiveSection] = useState<Section>("personal-info");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [location] = useLocation();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const isBrand = location.startsWith("/brand") || user?.role === "brand";

  const visibleItems = NAV_ITEMS.filter(i => !i.brandOnly || isBrand);

  const groups = Array.from(new Set(visibleItems.map(i => i.group)));

  const activeItem = visibleItems.find(i => i.section === activeSection);

  return (
    <div className="flex h-full min-h-screen">
      {/* Left nav — desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-muted/20 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <nav className="flex-1 p-2 space-y-4">
          {groups.map(group => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">{group}</p>
              {visibleItems.filter(i => i.group === group).map(item => {
                const Icon = item.icon;
                const active = activeSection === item.section;
                return (
                  <button
                    key={item.section}
                    onClick={() => setActiveSection(item.section)}
                    data-testid={`settings-nav-${item.section}`}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            data-testid="button-settings-logout"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile section picker */}
        <div className="md:hidden sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeItem && <activeItem.icon className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium text-sm">{activeItem?.label}</span>
          </div>
          <button
            onClick={() => setMobileNavOpen(o => !o)}
            className="flex items-center gap-1 text-xs text-primary"
            data-testid="button-settings-mobile-nav"
          >
            Change <ChevronRight className={cn("h-3 w-3 transition-transform", mobileNavOpen && "rotate-90")} />
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden bg-background border-b border-border shadow-lg">
            <nav className="p-3 space-y-3">
              {groups.map(group => (
                <div key={group}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">{group}</p>
                  {visibleItems.filter(i => i.group === group).map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.section}
                        onClick={() => { setActiveSection(item.section); setMobileNavOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors",
                          activeSection === item.section ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
              <Separator />
              <button
                onClick={() => logoutMutation.mutate()}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          {activeSection === "personal-info" && <PersonalInfoSection />}
          {activeSection === "login-security" && <LoginSecuritySection />}
          {activeSection === "privacy" && <PrivacySection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "payment-method" && <PaymentMethodSection />}
          {activeSection === "your-payments" && <YourPaymentsSection />}
          {activeSection === "wallet" && <WalletSection />}
          {activeSection === "payout-method" && <PayoutMethodSection />}
          {activeSection === "transaction-history" && <TransactionHistorySection />}
          {activeSection === "api-keys" && isBrand && <ApiKeysSection />}
          {activeSection === "get-help" && <GetHelpSection />}
          {activeSection === "create-profile" && <CreateProfileSection />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function PersonalInfoSection() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery<any>({ queryKey: ["/api/users/me/profile"] });
  const { data: user } = useCurrentUser();

  const form = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    values: {
      legalName: profile?.legalName ?? "",
      preferredFirstName: profile?.preferredFirstName ?? "",
      phoneNumber: profile?.phoneNumber ?? "",
      email: user?.email ?? "",
      mailingAddress: profile?.mailingAddress ?? "",
      countryOrigin: profile?.countryOrigin ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof personalInfoSchema>) => {
      const res = await apiRequest("PATCH", "/api/users/me/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/profile"] });
      toast({ title: "Saved", description: "Personal information updated." });
    },
    onError: () => toast({ title: "Error", description: "Could not save.", variant: "destructive" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div>
      <SectionHeader title="Personal Information" description="Update your legal and contact details. This information is kept private." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="legalName" render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Name</FormLabel>
                <FormControl><Input {...field} placeholder="Full legal name" data-testid="input-legal-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="preferredFirstName" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred First Name</FormLabel>
                <FormControl><Input {...field} placeholder="What we call you" data-testid="input-preferred-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input {...field} placeholder="+1 555 000 0000" data-testid="input-phone" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input value={user?.email ?? ""} disabled className="bg-muted" data-testid="input-email-readonly" />
              <p className="text-xs text-muted-foreground mt-1">Contact support to change your email.</p>
            </FormItem>
          </div>
          <FormField control={form.control} name="mailingAddress" render={({ field }) => (
            <FormItem>
              <FormLabel>Mailing Address</FormLabel>
              <FormControl><Input {...field} placeholder="Street, City, Postcode" data-testid="input-mailing-address" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="countryOrigin" render={({ field }) => (
            <FormItem>
              <FormLabel>Country of Origin</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. France" data-testid="input-country-origin" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" disabled={mutation.isPending} data-testid="button-save-personal-info">
            <Save className="h-4 w-4 mr-2" />
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function LoginSecuritySection() {
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", currentPassword: "", newPassword: "", confirmPassword: "" },
    values: { username: user?.username ?? "", currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const usernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("PATCH", "/api/users/me", { username });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({ title: "Username updated" });
    },
    onError: () => toast({ title: "Error", description: "Could not update username.", variant: "destructive" }),
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed" });
      form.reset({ ...form.getValues(), currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: () => toast({ title: "Error", description: "Could not change password.", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Login & Security" description="Manage your username, password, and account access." />

      <Card>
        <CardHeader><CardTitle className="text-base">Username</CardTitle><CardDescription>This is your public @handle on the platform.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={form.watch("username")}
              onChange={e => form.setValue("username", e.target.value)}
              placeholder="@username"
              data-testid="input-username"
            />
            <Button
              onClick={() => usernameMutation.mutate(form.getValues("username") ?? "")}
              disabled={usernameMutation.isPending}
              data-testid="button-save-username"
            >
              {usernameMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <Input
              type="password"
              {...form.register("currentPassword")}
              placeholder="••••••••"
              data-testid="input-current-password"
            />
          </div>
          <div>
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                {...form.register("newPassword")}
                placeholder="Min 8 characters"
                data-testid="input-new-password"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                {...form.register("confirmPassword")}
                placeholder="Repeat new password"
                data-testid="input-confirm-password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            onClick={() => {
              const vals = form.getValues();
              if (vals.currentPassword && vals.newPassword) {
                passwordMutation.mutate({ currentPassword: vals.currentPassword, newPassword: vals.newPassword });
              }
            }}
            disabled={passwordMutation.isPending}
            data-testid="button-change-password"
          >
            {passwordMutation.isPending ? "Changing…" : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Deactivating your account will cancel your subscription and remove your access.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" data-testid="button-deactivate-account">
            Deactivate Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacySection() {
  const { toast } = useToast();
  const { data: prefs, isLoading } = useQuery<any>({ queryKey: ["/api/users/me/preferences"] });

  const privacy = prefs?.privacy ?? {};

  const updateMutation = useMutation({
    mutationFn: async (update: { privacy: Record<string, boolean> }) => {
      const res = await apiRequest("PATCH", "/api/users/me/preferences", update);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/preferences"] });
      toast({ title: "Privacy settings saved" });
    },
  });

  const toggle = (key: string, value: boolean) => {
    updateMutation.mutate({ privacy: { ...privacy, [key]: value } });
  };

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <div>
      <SectionHeader title="Privacy" description="Control who can see your profile and contact you." />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {[
            { key: "messagingEnabled", label: "Messaging", desc: "Allow other users to send you messages" },
            { key: "profileDiscovery", label: "Enable Profile Discovery", desc: "Allow your profile to appear in search results and recommendations" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={privacy[key] !== false}
                onCheckedChange={v => toggle(key, v)}
                data-testid={`toggle-privacy-${key}`}
                disabled={updateMutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const { toast } = useToast();
  const { data: prefs, isLoading } = useQuery<any>({ queryKey: ["/api/users/me/preferences"] });

  const notifications = prefs?.notifications ?? {};

  const updateMutation = useMutation({
    mutationFn: async (update: { notifications: Record<string, boolean> }) => {
      const res = await apiRequest("PATCH", "/api/users/me/preferences", update);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/preferences"] });
      toast({ title: "Notification settings saved" });
    },
  });

  const toggle = (key: string, value: boolean) => {
    updateMutation.mutate({ notifications: { ...notifications, [key]: value } });
  };

  const items = [
    { key: "insightsTips", label: "Insights & Tips", desc: "Platform tips and performance insights" },
    { key: "referralSuccess", label: "Referral Success", desc: "Notified when a brand you referred subscribes" },
    { key: "rewardUpdates", label: "Reward Updates", desc: "Token earnings and wallet updates" },
    { key: "recognitionsAchievements", label: "Recognitions & Achievements", desc: "Milestone and achievement alerts" },
    { key: "accountReminders", label: "Account Reminders", desc: "Billing, renewal, and important account notices (includes mobile push when enabled)" },
  ];

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div>
      <SectionHeader title="Notifications" description="Choose what you'd like to be notified about. Mobile push notifications are sent when a toggle is on." />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {items.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={notifications[key] !== false}
                onCheckedChange={v => toggle(key, v)}
                data-testid={`toggle-notif-${key}`}
                disabled={updateMutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentMethodSection() {
  const { data: user } = useCurrentUser();
  const { toast } = useToast();

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal");
      return res.json();
    },
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: () => toast({ title: "Error", description: "Could not open payment portal.", variant: "destructive" }),
  });

  return (
    <div>
      <SectionHeader title="Payment Method" description="Add and manage your payment method using our secure payment system." />
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
            <CreditCard className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium text-sm">Secure Payment via Stripe</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your payment information is encrypted and managed securely through Stripe. MTRLZD never stores your card details.
              </p>
            </div>
          </div>
          <Button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            data-testid="button-add-payment-method"
            className="w-full sm:w-auto"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {portalMutation.isPending ? "Opening…" : "Add Payment Method"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function YourPaymentsSection() {
  const { data: payments, isLoading } = useQuery<any[]>({ queryKey: ["/api/payments/history"] });

  const empty = !isLoading && (!payments || payments.length === 0);

  return (
    <div>
      <SectionHeader title="Your Payments" description="Completed payments for your subscription, library imports, and overages." />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : empty ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No payments yet</p>
          ) : (
            payments!.map((p: any, i: number) => (
              <div key={i} className={cn("flex items-center justify-between px-4 py-3.5", i !== payments!.length - 1 && "border-b border-border")}>
                <div>
                  <p className="text-sm font-medium">{p.description || "Payment"}</p>
                  <p className="text-xs text-muted-foreground">{p.date || ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">€{p.amount || "0.00"}</p>
                  <Badge variant="secondary" className="text-[10px]">{p.status || "Completed"}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WalletSection() {
  const { data: wallet, isLoading } = useQuery<{ tokens: number; tokenValueEur: number }>({
    queryKey: ["/api/users/me/wallet"],
  });

  return (
    <div>
      <SectionHeader title="Wallet" description="Tokens are earned when brands you refer successfully subscribe. Each token is worth €49 and can be used for subscription payments or Global Video Library imports." />
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            {isLoading ? <Skeleton className="h-16 w-full" /> : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Current Balance</p>
                  <p className="text-4xl font-bold mt-1" data-testid="text-wallet-tokens">{wallet?.tokens ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Token{(wallet?.tokens ?? 0) !== 1 ? "s" : ""} · €{((wallet?.tokens ?? 0) * (wallet?.tokenValueEur ?? 49)).toFixed(0)} value
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">How to earn tokens</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Earn <strong className="text-foreground">1 Token</strong> for every Brand you refer who successfully subscribes to MTRLZD</p>
            <p>• Each token is worth <strong className="text-foreground">€49</strong></p>
            <p>• Tokens can be redeemed when importing campaigns to the Global Video Library or applied to your monthly subscription</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PayoutMethodSection() {
  const { toast } = useToast();
  const { data: stripeStatus, isLoading } = useQuery<{ connected: boolean; onboarded: boolean; accountId?: string }>({
    queryKey: ["/api/stripe/connect/status"],
  });

  const createConnectMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/stripe/connect/create"); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stripe/connect/status"] }); toast({ title: "Account created", description: "Complete onboarding to activate payouts." }); },
    onError: () => toast({ title: "Error", description: "Could not create payout account.", variant: "destructive" }),
  });

  const onboardMutation = useMutation({
    mutationFn: async () => { const res = await apiRequest("POST", "/api/stripe/connect/onboarding"); return res.json(); },
    onSuccess: (data) => { if (data.url) window.open(data.url, "_blank"); },
    onError: () => toast({ title: "Error", description: "Could not start onboarding.", variant: "destructive" }),
  });

  return (
    <div>
      <SectionHeader title="Payout Method" description="You can send your affiliate commission payouts to one or more payout methods. Bank accounts may be added via Stripe." />
      <Card>
        <CardContent className="p-6 space-y-4">
          {isLoading ? <Skeleton className="h-24 w-full" /> :
            !stripeStatus?.connected ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                  <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Connect Your Bank Account</p>
                    <p className="text-xs text-muted-foreground mt-1">Set up payouts through Stripe to receive your affiliate commissions automatically. This is a one-time setup.</p>
                  </div>
                </div>
                <Button onClick={() => createConnectMutation.mutate()} disabled={createConnectMutation.isPending} data-testid="button-setup-payout">
                  {createConnectMutation.isPending ? "Setting up…" : "Set Up Payout Account"}
                </Button>
              </>
            ) : !stripeStatus?.onboarded ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Onboarding Incomplete</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Complete identity verification and add your bank details to activate payouts.</p>
                  </div>
                </div>
                <Button onClick={() => onboardMutation.mutate()} disabled={onboardMutation.isPending} data-testid="button-complete-onboarding">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {onboardMutation.isPending ? "Loading…" : "Complete Onboarding"}
                </Button>
              </>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium text-sm text-green-800 dark:text-green-200">Payouts Active</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">Your bank account is connected. Payouts are typically received within 3–7 business days of processing.</p>
                  <code className="text-xs mt-2 block text-muted-foreground">{stripeStatus.accountId}</code>
                </div>
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionHistorySection() {
  const { data: earnings, isLoading } = useQuery<{
    months: { label: string; earned: number; paid: number; upcoming: number }[];
    totalEarned: number;
    totalPaid: number;
    totalUpcoming: number;
  }>({ queryKey: ["/api/users/me/earnings"] });

  const months = earnings?.months ?? [];

  return (
    <div>
      <SectionHeader title="Transaction History" description="Monthly performance overview. Upcoming payouts typically arrive 3–7 business days after processing." />
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Earned", value: earnings?.totalEarned ?? 0, color: "text-foreground" },
            { label: "Paid", value: earnings?.totalPaid ?? 0, color: "text-green-600" },
            { label: "Upcoming", value: earnings?.totalUpcoming ?? 0, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-lg font-bold mt-0.5", color)}>${value.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          {isLoading ? (
            [1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : months.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No transaction data yet</p>
          ) : (
            months.map((m, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{m.label}</p>
                    <p className="text-xs text-muted-foreground">Earned: ${m.earned.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-3 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-sm font-semibold text-green-600">${m.paid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                      <p className="text-sm font-semibold text-amber-600">${m.upcoming.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedRawKey, setRevealedRawKey] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: keys = [], isLoading } = useQuery<BrandApiKey[]>({ queryKey: ["/api/brand/api-keys"] });

  const createMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/brand/api-keys", { name }),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/brand/api-keys"] });
      setRevealedRawKey(data.rawKey);
      setShowRaw(true);
      setNewKeyName("");
      toast({ title: "API key created", description: "Copy it now — it won't be shown again." });
    },
    onError: () => toast({ title: "Error", description: "Could not create API key.", variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/brand/api-keys/${id}`, undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/brand/api-keys"] }); toast({ title: "Key revoked" }); },
    onError: () => toast({ title: "Error", description: "Could not revoke key.", variant: "destructive" }),
  });

  const handleCopy = () => {
    if (!revealedRawKey) return;
    navigator.clipboard.writeText(revealedRawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <SectionHeader title="API Keys" description="Manage API keys to sync your product inventory with external platforms." />
      <div className="space-y-4">
        {revealedRawKey && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Key created — copy it now, it won't be shown again
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={showRaw ? revealedRawKey : "•".repeat(revealedRawKey.length)} className="font-mono text-xs" data-testid="input-raw-api-key" />
                <Button variant="ghost" size="icon" onClick={() => setShowRaw(s => !s)}>
                  {showRaw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCopy} data-testid="button-copy-api-key">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Create New Key</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Key name (e.g. Production)"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              data-testid="input-api-key-name"
            />
            <Button
              disabled={!newKeyName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(newKeyName.trim())}
              data-testid="button-create-api-key"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Creating…" : "Generate Key"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><KeyRound className="h-4 w-4" /> Active Keys</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : keys.filter(k => k.isActive).length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No active keys</p>
            ) : keys.filter(k => k.isActive).map((k, i, arr) => (
              <div key={k.id} className={cn("flex items-center gap-3 px-4 py-3", i !== arr.length - 1 && "border-b border-border")} data-testid={`row-api-key-${k.id}`}>
                <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{k.keyPrefix}••••••••••••</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => revokeMutation.mutate(k.id)} disabled={revokeMutation.isPending} data-testid={`button-revoke-key-${k.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GetHelpSection() {
  return (
    <div>
      <SectionHeader title="Get Help" description="Reach out to our team — we're here to support you." />
      <div className="space-y-3">
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            <a
              href="https://wa.me/33751305919"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-whatsapp-help"
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">WhatsApp Chat</p>
                <p className="text-xs text-muted-foreground">Chat with our team directly</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <a
              href={`mailto:?subject=MTRLZD Feedback&body=Hi MTRLZD team,`}
              onClick={e => {
                e.preventDefault();
                window.location.href = `mailto:contact@one30m.co?subject=MTRLZD Feedback`;
              }}
              data-testid="link-feedback"
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Give us feedback</p>
                <p className="text-xs text-muted-foreground">Share your thoughts and suggestions</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreateProfileSection() {
  const [, navigate] = useLocation();

  return (
    <div>
      <SectionHeader title="Create a New Profile" description="Start fresh with a new account type alongside your existing profile." />
      <div className="space-y-3">
        {[
          { role: "Creator", desc: "Upload videos, tag products, and earn affiliate commissions", href: "/register?role=creator", color: "bg-primary/10 text-primary" },
          { role: "Brand", desc: "Connect with creators, manage campaigns, and grow your reach", href: "/register?role=brand", color: "bg-chart-2/10 text-chart-2" },
          { role: "Publisher", desc: "License videos, build campaigns, and earn as an affiliate", href: "/register?role=publisher", color: "bg-purple-500/10 text-purple-600" },
        ].map(({ role, desc, href, color }) => (
          <Card
            key={role}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(href)}
            data-testid={`card-create-profile-${role.toLowerCase()}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{role}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
