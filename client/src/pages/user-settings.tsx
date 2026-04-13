import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  User,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wallet,
  Building2,
  Save,
  Instagram,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type UserData = {
  id: string;
  email: string;
  displayName: string;
  commissionRate: string;
  stripeConnectAccountId: string | null;
  stripeConnectOnboarded: boolean | null;
};

type UserProfile = {
  locationCity?: string | null;
  locationCountry?: string | null;
  billingAddress?: string | null;
  instagramHandle?: string | null;
};

type StripeConnectStatus = {
  connected: boolean;
  onboarded: boolean;
  accountId?: string;
};

const nameSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(80),
});

const profileSchema = z.object({
  locationCity: z.string().optional(),
  locationCountry: z.string().optional(),
  billingAddress: z.string().optional(),
  instagramHandle: z.string().optional(),
});

export default function UserSettings() {
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ["/api/users/me"],
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/me/profile"],
  });

  const { data: stripeStatus, isLoading: stripeLoading } = useQuery<StripeConnectStatus>({
    queryKey: ["/api/stripe/connect/status"],
  });

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    values: { displayName: user?.displayName ?? "" },
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      locationCity: profile?.locationCity ?? "",
      locationCountry: profile?.locationCountry ?? "",
      billingAddress: profile?.billingAddress ?? "",
      instagramHandle: profile?.instagramHandle ?? "",
    },
  });

  const nameMutation = useMutation({
    mutationFn: async (data: { displayName: string }) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({ title: "Name updated", description: "Your display name has been saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update name.", variant: "destructive" }),
  });

  const profileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", "/api/users/me/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/profile"] });
      toast({ title: "Profile updated", description: "Your location and billing info has been saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" }),
  });

  const createConnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/connect/create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/connect/status"] });
      toast({ title: "Account Created", description: "Complete onboarding to receive payments." });
    },
    onError: () => toast({ title: "Error", description: "Failed to create payout account.", variant: "destructive" }),
  });

  const startOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/connect/onboarding");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: () => toast({ title: "Error", description: "Failed to start onboarding.", variant: "destructive" }),
  });

  const isLoading = userLoading || profileLoading;
  const locationSummary = [profile?.locationCity, profile?.locationCountry].filter(Boolean).join(", ");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Account Settings
        </h1>
        <p className="text-muted-foreground">Manage your profile, location, billing, and payout details.</p>
        {locationSummary && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            {locationSummary}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Display Name */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Display Name
              </CardTitle>
              <CardDescription>This is the name shown publicly across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...nameForm}>
                <form
                  onSubmit={nameForm.handleSubmit((d) => nameMutation.mutate(d))}
                  className="flex gap-3 items-start"
                >
                  <FormField
                    control={nameForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="Your display name" data-testid="input-display-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={nameMutation.isPending} data-testid="button-save-name">
                    <Save className="w-4 h-4 mr-2" />
                    {nameMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </form>
              </Form>
              <p className="text-sm text-muted-foreground mt-3">
                Email: <span className="font-medium">{user?.email}</span>
              </p>
            </CardContent>
          </Card>

          {/* Location & Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location &amp; Billing Address
              </CardTitle>
              <CardDescription>Your city and country appear on your profile. Billing address is used for invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="locationCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="City" data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="locationCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Country" data-testid="input-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Billing address (street, postcode, country)" data-testid="input-billing-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="instagramHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} placeholder="Instagram @handle" className="pl-9" data-testid="input-instagram-handle" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={profileMutation.isPending} data-testid="button-save-profile">
                    <Save className="w-4 h-4 mr-2" />
                    {profileMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Payout Method */}
          {!stripeLoading && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Payout Method
                  </CardTitle>
                  <CardDescription>Connect your bank account to receive commissions and payouts.</CardDescription>
                </div>
                {stripeStatus?.onboarded ? (
                  <Badge className="bg-chart-2 text-white shrink-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : stripeStatus?.connected ? (
                  <Badge variant="secondary" className="shrink-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {!stripeStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <CreditCard className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Set Up Payouts</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Connect your bank account through Stripe to receive automatic payouts. This is a one-time setup.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => createConnectMutation.mutate()}
                      disabled={createConnectMutation.isPending}
                      data-testid="button-create-payout-account"
                    >
                      {createConnectMutation.isPending ? "Creating…" : "Create Payout Account"}
                    </Button>
                  </div>
                ) : !stripeStatus?.onboarded ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="w-5 h-5 mt-0.5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">Complete Onboarding</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Your account was created — complete identity verification and add your bank details to activate payouts.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => startOnboardingMutation.mutate()}
                      disabled={startOnboardingMutation.isPending}
                      data-testid="button-complete-onboarding"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {startOnboardingMutation.isPending ? "Loading…" : "Complete Onboarding"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Payouts Active</p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Your bank account is connected. Commissions are automatically transferred each month.
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Stripe Account:{" "}
                      <code className="px-2 py-1 bg-muted rounded">{stripeStatus.accountId}</code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payout Schedule info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Payout Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-medium">Monthly</p>
                  <p className="text-xs text-muted-foreground mt-1">Processed on the 1st of each month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Payout</p>
                  <p className="font-medium">€50.00</p>
                  <p className="text-xs text-muted-foreground mt-1">Balance carries over if threshold not met</p>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                All payouts processed securely via Stripe. Standard bank processing times apply (2–5 business days).
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
