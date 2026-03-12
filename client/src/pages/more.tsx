import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { User } from "@shared/schema";
import {
  Users,
  BarChart3,
  Target,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  CreditCard,
  Moon,
} from "lucide-react";

const brandMenuItems = [
  { path: "/brand/campaigns", label: "Campaigns", icon: Target },
  { path: "/brand/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/brand/creators", label: "Creator Network", icon: Users },
  { path: "/brand/help", label: "Help Center", icon: HelpCircle },
];

const settingsItems = [
  { label: "Notifications", icon: Bell },
  { label: "Privacy & Security", icon: Shield },
  { label: "Billing & Payments", icon: CreditCard },
  { label: "Account Settings", icon: Settings },
];

function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(role?: string): string {
  switch (role) {
    case "brand":
      return "Brand";
    case "creator":
      return "Creator";
    case "affiliate":
      return "Publisher";
    default:
      return "User";
  }
}

function getProfilePath(role?: string): string {
  switch (role) {
    case "brand":
      return "/brand/profile";
    case "creator":
      return "/creator/profile";
    case "affiliate":
      return "/affiliate/profile";
    default:
      return "/brand/profile";
  }
}

export default function More() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const displayName = user?.displayName || "Demo Brand";
  const username = user?.username || "brand-account";
  const role = user?.role || "brand";
  const initials = getInitials(displayName);

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl" data-testid="text-avatar-initials">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg" data-testid="text-display-name">{displayName}</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-username">{username}</p>
              <Badge className="mt-2" data-testid="badge-role">{getRoleLabel(role)}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => navigate(getProfilePath(role))}
              data-testid="button-edit-profile"
            >
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {brandMenuItems.map((item, index) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-4 p-4 hover-elevate cursor-pointer ${
                  index !== brandMenuItems.length - 1 ? "border-b border-border" : ""
                }`}
                data-testid={`link-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Moon className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="flex-1 font-medium">Dark Mode</span>
            <ThemeToggle />
          </div>
          
          {settingsItems.map((item, index) => (
            <div 
              key={item.label}
              className={`flex items-center gap-4 p-4 hover-elevate cursor-pointer ${
                index !== settingsItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 font-medium">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive" data-testid="button-sign-out">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>

      <p className="text-center text-xs text-muted-foreground" data-testid="text-footer-version">
        Materialized Video Commerce Platform v1.0.0
      </p>
    </div>
  );
}
