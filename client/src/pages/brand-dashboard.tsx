import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { BrandDashboardTabs } from "@/components/BrandDashboardTabs";
import { BrandAnnouncementBanner } from "@/components/BrandAnnouncementBanner";
import { Eye, DollarSign, MousePointer, Users, Package, Link2, TrendingUp, Zap, Mail, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Brand, User, Product } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const connectCreatorSchema = z.object({
  creatorName: z.string().min(1, "Creator name is required"),
  creatorEmail: z.string().email("Valid email is required"),
  contentCategory: z.string().optional(),
  message: z.string().optional(),
});

type ConnectCreatorForm = z.infer<typeof connectCreatorSchema>;

export default function BrandDashboard() {
  const [activeTab, setActiveTab] = useState("stats");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isApiConnected, setIsApiConnected] = useState(false);
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stats } = useQuery<{
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    activeCreators: number;
  }>({
    queryKey: ["/api/brands/stats"],
  });

  const form = useForm<ConnectCreatorForm>({
    resolver: zodResolver(connectCreatorSchema),
    defaultValues: {
      creatorName: "",
      creatorEmail: "",
      contentCategory: "",
      message: "",
    },
  });

  const creatorInviteMutation = useMutation({
    mutationFn: async (data: ConnectCreatorForm) => {
      return apiRequest("POST", "/api/brands/invite-creator", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands/creator-invites"] });
      toast({
        title: "Invitation Sent!",
        description: "Your invitation email has been sent to the creator.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Invitation Failed",
        description: "There was an error sending the invitation.",
        variant: "destructive",
      });
    },
  });

  const handleConnectApi = () => {
    if (apiKeyInput.trim()) {
      setIsApiConnected(true);
      toast({
        title: "API Connected!",
        description: "Your product inventory is now syncing.",
      });
    }
  };

  const onSubmitCreatorInvite = (data: ConnectCreatorForm) => {
    creatorInviteMutation.mutate(data);
  };

  const brandStats = stats || {
    totalViews: 45230,
    totalClicks: 3420,
    totalConversions: 156,
    totalRevenue: 12450,
    activeCreators: 23,
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="-mx-4 md:-mx-6 -mt-6 mb-4 overflow-hidden">
        <BrandAnnouncementBanner />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Brand Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products and connect with creators
          </p>
        </div>
        <Button 
          className="rounded-full gap-2 w-full sm:w-auto"
          data-testid="button-add-product"
        >
          <Package className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <BrandDashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "stats" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Brand Performance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your products across all creator videos
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div data-testid="stat-brand-views">
                <StatCard
                  title="Total Views"
                  value={brandStats.totalViews.toLocaleString()}
                  subtitle="Product impressions"
                  icon={Eye}
                />
              </div>
              <div data-testid="stat-brand-clicks">
                <StatCard
                  title="Total Clicks"
                  value={brandStats.totalClicks.toLocaleString()}
                  subtitle="Product clicks"
                  icon={MousePointer}
                />
              </div>
              <div data-testid="stat-brand-conversions">
                <StatCard
                  title="Conversions"
                  value={brandStats.totalConversions}
                  subtitle="Purchases made"
                  icon={TrendingUp}
                />
              </div>
              <div data-testid="stat-brand-revenue">
                <StatCard
                  title="Revenue Generated"
                  value={`$${brandStats.totalRevenue.toLocaleString()}`}
                  subtitle="From creator sales"
                  icon={DollarSign}
                />
              </div>
              <div data-testid="stat-brand-creators">
                <StatCard
                  title="Active Creators"
                  value={brandStats.activeCreators}
                  subtitle="Featuring your products"
                  icon={Users}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Connect Your Product API
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sync your product inventory automatically with your e-commerce platform
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isApiConnected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your Shopify, WooCommerce, or custom API key"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      data-testid="input-api-key"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Shopify</Badge>
                    <Badge variant="outline">WooCommerce</Badge>
                    <Badge variant="outline">BigCommerce</Badge>
                    <Badge variant="outline">Custom API</Badge>
                  </div>
                  <Button 
                    onClick={handleConnectApi}
                    className="rounded-full"
                    disabled={!apiKeyInput.trim()}
                    data-testid="button-connect-api"
                  >
                    Connect API
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">API Connected</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Your inventory is syncing automatically</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Inventory
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {products.length} products synced
              </p>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center gap-4 p-3 border rounded-lg"
                      data-testid={`product-item-${product.id}`}
                    >
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">${product.price}</p>
                      </div>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No products synced yet</p>
                  <p className="text-sm">Connect your API to import your inventory</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "creators" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Connect Your Creators
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Invite content creators to feature your products in their videos
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitCreatorInvite)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="creatorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Creator Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter creator's name" 
                              {...field}
                              data-testid="input-creator-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creatorEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Creator Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="creator@example.com" 
                              {...field}
                              data-testid="input-creator-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="contentCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Category (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Fashion, Tech, Beauty" 
                            {...field}
                            data-testid="input-content-category"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add a personal note to your invitation..."
                            className="resize-none"
                            {...field}
                            data-testid="input-invitation-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="rounded-full gap-2"
                    disabled={creatorInviteMutation.isPending}
                    data-testid="button-send-invitation"
                  >
                    <Mail className="h-4 w-4" />
                    {creatorInviteMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Connected Creators</CardTitle>
              <p className="text-sm text-muted-foreground">
                Creators currently featuring your products
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No creators connected yet</p>
                <p className="text-sm">Send invitations to start building your creator network</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "performance" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Analytics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track how your products perform across creator videos and publishing sources
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>View full audience analytics, demographics, and embed traces</p>
              <p className="text-sm mb-4">See viewing trends, audience breakdowns, and per-source performance</p>
              <Link href="/brand/analytics">
                <Button className="rounded-full gap-2" data-testid="button-view-analytics">
                  <TrendingUp className="h-4 w-4" />
                  Open Full Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "quick-actions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Add New Product</h3>
                  <p className="text-sm text-muted-foreground">Manually add a product to your inventory</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Invite Creator</h3>
                  <p className="text-sm text-muted-foreground">Send an invitation to a content creator</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Connect API</h3>
                  <p className="text-sm text-muted-foreground">Sync your e-commerce inventory</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Brand Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure your brand profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "campaigns" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Marketing Campaigns</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create and manage promotional campaigns with creators
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active campaigns</p>
              <p className="text-sm">Create your first campaign to boost product visibility</p>
              <Button className="rounded-full mt-4" data-testid="button-create-campaign">
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
