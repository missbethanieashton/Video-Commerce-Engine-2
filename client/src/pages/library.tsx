import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Play, Eye, User, Library as LibraryIcon, Filter } from "lucide-react";
import type { Video, User as UserType } from "@shared/schema";

interface VideoWithCreator extends Video {
  creator?: UserType;
}

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: videos = [], isLoading } = useQuery<VideoWithCreator[]>({
    queryKey: ["/api/videos/library"],
  });

  const categories = ["all", "fashion", "beauty", "tech", "lifestyle", "fitness"];

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Global Video Library</h1>
        <p className="text-muted-foreground mt-1">
          Discover trending videos and successful campaigns across the platform
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
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
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="overflow-x-auto pb-2 -mb-2">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="inline-flex w-max">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

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
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <LibraryIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No videos in the library yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Be the first to upload a video and share it with the community.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden group">
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
                  <Button variant="secondary" size="icon" className="rounded-full h-14 w-14">
                    <Play className="h-6 w-6" />
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium">
                  3:24
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium line-clamp-2 mb-1">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {video.creator?.displayName || "Creator"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.totalViews || 0} views
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {video.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
