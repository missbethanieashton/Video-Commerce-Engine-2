import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ListVideo, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const PLATFORMS = [
  { value: "instagram",  label: "Instagram" },
  { value: "tiktok",    label: "TikTok" },
  { value: "youtube",   label: "YouTube" },
  { value: "website",   label: "Website / Blog" },
  { value: "twitter",   label: "X (Twitter)" },
  { value: "facebook",  label: "Facebook" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "email",     label: "Email / Newsletter" },
  { value: "other",     label: "Other" },
];

type Playlist = { id: number; name: string; description: string | null; itemCount: number };

interface Props {
  open: boolean;
  onClose: () => void;
  selectedListingIds: string[];
}

export function AddToPlaylistModal({ open, onClose, selectedListingIds }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [done, setDone] = useState(false);

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
    enabled: open,
  });

  const createAndAdd = useMutation({
    mutationFn: async () => {
      let playlistId: number;

      if (tab === "new") {
        if (!newName.trim()) throw new Error("Playlist name required");
        const res = await apiRequest("POST", "/api/playlists", {
          name: newName.trim(),
        });
        const pl = await res.json();
        playlistId = pl.id;
      } else {
        if (!selectedPlaylistId) throw new Error("Select a playlist");
        playlistId = Number(selectedPlaylistId);
      }

      await apiRequest("POST", `/api/playlists/${playlistId}/items`, {
        listingIds: selectedListingIds,
        utmSource,
        utmMedium: "video",
        utmCampaign: utmCampaign.trim() || undefined,
      });

      return playlistId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setDone(true);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setDone(false);
    setTab("existing");
    setSelectedPlaylistId("");
    setNewName("");
    setUtmCampaign("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-primary" />
            Add to Playlist
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-semibold text-lg">Videos added!</p>
            <p className="text-sm text-muted-foreground">
              {selectedListingIds.length} video{selectedListingIds.length !== 1 ? "s" : ""} added
              to your playlist with UTM tracking.
            </p>
            <Button onClick={handleClose} className="mt-2 rounded-full">Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedListingIds.length} video{selectedListingIds.length !== 1 ? "s" : ""} selected</Badge>
              </div>

              {/* Playlist selection */}
              <Tabs value={tab} onValueChange={(v) => setTab(v as "existing" | "new")}>
                <TabsList className="w-full">
                  <TabsTrigger value="existing" className="flex-1" data-testid="tab-existing-playlist">
                    Existing Playlist
                  </TabsTrigger>
                  <TabsTrigger value="new" className="flex-1" data-testid="tab-new-playlist">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    New Playlist
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="mt-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-16">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : playlists.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No playlists yet. Create one using the "New Playlist" tab.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          data-testid={`playlist-option-${pl.id}`}
                          onClick={() => setSelectedPlaylistId(String(pl.id))}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                            selectedPlaylistId === String(pl.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="font-medium">{pl.name}</div>
                          <div className="text-xs text-muted-foreground">{pl.itemCount} video{pl.itemCount !== 1 ? "s" : ""}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="new" className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="playlist-name">Playlist name</Label>
                    <Input
                      id="playlist-name"
                      placeholder="e.g., Summer Campaign 2026"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      data-testid="input-playlist-name"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* UTM settings */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  UTM Tracking
                </p>

                <div>
                  <Label htmlFor="utm-source">Publishing platform</Label>
                  <Select value={utmSource} onValueChange={setUtmSource}>
                    <SelectTrigger id="utm-source" data-testid="select-utm-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="utm-campaign">Campaign name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="utm-campaign"
                    placeholder="e.g., summer_2026"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    data-testid="input-utm-campaign"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Each video gets a unique UTM code so you can track clicks, conversions and commissions per platform and publisher.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-playlist">
                Cancel
              </Button>
              <Button
                onClick={() => createAndAdd.mutate()}
                disabled={createAndAdd.isPending || (tab === "existing" && !selectedPlaylistId) || (tab === "new" && !newName.trim())}
                data-testid="button-confirm-add-playlist"
              >
                {createAndAdd.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add to Playlist
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
