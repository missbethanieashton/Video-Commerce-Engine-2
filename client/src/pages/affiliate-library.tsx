import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Play, Search, Filter, DollarSign, Users } from "lucide-react";
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

export default function AffiliateLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const { data: listings = [], isLoading } = useQuery<GlobalListing[]>({
    queryKey: ['/api/library', categoryFilter],
  });

  const filteredListings = listings.filter(listing => {
    const matchesSearch = searchQuery === "" || 
      listing.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.video?.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const categories = ["Fashion", "Electronics", "Beauty", "Fitness", "Home", "Food", "Travel", "Lifestyle"];

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

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-library"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-category">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            {searchQuery ? "No videos match your search." : "The library is currently empty. Check back soon for new content!"}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
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
                <Badge className="absolute top-2 right-2" variant="secondary">
                  {listing.category || "General"}
                </Badge>
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
          ))}
        </div>
      )}
    </div>
  );
}
