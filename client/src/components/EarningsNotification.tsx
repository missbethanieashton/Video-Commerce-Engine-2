import { useState, useEffect, useCallback } from "react";
import { X, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EarningsNotificationProps {
  currentEarnings: number;
}

const EARNING_THRESHOLDS = [100, 500, 1000, 1500, 2500, 5000, 10000, 25000, 50000, 100000];

export function EarningsNotification({ currentEarnings }: EarningsNotificationProps) {
  const [notification, setNotification] = useState<{
    amount: number;
    visible: boolean;
  } | null>(null);
  const [lastNotifiedThreshold, setLastNotifiedThreshold] = useState(0);

  useEffect(() => {
    const reachedThreshold = EARNING_THRESHOLDS.find(
      (threshold) => currentEarnings >= threshold && threshold > lastNotifiedThreshold
    );

    if (reachedThreshold) {
      setNotification({ amount: reachedThreshold, visible: true });
      setLastNotifiedThreshold(reachedThreshold);

      const timer = setTimeout(() => {
        setNotification((prev) => (prev ? { ...prev, visible: false } : null));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentEarnings, lastNotifiedThreshold]);

  const dismiss = useCallback(() => {
    setNotification((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  if (!notification?.visible) return null;

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(notification.amount);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-full duration-300"
      data-testid="notification-earnings"
    >
      <div 
        className="relative flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border"
        style={{
          backgroundColor: "hsl(34, 67%, 70%)",
          borderColor: "hsl(34, 67%, 60%)",
        }}
      >
        <div 
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: "hsl(34, 67%, 60%)" }}
        >
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div className="pr-6">
          <div className="flex items-center gap-1.5 text-white">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Milestone Reached!</span>
          </div>
          <p className="text-lg font-bold text-white">
            You just earned {formattedAmount}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-6 w-6 text-white/80 hover:text-white hover:bg-white/20"
          onClick={dismiss}
          data-testid="button-dismiss-notification"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function useEarningsDemo() {
  const [demoEarnings, setDemoEarnings] = useState(0);

  const triggerEarning = useCallback((amount: number) => {
    setDemoEarnings(amount);
  }, []);

  return { demoEarnings, triggerEarning };
}
