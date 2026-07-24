import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Camera, MapPin, Upload, Save, X, Loader2, Image as ImageIcon,
  Video, Check, Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { COUNTRIES } from "@shared/schema";
import type { UserProfile, User } from "@shared/schema";

const identitySchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const locationSchema = z.object({
  bio: z.string().max(100, "Bio must be 100 characters or less").optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().optional(),
});

type IdentityForm = z.infer<typeof identitySchema>;
type LocationForm = z.infer<typeof locationSchema>;

const ROLE_LABELS: Record<string, string> = {
  creator: "Creator",
  brand: "Brand",
  affiliate: "Publisher",
};

const ROLE_COLORS: Record<string, string> = {
  creator: "bg-primary/10 text-primary border-primary/20",
  brand: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  affiliate: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [bioLength, setBioLength] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [savedIdentity, setSavedIdentity] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/me/profile"],
  });

  const identityForm = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    values: {
      displayName: user?.displayName ?? "",
      username: user?.username ?? "",
    },
  });

  const locationForm = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    values: {
      bio: profile?.bio ?? "",
      locationCity: profile?.locationCity ?? "",
      locationCountry: profile?.locationCountry ?? "",
    },
  });

  const identityMutation = useMutation({
    mutationFn: async (data: IdentityForm) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setSavedIdentity(true);
      setTimeout(() => setSavedIdentity(false), 2500);
      toast({ title: "Profile saved", description: "Your name and username have been updated." });
    },
    onError: () => toast({ title: "Error", description: "Could not update profile.", variant: "destructive" }),
  });

  const locationMutation = useMutation({
    mutationFn: async (data: LocationForm) => {
      const profilePayload: Record<string, any> = { ...data };
      if (mediaPreview) {
        profilePayload.profileMediaUrl = mediaPreview;
        profilePayload.profileMediaType = mediaType ?? "image";
      }
      const res = await apiRequest("PATCH", "/api/users/me/profile", profilePayload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/profile"] });
      toast({ title: "Profile saved", description: "Your bio and location have been updated." });
    },
    onError: () => toast({ title: "Error", description: "Could not save profile details.", variant: "destructive" }),
  });

  // Avatar / media upload
  const uploadFile = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast({ title: "Unsupported file", description: "Please use an image or video file.", variant: "destructive" });
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setMediaPreview(localPreview);
    setMediaType(isVideo ? "video" : "image");
    setIsUploading(true);
    try {
      const urlRes = await apiRequest("POST", "/api/uploads/request-url", {
        name: file.name, size: file.size, contentType: file.type,
      });
      const { uploadURL, objectPath } = await urlRes.json();
      await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const publicUrl = `/objects/${objectPath.replace(/^\//, "")}`;
      setMediaPreview(publicUrl);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload the file.", variant: "destructive" });
      setMediaPreview(null);
      setMediaType(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentPreview = mediaPreview || profile?.profileMediaUrl || user?.avatarUrl || "";
  const role = user?.role ?? "creator";
  const isLoading = userLoading || profileLoading;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your public-facing identity on MTRLZD</p>
      </div>

      {/* Avatar + role card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar with change button */}
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 border-2 border-border">
                {mediaType === "video" ? (
                  <AvatarFallback className="bg-primary/10 text-primary"><Video className="h-8 w-8" /></AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={currentPreview} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-semibold">
                      {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              {isUploading ? (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-change-avatar"
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/mov,video/webm"
                className="hidden"
                onChange={onFileChange}
                data-testid="input-avatar-file"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{user?.displayName || "Your Name"}</p>
              <p className="text-sm text-muted-foreground truncate">@{user?.username || "username"}</p>
              <div className="mt-2">
                <Badge
                  className={`text-xs font-semibold border ${ROLE_COLORS[role] || ROLE_COLORS.creator}`}
                  variant="outline"
                  data-testid="badge-role"
                >
                  {ROLE_LABELS[role] || "Creator"}
                </Badge>
              </div>
              {mediaPreview && mediaPreview !== profile?.profileMediaUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">New photo ready</p>
                  <button type="button" onClick={clearMedia} className="text-xs text-destructive hover:underline">Remove</button>
                </div>
              )}
            </div>
          </div>

          {/* Upload drop zone (shown only when no preview) */}
          {!mediaPreview && (
            <div
              data-testid="dropzone-profile-media"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <Upload className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-sm font-medium">{isDragging ? "Drop to upload" : "Upload profile photo"}</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, or MP4 · max 50 MB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display name + username — inline save */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Name & Username
          </CardTitle>
          <CardDescription>How you appear to others on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...identityForm}>
            <form onSubmit={identityForm.handleSubmit(d => identityMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={identityForm.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your name" data-testid="input-display-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={identityForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@username" data-testid="input-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Button
                type="submit"
                disabled={identityMutation.isPending}
                data-testid="button-save-identity"
                className="gap-2"
              >
                {savedIdentity ? (
                  <><Check className="h-4 w-4" /> Saved</>
                ) : identityMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="h-4 w-4" /> Save</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Bio + location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Bio & Location
          </CardTitle>
          <CardDescription>Help brands and collaborators discover you</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...locationForm}>
            <form onSubmit={locationForm.handleSubmit(d => locationMutation.mutate(d))} className="space-y-4">
              <FormField control={locationForm.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio <span className="text-muted-foreground font-normal">(max 100 chars)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself…"
                      className="resize-none"
                      maxLength={100}
                      onChange={e => { field.onChange(e); setBioLength(e.target.value.length); }}
                      data-testid="input-bio"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">{bioLength}/100</p>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={locationForm.control} name="locationCity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. London" data-testid="input-location-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select
                    value={locationForm.watch("locationCountry") || ""}
                    onValueChange={v => locationForm.setValue("locationCountry", v)}
                  >
                    <SelectTrigger data-testid="select-location-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={locationMutation.isPending || isUploading}
                  data-testid="button-save-profile"
                  className="gap-2"
                >
                  {locationMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
