import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, MousePointer, DollarSign, Image, CheckSquare, Square, Plus, Trash2, Link, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video } from "@shared/schema";

const CATEGORIES = [
  { value: "fashion",     label: "Fashion",          color: "bg-pink-500/15 text-pink-600 border-pink-500/20" },
  { value: "travel",      label: "Travel",            color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  { value: "skincare",    label: "Skincare",          color: "bg-violet-500/15 text-violet-600 border-violet-500/20" },
  { value: "cuisine_bev", label: "Cuisine & Bev",     color: "bg-orange-500/15 text-orange-600 border-orange-500/20" },
  { value: "health",      label: "Health",            color: "bg-green-500/15 text-green-600 border-green-500/20" },
  { value: "eco",         label: "Eco",               color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  { value: "interiors",   label: "Interiors",         color: "bg-stone-500/15 text-stone-600 border-stone-500/20" },
];

function parseCategories(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

interface ManualProduct {
  id: string;
  productId?: string;
  name?: string;
  buyUrl?: string;
  price?: string | null;
  imageUrl?: string | null;
  startTime: number;
  endTime: number;
  product?: {
    id: string;
    name: string;
    productUrl: string;
    buyUrl?: string;
    price?: string | null;
    imageUrl?: string | null;
  };
}

interface Props {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoDetailSheet({ video, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories]   = useState<string[]>([]);
  const [thumbUrl, setThumbUrl]       = useState("");
  const [editingThumb, setEditingThumb] = useState(false);

  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl]   = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title ?? "");
      setDescription(video.description ?? "");
      setCategories(parseCategories(video.categories));
      setThumbUrl(video.thumbnailUrl ?? "");
      setEditingThumb(false);
    }
    setShowAddProduct(false);
    setProductName("");
    setProductUrl("");
    setProductPrice("");
  }, [video]);

  const { data: carouselData, refetch: refetchCarousel } = useQuery<{ products?: ManualProduct[] } | null>({
    queryKey: ["/api/videos", video?.id, "carousel"],
    enabled: !!video?.id && open,
  });

  const manualProducts: ManualProduct[] = carouselData?.products ?? [];

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/videos/${video!.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/library"] });
      toast({ title: "Saved", description: "Video updated successfully." });
      onOpenChange(false);
    },
    onError: () =>
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" }),
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: { name: string; buyUrl: string; price?: string }) =>
      apiRequest("POST", `/api/videos/${video!.id}/carousel/products`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", video?.id, "carousel"] });
      refetchCarousel();
      toast({ title: "Product Added", description: "The product link has been added to the carousel." });
      setProductName("");
      setProductUrl("");
      setProductPrice("");
      setShowAddProduct(false);
    },
    onError: () =>
      toast({ title: "Error", description: "Failed to add product.", variant: "destructive" }),
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) =>
      apiRequest("DELETE", `/api/videos/${video!.id}/carousel/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", video?.id, "carousel"] });
      refetchCarousel();
      toast({ title: "Removed", description: "Product link removed from carousel." });
    },
    onError: () =>
      toast({ title: "Error", description: "Failed to remove product.", variant: "destructive" }),
  });

  function toggleCategory(val: string) {
    setCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : prev.length < 3 ? [...prev, val] : prev
    );
  }

  function handleSave() {
    mutation.mutate({
      title,
      description,
      categories: JSON.stringify(categories),
      ...(thumbUrl !== video?.thumbnailUrl ? { thumbnailUrl: thumbUrl } : {}),
    });
  }

  function handleAddProduct() {
    if (!productName.trim() || !productUrl.trim()) return;
    addProductMutation.mutate({
      name: productName.trim(),
      buyUrl: productUrl.trim(),
      ...(productPrice.trim() ? { price: productPrice.trim() } : {}),
    });
  }

  if (!video) return null;

  const views   = video.totalViews ?? 0;
  const clicks  = video.totalClicks ?? 0;
  const revenue = Number(video.totalRevenue ?? 0).toFixed(2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
        data-testid="sheet-video-detail"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted shrink-0">
          {thumbUrl ? (
            <img src={thumbUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-chart-2/20">
              <Image className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <button
            data-testid="button-change-thumbnail"
            onClick={() => setEditingThumb((p) => !p)}
            className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
          >
            {editingThumb ? "Cancel" : "Change thumbnail"}
          </button>
        </div>

        {editingThumb && (
          <div className="px-5 pt-3">
            <Label className="text-xs text-muted-foreground mb-1 block">Thumbnail URL</Label>
            <Input
              data-testid="input-thumbnail-url"
              placeholder="https://..."
              value={thumbUrl}
              onChange={(e) => setThumbUrl(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        <SheetHeader className="px-5 pt-5 pb-1">
          <SheetTitle className="text-lg">Video Details</SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-6 flex flex-col gap-5 flex-1">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-muted/60 border border-border">
              <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-base font-bold">{views.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/60 border border-border">
              <MousePointer className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-base font-bold">{clicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Clicks</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/60 border border-border">
              <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-base font-bold">${revenue}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="vid-title">Title</Label>
            <Input
              id="vid-title"
              data-testid="input-video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="vid-desc">Description</Label>
            <Textarea
              id="vid-desc"
              data-testid="input-video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your video…"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Categories</Label>
              <span className="text-xs text-muted-foreground">Up to 3 selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = categories.includes(cat.value);
                const maxed    = !selected && categories.length >= 3;
                return (
                  <button
                    key={cat.value}
                    data-testid={`toggle-category-${cat.value}`}
                    onClick={() => toggleCategory(cat.value)}
                    disabled={maxed}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${selected ? cat.color + " ring-1 ring-current/30" : "bg-muted/50 text-muted-foreground border-border"}
                      ${maxed ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}
                    `}
                  >
                    {selected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Carousel Links */}
          <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Product Carousel Links</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => setShowAddProduct((p) => !p)}
                data-testid="button-toggle-add-product"
              >
                <Plus className="h-3 w-3" />
                Add Link
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Add product URLs that will appear in the video carousel overlay.
            </p>

            {showAddProduct && (
              <div className="space-y-2 border border-border rounded-lg p-3 bg-background">
                <div className="space-y-1">
                  <Label className="text-xs">Product Name *</Label>
                  <Input
                    data-testid="input-product-name"
                    placeholder="e.g. Summer Dress"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Product URL *</Label>
                  <Input
                    data-testid="input-product-url"
                    placeholder="https://shop.example.com/product"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price (optional)</Label>
                  <Input
                    data-testid="input-product-price"
                    placeholder="e.g. 49.99"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={handleAddProduct}
                    disabled={!productName.trim() || !productUrl.trim() || addProductMutation.isPending}
                    data-testid="button-save-product-link"
                  >
                    {addProductMutation.isPending ? "Adding…" : "Add to Carousel"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setShowAddProduct(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {manualProducts.length > 0 ? (
              <div className="space-y-2">
                {manualProducts.map((p) => {
                  const name = p.product?.name ?? p.name ?? "";
                  const url  = p.product?.productUrl ?? p.product?.buyUrl ?? p.buyUrl ?? "";
                  const price = p.product?.price ?? p.price ?? null;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border"
                      data-testid={`product-link-${p.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{name}</p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate flex items-center gap-1"
                        >
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{url}</span>
                        </a>
                        {price && (
                          <Badge variant="secondary" className="text-xs mt-0.5 h-4">
                            ${price}
                          </Badge>
                        )}
                      </div>
                      <button
                        data-testid={`button-remove-product-${p.id}`}
                        onClick={() => removeProductMutation.mutate(p.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              !showAddProduct && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No product links yet. Click "Add Link" to get started.
                </p>
              )
            )}
          </div>

          {/* Save */}
          <Button
            data-testid="button-save-video"
            onClick={handleSave}
            disabled={mutation.isPending || !title.trim()}
            className="w-full rounded-full mt-auto"
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
