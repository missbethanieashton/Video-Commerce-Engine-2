import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Upload, X, Check, ChevronsUpDown, Plus, Send, Loader2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import type { Brand } from "@shared/schema";

const videoUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  brandIds: z.array(z.string()).optional(),
});

const referralSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  prContactName: z.string().min(1, "Contact name is required"),
  prContactEmail: z.string().email("Valid email required"),
  productCategory: z.string().optional(),
  message: z.string().optional(),
});

type VideoUploadForm = z.infer<typeof videoUploadSchema>;
type ReferralForm = z.infer<typeof referralSchema>;

interface VideoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: Brand[];
  onUpload: (data: VideoUploadForm & { videoUrl: string; selectedBrands: string[] }) => Promise<void>;
  onReferBrand: (data: ReferralForm) => Promise<void>;
}

export function VideoUploadModal({ 
  open, 
  onOpenChange, 
  brands, 
  onUpload, 
  onReferBrand 
}: VideoUploadModalProps) {
  const [step, setStep] = useState<"upload" | "details" | "refer">("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setVideoUrl(response.objectPath);
      setStep("details");
    },
  });

  const form = useForm<VideoUploadForm>({
    resolver: zodResolver(videoUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      brandIds: [],
    },
  });

  const referralForm = useForm<ReferralForm>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      brandName: "",
      prContactName: "",
      prContactEmail: "",
      productCategory: "",
      message: "",
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      await uploadFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      await uploadFile(file);
    }
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleSubmit = async (data: VideoUploadForm) => {
    setIsSubmitting(true);
    try {
      await onUpload({
        ...data,
        videoUrl,
        selectedBrands,
      });
      resetAndClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReferralSubmit = async (data: ReferralForm) => {
    setIsSubmitting(true);
    try {
      await onReferBrand(data);
      setStep("details");
      referralForm.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep("upload");
    setVideoFile(null);
    setVideoUrl("");
    setSelectedBrands([]);
    form.reset();
    referralForm.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === "upload" && "Upload Video"}
            {step === "details" && "Video Details"}
            {step === "refer" && "Refer a Brand"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload your video to get started"}
            {step === "details" && "Add details and select featured brands"}
            {step === "refer" && "Can't find a brand? Refer them to join the platform"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("video-input")?.click()}
          >
            <input
              id="video-input"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-video-file"
            />
            
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Uploading... {progress}%
                </p>
                <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Drop your video here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    MP4, MOV, WebM up to 500MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {videoFile && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{videoFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                      Uploaded
                    </Badge>
                  </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter video title" 
                        {...field}
                        data-testid="input-video-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your video content"
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-video-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <Label>Featured Brands</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedBrands.map((brandId) => {
                    const brand = brands.find((b) => b.id === brandId);
                    return brand ? (
                      <Badge
                        key={brandId}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {brand.name}
                        <button
                          type="button"
                          onClick={() => toggleBrand(brandId)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
                
                <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      data-testid="button-select-brands"
                    >
                      Select brands featured in your video
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search brands..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                              Brand not found?
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBrandPopoverOpen(false);
                                setStep("refer");
                              }}
                              className="gap-2"
                              data-testid="button-refer-brand"
                            >
                              <Plus className="h-4 w-4" />
                              Refer a Brand
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {brands.map((brand) => (
                            <CommandItem
                              key={brand.id}
                              value={brand.name}
                              onSelect={() => toggleBrand(brand.id)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedBrands.includes(brand.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {brand.name}
                              {brand.category && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {brand.category}
                                </Badge>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("refer")}
                  className="gap-2 text-muted-foreground"
                  data-testid="button-refer-new-brand"
                >
                  <Plus className="h-4 w-4" />
                  Can't find a brand? Refer them to join
                </Button>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Video"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === "refer" && (
          <Form {...referralForm}>
            <form onSubmit={referralForm.handleSubmit(handleReferralSubmit)} className="space-y-6">
              <Card className="bg-gradient-to-r from-primary/10 to-chart-2/10 border-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Grow Our Network</p>
                      <p className="text-sm text-muted-foreground">
                        Help us bring more brands to the platform. We'll send them an invitation email on your behalf.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <FormField
                control={referralForm.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Nike, Apple, Adidas" 
                        {...field}
                        data-testid="input-referral-brand-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={referralForm.control}
                  name="prContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PR Contact Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contact person" 
                          {...field}
                          data-testid="input-referral-contact-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={referralForm.control}
                  name="prContactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PR Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="pr@brand.com" 
                          {...field}
                          data-testid="input-referral-contact-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={referralForm.control}
                name="productCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Category (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Fashion, Electronics, Beauty" 
                        {...field}
                        data-testid="input-referral-category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={referralForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a personal note to your referral..."
                        className="min-h-[80px]"
                        {...field}
                        data-testid="input-referral-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex justify-between gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setStep("details")}
                >
                  Back to Video
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-full gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Referral
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
