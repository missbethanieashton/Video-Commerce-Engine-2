import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MyVideos from "@/pages/my-videos";
import Library from "@/pages/library";
import Analytics from "@/pages/analytics";
import CRMAnalytics from "@/pages/crm";
import Referrals from "@/pages/referrals";
import Help from "@/pages/help";
import More from "@/pages/more";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/my-videos" component={MyVideos} />
      <Route path="/library" component={Library} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/crm" component={CRMAnalytics} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/help" component={Help} />
      <Route path="/more" component={More} />
      <Route component={NotFound} />
    </Switch>
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
            <div className="flex h-screen w-full">
              <div className="hidden md:block">
                <AppSidebar />
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
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <Router />
                </main>
              </div>
            </div>
            <MobileNav />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
