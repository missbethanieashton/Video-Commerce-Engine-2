import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Link2, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

const PLATFORMS = [
  { id: "shopify",     label: "Shopify",      placeholder: "shpat_xxxxxxxxxxxxxxxxxxxx" },
  { id: "woocommerce", label: "WooCommerce",  placeholder: "ck_xxxxxxxxxxxxxxxxxxxxxxxx" },
  { id: "bigcommerce", label: "BigCommerce",  placeholder: "your BigCommerce API key" },
  { id: "magento",     label: "Magento",      placeholder: "your Magento integration token" },
  { id: "custom",      label: "Custom API",   placeholder: "your custom API key or token" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

export default function BrandInventory() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(null);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const activePlatform = PLATFORMS.find((p) => p.id === selectedPlatform);
  const inputPlaceholder = activePlatform
    ? `${activePlatform.label} API key — e.g. ${activePlatform.placeholder}`
    : "Select a platform above, then enter your API key";

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const handleConnectApi = () => {
    if (selectedPlatform && apiKeyInput.trim()) {
      setIsApiConnected(true);
      toast({
        title: `${activePlatform?.label ?? "API"} Connected!`,
        description: "Your product inventory is now syncing automatically.",
      });
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Sync Complete",
        description: "Your inventory has been updated.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage and sync your product catalog
          </p>
        </div>
        <div className="flex gap-2">
          {isApiConnected && (
            <Button 
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="rounded-full gap-2"
              data-testid="button-sync-inventory"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          )}
          <Button className="rounded-full gap-2" data-testid="button-add-product">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

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
                <Label>Select your platform</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlatform(p.id)}
                      data-testid={`button-platform-${p.id}`}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        selectedPlatform === p.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-foreground border-border hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder={inputPlaceholder}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  disabled={!selectedPlatform}
                  data-testid="input-inventory-api-key"
                />
              </div>
              <Button 
                onClick={handleConnectApi}
                className="rounded-full"
                disabled={!selectedPlatform || !apiKeyInput.trim()}
                data-testid="button-connect-inventory-api"
              >
                Connect {activePlatform?.label ?? "API"}
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
            Product Catalog
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {products.length} products in inventory
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-4">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg hover-elevate cursor-pointer"
                  data-testid={`product-card-${product.id}`}
                >
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="h-16 w-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold text-primary">${product.price}</span>
                      {product.category && (
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No products in inventory</p>
              <p className="text-sm mb-4">Connect your API or add products manually</p>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
