import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoCard } from "@/components/VideoCard";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import { EmbedCodeModal } from "@/components/EmbedCodeModal";
import { Upload, Search, Grid, List, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video as VideoType, Brand } from "@shared/schema";

export default function MyVideos() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: videos = [], isLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const videoMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      videoUrl: string;
      brandIds: string[];
    }) => {
      return apiRequest("POST", "/api/videos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video Published!",
        description: "Your video is now being processed for product detection.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your video.",
        variant: "destructive",
      });
    },
  });

  const referralMutation = useMutation({
    mutationFn: async (data: {
      brandName: string;
      prContactName: string;
      prContactEmail: string;
      productCategory?: string;
      message?: string;
    }) => {
      return apiRequest("POST", "/api/referrals", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({
        title: "Referral Sent!",
        description: `We've sent an invitation to ${variables.brandName}.`,
      });
    },
    onError: () => {
      toast({
        title: "Referral Failed",
        description: "There was an error sending the referral.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video Deleted",
        description: "The video has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the video.",
        variant: "destructive",
      });
    },
  });

  const handleVideoUpload = async (data: {
    title: string;
    description?: string;
    videoUrl: string;
    selectedBrands: string[];
  }) => {
    await videoMutation.mutateAsync({
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      brandIds: data.selectedBrands,
    });
  };

  const handleReferBrand = async (data: {
    brandName: string;
    prContactName: string;
    prContactEmail: string;
    productCategory?: string;
    message?: string;
  }) => {
    await referralMutation.mutateAsync(data);
  };

  const handleViewEmbed = (video: VideoType) => {
    setSelectedVideo(video);
    setEmbedModalOpen(true);
  };

  const handleDelete = async (video: VideoType) => {
    await deleteMutation.mutateAsync(video.id);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Videos</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your uploaded videos
          </p>
        </div>
        <Button 
          onClick={() => setUploadModalOpen(true)} 
          className="rounded-full gap-2 w-full sm:w-auto"
          data-testid="button-upload-video-page"
        >
          <Upload className="h-4 w-4" />
          Upload Video
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-videos"
          />
        </div>
        <div className="flex gap-2">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Video className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || statusFilter !== "all" ? "No videos found" : "No videos yet"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Upload your first video to start generating revenue with product detection and affiliate tracking."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button 
              onClick={() => setUploadModalOpen(true)} 
              className="rounded-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Your First Video
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-4"
        }>
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onViewEmbed={handleViewEmbed}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <VideoUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        brands={brands}
        onUpload={handleVideoUpload}
        onReferBrand={handleReferBrand}
      />

      <EmbedCodeModal
        open={embedModalOpen}
        onOpenChange={setEmbedModalOpen}
        video={selectedVideo}
      />
    </div>
  );
}
