import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  HelpCircle,
  Search,
  Settings,
  Target,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const overviewItems = [
  { path: "/brand", label: "Dashboard", icon: LayoutDashboard },
];

const inventoryItems = [
  { path: "/brand/inventory", label: "Product Inventory", icon: Package },
];

const creatorsItems = [
  { path: "/brand/creators", label: "Connect Your Creators", icon: Users },
  { path: "/brand/campaigns", label: "Campaigns", icon: Target },
];

const analyticsItems = [
  { path: "/brand/analytics", label: "Analytics", icon: BarChart3 },
];

const otherItems = [
  { path: "/brand/settings", label: "Settings", icon: Settings },
  { path: "/brand/help", label: "Help Center", icon: HelpCircle },
];

interface BrandAppSidebarProps {
  user?: {
    displayName: string;
    username: string;
    avatarUrl?: string;
    role: string;
  };
}

export function BrandAppSidebar({ user }: BrandAppSidebarProps) {
  const [location] = useLocation();

  const renderItems = (items: typeof overviewItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = location === item.path || 
          (item.path !== "/brand" && location.startsWith(item.path));
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={item.path} data-testid={`nav-brand-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            MTERLIZD
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {user?.displayName?.charAt(0) || "B"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.displayName || "Demo Brand"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.username || "brand-account"}
            </p>
          </div>
        </div>
        
        <Badge className="mt-3 w-fit bg-chart-2 hover:bg-chart-2/90">
          Brand
        </Badge>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            className="pl-9 h-10 rounded-lg bg-sidebar-accent/30"
            data-testid="input-search-brand-menu"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(overviewItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Products
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(inventoryItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Creator Network
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(creatorsItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Analytics & Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(analyticsItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(otherItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/brand/help">
                <HelpCircle className="h-4 w-4" />
                <span>Help Center</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
