import { Link, useLocation } from "wouter";
import materializedLogo from "@assets/MATERIALIZED_full_logo_1773352270197.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Video, 
  Settings,
  HelpCircle,
  LogOut,
  TrendingUp,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
};

const affiliateMenuItems = [
  {
    title: "Dashboard",
    url: "/affiliate",
    icon: LayoutDashboard,
  },
  {
    title: "Video Library",
    url: "/affiliate/library",
    icon: ShoppingBag,
  },
  {
    title: "My Campaigns",
    url: "/affiliate/campaigns",
    icon: Video,
  },
  {
    title: "Analytics",
    url: "/affiliate/analytics",
    icon: TrendingUp,
  },
  {
    title: "Mailbox",
    url: "/affiliate/mailbox",
    icon: Bell,
  },
];

const bottomMenuItems = [
  {
    title: "Settings",
    url: "/affiliate/settings",
    icon: Settings,
  },
  {
    title: "Help",
    url: "/affiliate/help",
    icon: HelpCircle,
  },
];

export function AffiliateAppSidebar() {
  const [location] = useLocation();
  const { data: user } = useQuery<User>({
    queryKey: ['/api/users/me'],
  });

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src={materializedLogo}
            alt="Materialized"
            style={{ height: 40, width: "auto" }}
          />
          <p className="text-xs text-muted-foreground">Affiliate Portal</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-2 mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {affiliateMenuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/affiliate" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs text-muted-foreground px-2 mb-2">
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-accent-sage/10 text-accent-sage">
              {user?.displayName?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName || "Affiliate"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button size="icon" variant="ghost" className="shrink-0" data-testid="button-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
