import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ListVideo, Trash2, Play, Copy, Check, ChevronRight, ExternalLink, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

type PlaylistSummary = {
  id: number;
  name: string;
  description: string | null;
  itemCount: number;
  createdAt: string;
};

type PlaylistItem = {
  id: number;
  listingId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmCode: string | null;
  addedAt: string;
  listing: {
    id: string;
    listingTitle: string | null;
    category: string | null;
    licenseFee: string;
    video: { id: string; title: string; thumbnailUrl: string | null } | null;
    creator: { displayName: string; avatarUrl: string | null } | null;
  } | null;
};

type PlaylistDetail = PlaylistSummary & { items: PlaylistItem[] };

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  website: "Website", twitter: "X (Twitter)", facebook: "Facebook",
  linkedin: "LinkedIn", email: "Email", other: "Other",
};

function buildUtmUrl(baseUrl: string, item: PlaylistItem): string {
  const params = new URLSearchParams();
  if (item.utmSource)   params.set("utm_source", item.utmSource);
  if (item.utmMedium)   params.set("utm_medium", item.utmMedium);
  if (item.utmCampaign) params.set("utm_campaign", item.utmCampaign);
  if (item.utmContent)  params.set("utm_content", item.utmContent ?? "");
  if (item.utmCode)     params.set("utm_id", item.utmCode);
  return `${baseUrl}?${params.toString()}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
      title="Copy UTM link"
      data-testid="button-copy-utm"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function PlaylistsPage() {
  const { toast } = useToast();
  const [openPlaylistId, setOpenPlaylistId] = useState<number | null>(null);

  const { data: playlists = [], isLoading } = useQuery<PlaylistSummary[]>({
    queryKey: ["/api/playlists"],
  });

  const { data: detail, isLoading: detailLoading } = useQuery<PlaylistDetail>({
    queryKey: ["/api/playlists", openPlaylistId],
    enabled: openPlaylistId !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/playlists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setOpenPlaylistId(null);
      toast({ title: "Playlist deleted" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ playlistId, itemId }: { playlistId: number; itemId: number }) =>
      apiRequest("DELETE", `/api/playlists/${playlistId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", openPlaylistId] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Playlists</h1>
        <p className="text-muted-foreground mt-1">
          Video collections from the Global Library — each with unique UTM tracking per platform.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <Card className="p-12 text-center">
          <ListVideo className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">No playlists yet</CardTitle>
          <CardDescription>
            Go to the Video Library, select videos, and click "Add to Playlist" to get started.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((pl) => (
            <Card
              key={pl.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              data-testid={`card-playlist-${pl.id}`}
              onClick={() => setOpenPlaylistId(pl.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{pl.name}</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Play className="h-3.5 w-3.5" />
                  <span>{pl.itemCount} video{pl.itemCount !== 1 ? "s" : ""}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <span className="text-xs text-muted-foreground">
                  {pl.createdAt ? format(new Date(pl.createdAt), "d MMM yyyy") : ""}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Playlist detail sheet */}
      <Sheet open={openPlaylistId !== null} onOpenChange={(o) => !o && setOpenPlaylistId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between pr-6">
              <span className="flex items-center gap-2">
                <ListVideo className="h-5 w-5 text-primary" />
                {detail?.name ?? "Playlist"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => openPlaylistId !== null && deleteMutation.mutate(openPlaylistId)}
                data-testid="button-delete-playlist"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {detailLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
            ) : !detail?.items?.length ? (
              <p className="text-center text-muted-foreground py-8">This playlist has no videos yet.</p>
            ) : (
              detail.items.map((item) => {
                const title = item.listing?.video?.title || item.listing?.listingTitle || "Untitled Video";
                const creator = item.listing?.creator?.displayName ?? "Unknown";
                const thumb = item.listing?.video?.thumbnailUrl;
                const utmUrl = buildUtmUrl(`${window.location.origin}/watch/${item.listingId}`, item);
                const platformLabel = PLATFORM_LABELS[item.utmSource ?? ""] ?? item.utmSource ?? "—";

                return (
                  <div key={item.id} className="rounded-xl border p-3 flex gap-3" data-testid={`playlist-item-${item.id}`}>
                    {/* Thumbnail */}
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <Play className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-medium text-sm line-clamp-1">{title}</p>
                      <p className="text-xs text-muted-foreground">by {creator}</p>

                      {/* UTM row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] py-0">
                          <BarChart2 className="h-2.5 w-2.5 mr-1" />
                          {platformLabel}
                        </Badge>
                        {item.utmCampaign && (
                          <Badge variant="outline" className="text-[10px] py-0">{item.utmCampaign}</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{item.utmCode}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-1">
                        <CopyButton text={utmUrl} />
                        <a
                          href={utmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                          data-testid={`link-utm-${item.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => removeItemMutation.mutate({ playlistId: openPlaylistId!, itemId: item.id })}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive ml-auto"
                          data-testid={`button-remove-item-${item.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
