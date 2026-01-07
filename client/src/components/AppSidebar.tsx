import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Video,
  Library,
  BarChart3,
  Users,
  HelpCircle,
  Search,
  Send,
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
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
];

const contentItems = [
  { path: "/my-videos", label: "My Videos", icon: Video },
  { path: "/library", label: "Global Video Library", icon: Library },
];

const analyticsItems = [
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/crm", label: "CRM Analytics", icon: Users },
];

const otherItems = [
  { path: "/referrals", label: "Brand Referrals", icon: Send },
  { path: "/help", label: "Help Center", icon: HelpCircle },
];

interface AppSidebarProps {
  user?: {
    displayName: string;
    username: string;
    avatarUrl?: string;
    role: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  const renderItems = (items: typeof overviewItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = location === item.path || 
          (item.path !== "/" && location.startsWith(item.path));
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={item.path}>
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
              {user?.displayName?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.displayName || "demo_creator"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.username || "content-creator"}
            </p>
          </div>
        </div>
        
        <Badge className="mt-3 w-fit" variant="default">
          Creator
        </Badge>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            className="pl-9 h-10 rounded-lg bg-sidebar-accent/30"
            data-testid="input-search-menu"
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
            Content Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderItems(contentItems)}
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
            Tools
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
              <Link href="/help">
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
