import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Play, Eye, User, Library as LibraryIcon } from "lucide-react";
import type { Video, User as UserType } from "@shared/schema";

interface VideoWithCreator extends Video {
  creator?: UserType;
}

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

const CATEGORY_LABELS: Record<string, string> = {
  fashion:     "Fashion",
  travel:      "Travel",
  skincare:    "Skincare",
  cuisine_bev: "Cuisine & Bev",
  health:      "Health",
  eco:         "Eco",
  interiors:   "Interiors",
};

function parseCategories(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export default function Library() {
  const [searchQuery, setSearchQuery]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode]           = useState("newest");

  const { data: videos = [], isLoading } = useQuery<VideoWithCreator[]>({
    queryKey: ["/api/videos/library"],
  });

  const filtered = videos
    .filter((video) => {
      const matchesSearch   = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" ||
        parseCategories(video.categories).includes(categoryFilter);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortMode === "most_viewed")      return (b.totalViews ?? 0) - (a.totalViews ?? 0);
      if (sortMode === "highest_grossing") return Number(b.totalRevenue ?? 0) - Number(a.totalRevenue ?? 0);
      const da = new Date(a.createdAt ?? 0).getTime();
      const db = new Date(b.createdAt ?? 0).getTime();
      return db - da;
    });

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Global Video Library</h1>
        <p className="text-muted-foreground mt-1">
          Discover trending videos and successful campaigns across the platform
        </p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search the library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-library"
          />
        </div>
        <Select value={sortMode} onValueChange={setSortMode}>
          <SelectTrigger className="w-48 h-10 text-sm" data-testid="select-sort-library">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="most_viewed">Most viewed</SelectItem>
            <SelectItem value="highest_grossing">Highest grossing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2" data-testid="library-category-filters">
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

      {/* Video grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <LibraryIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || categoryFilter !== "all" ? "No videos found" : "No videos in the library yet"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery || categoryFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Be the first to upload a video and share it with the community."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((video) => {
            const cats = parseCategories(video.categories);
            return (
              <Card key={video.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-chart-2/20">
                      <Play className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-6 w-6 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium">
                    3:24
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Category pills */}
                  {cats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {cats.slice(0, 2).map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {CATEGORY_LABELS[cat] ?? cat}
                        </Badge>
                      ))}
                      {cats.length > 2 && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          +{cats.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Creator row */}
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium line-clamp-2 mb-0.5 text-sm leading-snug">{video.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {(video as any).creator?.displayName || "Creator"}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {(video.totalViews ?? 0).toLocaleString()} views
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full capitalize">
                          {video.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
