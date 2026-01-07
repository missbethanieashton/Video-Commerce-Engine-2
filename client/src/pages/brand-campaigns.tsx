import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/StatCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer,
  Calendar,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Campaign, Brand, Product } from "@shared/schema";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignROIDashboard } from "@/components/CampaignROIDashboard";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  budget: z.string().min(1, "Budget is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetViews: z.string().optional(),
  targetClicks: z.string().optional(),
  targetConversions: z.string().optional(),
  targetRevenue: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function BrandCampaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const selectedBrandId = brands[0]?.id;

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", { brandId: selectedBrandId }],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      const res = await fetch(`/api/campaigns?brandId=${selectedBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
    enabled: !!selectedBrandId,
  });

  const { data: stats } = useQuery<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpent: number;
    totalRevenue: number;
    averageROI: number;
  }>({
    queryKey: ["/api/campaigns/stats", { brandId: selectedBrandId }],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const res = await fetch(`/api/campaigns/stats?brandId=${selectedBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!selectedBrandId,
  });

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      budget: "",
      startDate: "",
      endDate: "",
      targetViews: "",
      targetClicks: "",
      targetConversions: "",
      targetRevenue: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      return apiRequest("POST", "/api/campaigns", {
        brandId: selectedBrandId,
        name: data.name,
        description: data.description || null,
        budget: data.budget,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        targetViews: data.targetViews ? parseInt(data.targetViews) : null,
        targetClicks: data.targetClicks ? parseInt(data.targetClicks) : null,
        targetConversions: data.targetConversions ? parseInt(data.targetConversions) : null,
        targetRevenue: data.targetRevenue || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/stats"] });
      toast({
        title: "Campaign Created",
        description: "Your new campaign has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "There was an error creating the campaign.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/campaigns/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/stats"] });
      toast({
        title: "Status Updated",
        description: "Campaign status has been updated.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/stats"] });
      toast({
        title: "Campaign Deleted",
        description: "The campaign has been removed.",
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const calculateProgress = (actual: number, target: number | null) => {
    if (!target || target === 0) return 0;
    return Math.min(100, (actual / target) * 100);
  };

  const defaultStats = {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalRevenue: 0,
    averageROI: 0,
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Campaign Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and track marketing campaigns with ROI analytics
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2" data-testid="button-create-campaign">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Summer Sale 2026"
                          {...field}
                          data-testid="input-campaign-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Campaign description..."
                          className="resize-none"
                          {...field}
                          data-testid="input-campaign-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10000"
                          {...field}
                          data-testid="input-campaign-budget"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-campaign-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-campaign-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Target Goals (Optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="targetViews"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Views</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="50000"
                              {...field}
                              data-testid="input-target-views"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetClicks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Clicks</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5000"
                              {...field}
                              data-testid="input-target-clicks"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetConversions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Conversions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="500"
                              {...field}
                              data-testid="input-target-conversions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Revenue ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="25000"
                              {...field}
                              data-testid="input-target-revenue"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-campaign"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">ROI Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Campaigns"
              value={currentStats.totalCampaigns.toString()}
              subtitle={`${currentStats.activeCampaigns} active`}
              icon={Target}
            />
            <StatCard
              title="Total Budget"
              value={`$${currentStats.totalBudget.toLocaleString()}`}
              subtitle={`$${currentStats.totalSpent.toLocaleString()} spent`}
              icon={DollarSign}
            />
            <StatCard
              title="Total Revenue"
              value={`$${currentStats.totalRevenue.toLocaleString()}`}
              subtitle="From all campaigns"
              icon={TrendingUp}
            />
            <StatCard
              title="Average ROI"
              value={`${currentStats.averageROI.toFixed(1)}%`}
              subtitle="Return on investment"
              icon={BarChart3}
              trend={currentStats.averageROI > 0 ? { value: currentStats.averageROI, isPositive: true } : undefined}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Active Campaigns</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track performance and manage your marketing campaigns
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first campaign to start tracking performance
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="rounded-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="overflow-visible" data-testid={`card-campaign-${campaign.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold truncate">{campaign.name}</h3>
                              {getStatusBadge(campaign.status || "draft")}
                            </div>
                            {campaign.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                {campaign.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Budget: ${Number(campaign.budget).toLocaleString()}
                              </span>
                              {campaign.startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(campaign.startDate), "MMM d, yyyy")}
                                  {campaign.endDate && ` - ${format(new Date(campaign.endDate), "MMM d, yyyy")}`}
                                </span>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-campaign-menu-${campaign.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {campaign.status !== "active" && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "active" })}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {campaign.status === "active" && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "paused" })}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(campaign.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Views</span>
                              <span className="font-medium">
                                {campaign.actualViews?.toLocaleString() || 0}
                                {campaign.targetViews && (
                                  <span className="text-muted-foreground"> / {campaign.targetViews.toLocaleString()}</span>
                                )}
                              </span>
                            </div>
                            <Progress value={calculateProgress(campaign.actualViews || 0, campaign.targetViews)} className="h-1.5" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Clicks</span>
                              <span className="font-medium">
                                {campaign.actualClicks?.toLocaleString() || 0}
                                {campaign.targetClicks && (
                                  <span className="text-muted-foreground"> / {campaign.targetClicks.toLocaleString()}</span>
                                )}
                              </span>
                            </div>
                            <Progress value={calculateProgress(campaign.actualClicks || 0, campaign.targetClicks)} className="h-1.5" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Conversions</span>
                              <span className="font-medium">
                                {campaign.actualConversions?.toLocaleString() || 0}
                                {campaign.targetConversions && (
                                  <span className="text-muted-foreground"> / {campaign.targetConversions.toLocaleString()}</span>
                                )}
                              </span>
                            </div>
                            <Progress value={calculateProgress(campaign.actualConversions || 0, campaign.targetConversions)} className="h-1.5" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Revenue</span>
                              <span className="font-medium">
                                ${Number(campaign.actualRevenue || 0).toLocaleString()}
                                {campaign.targetRevenue && (
                                  <span className="text-muted-foreground"> / ${Number(campaign.targetRevenue).toLocaleString()}</span>
                                )}
                              </span>
                            </div>
                            <Progress value={calculateProgress(Number(campaign.actualRevenue || 0), campaign.targetRevenue ? Number(campaign.targetRevenue) : null)} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CampaignROIDashboard campaigns={campaigns} stats={currentStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
