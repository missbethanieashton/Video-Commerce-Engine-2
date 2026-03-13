import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Play, Search, DollarSign, Users } from "lucide-react";
import { useState } from "react";

type GlobalListing = {
  id: string;
  videoId: string;
  creatorId: string;
  licenseFee: string;
  publishStatus: string;
  listingTitle: string | null;
  listingDescription: string | null;
  category: string | null;
  totalLicenses: number;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
  } | null;
  creator: {
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

const CATEGORIES = [
  { value: "all",         label: "All" },
  { value: "fashion",     label: "Fashion" },
  { value: "travel",      label: "Travel" },
  { value: "skincare",    label: "Skincare" },
  { value: "cuisine_bev", label: "Cuisine & Bev" },
  { value: "health",      label: "Health" },
  { value: "eco",         label: "Eco" },
  { value: "interiors",   label: "Interiors" },
];

const CATEGORY_COLORS: Record<string, string> = {
  fashion:     "bg-pink-500/15 text-pink-600",
  travel:      "bg-blue-500/15 text-blue-600",
  skincare:    "bg-violet-500/15 text-violet-600",
  cuisine_bev: "bg-orange-500/15 text-orange-600",
  health:      "bg-green-500/15 text-green-600",
  eco:         "bg-emerald-500/15 text-emerald-600",
  interiors:   "bg-stone-500/15 text-stone-600",
};

export default function AffiliateLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: listings = [], isLoading } = useQuery<GlobalListing[]>({
    queryKey: ["/api/library"],
  });

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      searchQuery === "" ||
      listing.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.video?.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      (listing.category ?? "").toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
          Global Video Library
        </h1>
        <p className="text-muted-foreground">
          Browse and license videos from top creators. Pay once, earn commissions on every sale.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-library"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2" data-testid="affiliate-library-category-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            data-testid={`lib-filter-${cat.value}`}
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              categoryFilter === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">No Videos Available</CardTitle>
          <CardDescription>
            {searchQuery || categoryFilter !== "all"
              ? "No videos match your search or filter."
              : "The library is currently empty. Check back soon for new content!"}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const cat = (listing.category ?? "").toLowerCase();
            const badgeClass = CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground";
            return (
              <Card key={listing.id} className="overflow-hidden" data-testid={`card-listing-${listing.id}`}>
                <div className="relative aspect-video bg-muted">
                  {listing.video?.thumbnailUrl ? (
                    <img
                      src={listing.video.thumbnailUrl}
                      alt={listing.video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {listing.category && (
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                      {CATEGORIES.find((c) => c.value === cat)?.label ?? listing.category}
                    </span>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">
                    {listing.listingTitle || listing.video?.title || "Untitled Video"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>by {listing.creator?.displayName || "Unknown Creator"}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{listing.totalLicenses} licenses sold</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-accent-gold">
                      <DollarSign className="w-4 h-4" />
                      <span>{listing.licenseFee}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" data-testid={`button-license-${listing.id}`}>
                    License Video
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
