import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { BrandAppSidebar } from "@/components/BrandAppSidebar";
import { AffiliateAppSidebar } from "@/components/AffiliateAppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { BrandMobileNav } from "@/components/BrandMobileNav";
import { AffiliateMobileNav } from "@/components/AffiliateMobileNav";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MyVideos from "@/pages/my-videos";
import Library from "@/pages/library";
import Analytics from "@/pages/analytics";
import CRMAnalytics from "@/pages/crm";
import Referrals from "@/pages/referrals";
import Help from "@/pages/help";
import More from "@/pages/more";
import BrandDashboard from "@/pages/brand-dashboard";
import BrandInventory from "@/pages/brand-inventory";
import BrandCreators from "@/pages/brand-creators";
import BrandCampaigns from "@/pages/brand-campaigns";
import BrandKit from "@/pages/brand-kit";
import AffiliateLibrary from "@/pages/affiliate-library";
import AffiliateCampaigns from "@/pages/affiliate-campaigns";
import AffiliateSettings from "@/pages/affiliate-settings";
import Affiliates from "@/pages/affiliates";

function CreatorRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/my-videos" component={MyVideos} />
      <Route path="/library" component={Library} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/crm" component={CRMAnalytics} />
      <Route path="/affiliates" component={Affiliates} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/brand-kit" component={BrandKit} />
      <Route path="/help" component={Help} />
      <Route path="/more" component={More} />
      <Route component={NotFound} />
    </Switch>
  );
}

function BrandRouter() {
  return (
    <Switch>
      <Route path="/brand" component={BrandDashboard} />
      <Route path="/brand/inventory" component={BrandInventory} />
      <Route path="/brand/creators" component={BrandCreators} />
      <Route path="/brand/analytics" component={Analytics} />
      <Route path="/brand/campaigns" component={BrandCampaigns} />
      <Route path="/brand/settings" component={More} />
      <Route path="/brand/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AffiliateRouter() {
  return (
    <Switch>
      <Route path="/affiliate" component={Dashboard} />
      <Route path="/affiliate/library" component={AffiliateLibrary} />
      <Route path="/affiliate/campaigns" component={AffiliateCampaigns} />
      <Route path="/affiliate/analytics" component={Analytics} />
      <Route path="/affiliate/settings" component={AffiliateSettings} />
      <Route path="/affiliate/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [location] = useLocation();
  const isBrandRoute = location.startsWith("/brand");
  const isAffiliateRoute = location.startsWith("/affiliate");
  
  if (isBrandRoute) {
    return <BrandRouter />;
  }
  if (isAffiliateRoute) {
    return <AffiliateRouter />;
  }
  return <CreatorRouter />;
}

function AppContent() {
  const [location] = useLocation();
  const isBrandRoute = location.startsWith("/brand");
  const isAffiliateRoute = location.startsWith("/affiliate");

  const getSidebar = () => {
    if (isBrandRoute) return <BrandAppSidebar />;
    if (isAffiliateRoute) return <AffiliateAppSidebar />;
    return <AppSidebar />;
  };

  const getMobileNav = () => {
    if (isBrandRoute) return <BrandMobileNav />;
    if (isAffiliateRoute) return <AffiliateMobileNav />;
    return <MobileNav />;
  };

  return (
    <>
      <div className="flex h-screen w-full">
        <div className="hidden md:block">
          {getSidebar()}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hidden md:flex" data-testid="button-sidebar-toggle" />
              <div className="md:hidden text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                MTERLIZD
              </div>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-[#fffefd] dark:bg-background">
            <Router />
          </main>
        </div>
      </div>
      {getMobileNav()}
    </>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <AppContent />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
