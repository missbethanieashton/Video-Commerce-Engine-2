import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, MapPin, Upload, Save, Image, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { COUNTRIES } from "@shared/schema";
import type { UserProfile, User } from "@shared/schema";

const profileFormSchema = z.object({
  bio: z.string().max(100, "Bio must be 100 characters or less").optional(),
  profileMediaUrl: z.string().url().optional().or(z.literal("")),
  profileMediaType: z.enum(["image", "video"]).optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [bioLength, setBioLength] = useState(0);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      bio: "",
      profileMediaUrl: "",
      profileMediaType: "image",
      locationCity: "",
      locationCountry: "",
    },
  });

  const { reset } = form;

  useState(() => {
    if (profile) {
      reset({
        bio: profile.bio || "",
        profileMediaUrl: profile.profileMediaUrl || "",
        profileMediaType: (profile.profileMediaType as "image" | "video") || "image",
        locationCity: profile.locationCity || "",
        locationCountry: profile.locationCountry || "",
      });
      setBioLength(profile.bio?.length || 0);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile updated",
        description: "Your personal details have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-[#43484D] dark:text-white">Personal Details</h1>
          <p className="text-muted-foreground">Manage your profile information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Media</CardTitle>
            <CardDescription>
              Upload a profile image or video (MP4)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={form.watch("profileMediaUrl") || user?.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {user?.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="profileMediaUrl">Media URL</Label>
                <Input
                  id="profileMediaUrl"
                  placeholder="https://example.com/your-media.jpg"
                  {...form.register("profileMediaUrl")}
                  data-testid="input-profile-media-url"
                />
              </div>
            </div>

            <div>
              <Label>Media Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={form.watch("profileMediaType") === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => form.setValue("profileMediaType", "image")}
                  data-testid="button-media-type-image"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button
                  type="button"
                  variant={form.watch("profileMediaType") === "video" ? "default" : "outline"}
                  size="sm"
                  onClick={() => form.setValue("profileMediaType", "video")}
                  data-testid="button-media-type-video"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video (MP4)
                </Button>
              </div>
            </div>

            {form.watch("profileMediaType") === "video" && form.watch("profileMediaUrl") && (
              <div className="mt-4">
                <video
                  src={form.watch("profileMediaUrl")}
                  controls
                  className="w-full rounded-lg max-h-48"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bio</CardTitle>
            <CardDescription>
              Write a short bio about yourself (max 100 characters)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="Tell us about yourself..."
                className="resize-none"
                maxLength={100}
                {...form.register("bio", {
                  onChange: (e) => setBioLength(e.target.value.length),
                })}
                data-testid="input-bio"
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {bioLength}/100 characters
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
          <CardDescription>
            Share your location to help brands and affiliates find you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="locationCity">City</Label>
                <Input
                  id="locationCity"
                  placeholder="e.g., London"
                  {...form.register("locationCity")}
                  data-testid="input-location-city"
                />
              </div>

              <div>
                <Label htmlFor="locationCountry">Country</Label>
                <Select
                  value={form.watch("locationCountry") || ""}
                  onValueChange={(value) => form.setValue("locationCountry", value)}
                >
                  <SelectTrigger data-testid="select-location-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
