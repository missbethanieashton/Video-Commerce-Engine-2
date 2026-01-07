import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, MousePointer, DollarSign, MoreVertical, Code } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Video } from "@shared/schema";

interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onViewEmbed?: (video: Video) => void;
  onDelete?: (video: Video) => void;
}

export function VideoCard({ video, onEdit, onViewEmbed, onDelete }: VideoCardProps) {
  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    processing: "bg-yellow-500/20 text-yellow-600",
    published: "bg-green-500/20 text-green-600",
    archived: "bg-gray-500/20 text-gray-600",
  };

  return (
    <Card className="overflow-hidden group">
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
          <Button variant="secondary" size="icon" className="rounded-full">
            <Play className="h-5 w-5" />
          </Button>
        </div>
        
        <Badge 
          className={`absolute top-3 left-3 ${statusColors[video.status || "draft"]}`}
          variant="secondary"
        >
          {video.status}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
              data-testid={`button-video-menu-${video.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(video)}>
              Edit Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewEmbed?.(video)}>
              <Code className="h-4 w-4 mr-2" />
              Get Embed Code
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(video)}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-2" data-testid={`text-video-title-${video.id}`}>
          {video.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {video.description || "No description"}
        </p>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Eye className="h-3 w-3" />
            </div>
            <p className="text-sm font-semibold">{video.totalViews || 0}</p>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MousePointer className="h-3 w-3" />
            </div>
            <p className="text-sm font-semibold">{video.totalClicks || 0}</p>
            <p className="text-xs text-muted-foreground">Clicks</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
            </div>
            <p className="text-sm font-semibold">${Number(video.totalRevenue || 0).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
