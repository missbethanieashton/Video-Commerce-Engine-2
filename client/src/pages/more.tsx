import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Users,
  Send,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  CreditCard,
  Moon,
} from "lucide-react";

const menuItems = [
  { path: "/crm", label: "CRM Analytics", icon: Users },
  { path: "/referrals", label: "Brand Referrals", icon: Send },
  { path: "/help", label: "Help Center", icon: HelpCircle },
];

const settingsItems = [
  { label: "Notifications", icon: Bell },
  { label: "Privacy & Security", icon: Shield },
  { label: "Billing & Payments", icon: CreditCard },
  { label: "Account Settings", icon: Settings },
];

export default function More() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">More</h1>
        <p className="text-muted-foreground mt-1">
          Access additional features and settings
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                DC
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">demo_creator</h3>
              <p className="text-sm text-muted-foreground">content-creator</p>
              <Badge className="mt-2">Creator</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => navigate("/creator/profile")}
              data-testid="button-edit-profile"
            >
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {menuItems.map((item, index) => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-4 p-4 hover-elevate cursor-pointer ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}>
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

      <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        MTERLIZD Video Commerce Platform v1.0.0
      </p>
    </div>
  );
}
