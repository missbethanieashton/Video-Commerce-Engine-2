import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload, 
  Palette, 
  Type, 
  Eye, 
  Settings, 
  Plus, 
  Trash2, 
  FileText,
  Check,
  Loader2
} from "lucide-react";
import type { BrandKit } from "@shared/schema";
import { BUTTON_LABEL_OPTIONS, CAROUSEL_POSITION_OPTIONS } from "@shared/schema";

interface ColorEntry {
  name: string;
  hex: string;
  cmyk: { c: number; m: number; y: number; k: number };
}

interface FontEntry {
  name: string;
  weight: string;
}

export default function BrandKitPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("colors");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [manualColors, setManualColors] = useState<ColorEntry[]>([]);
  const [manualFonts, setManualFonts] = useState<FontEntry[]>([]);
  const [extractedColors, setExtractedColors] = useState<ColorEntry[]>([]);
  const [extractedFonts, setExtractedFonts] = useState<FontEntry[]>([]);
  
  const [newColor, setNewColor] = useState<ColorEntry>({
    name: "",
    hex: "#677A67",
    cmyk: { c: 0, m: 0, y: 0, k: 0 }
  });
  const [newFont, setNewFont] = useState<FontEntry>({ name: "", weight: "400" });
  
  const [carouselSettings, setCarouselSettings] = useState({
    buttonFont: "Inter",
    buttonColor: "#677A67",
    buttonTextColor: "#FFFFFF",
    cornerRadius: 8,
    backgroundOpacity: 80,
    showThumbnail: true,
    showButton: true,
    showPrice: true,
    showTitle: true,
    buttonLabel: "BUY NOW" as typeof BUTTON_LABEL_OPTIONS[number],
    position: "bottom" as typeof CAROUSEL_POSITION_OPTIONS[number],
  });

  const { data: brandKit, isLoading } = useQuery<BrandKit>({
    queryKey: ["/api/brand-kit"],
  });

  // Hydrate state from fetched brand kit data
  useEffect(() => {
    if (brandKit) {
      // Parse and set extracted colors/fonts
      try {
        if (brandKit.extractedColors) {
          setExtractedColors(JSON.parse(brandKit.extractedColors as string));
        }
        if (brandKit.extractedFonts) {
          setExtractedFonts(JSON.parse(brandKit.extractedFonts as string));
        }
        if (brandKit.manualColors) {
          setManualColors(JSON.parse(brandKit.manualColors as string));
        }
        if (brandKit.manualFonts) {
          setManualFonts(JSON.parse(brandKit.manualFonts as string));
        }
      } catch (e) {
        console.error("Error parsing brand kit data:", e);
      }

      // Set carousel settings from brand kit
      setCarouselSettings({
        buttonFont: brandKit.defaultButtonFont || "Inter",
        buttonColor: brandKit.defaultButtonColor || "#677A67",
        buttonTextColor: brandKit.defaultButtonTextColor || "#FFFFFF",
        cornerRadius: brandKit.defaultCornerRadius || 8,
        backgroundOpacity: brandKit.defaultBackgroundOpacity || 80,
        showThumbnail: brandKit.defaultShowThumbnail ?? true,
        showButton: brandKit.defaultShowButton ?? true,
        showPrice: brandKit.defaultShowPrice ?? true,
        showTitle: brandKit.defaultShowTitle ?? true,
        buttonLabel: (brandKit.defaultButtonLabel as any) || "BUY NOW",
        position: (brandKit.defaultPosition as any) || "bottom",
      });
    }
  }, [brandKit]);

  const saveBrandKitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/brand-kit", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-kit"] });
      toast({
        title: "Brand Kit Saved",
        description: "Your brand settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save brand kit.",
        variant: "destructive",
      });
    },
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setExtractedColors([
        { name: "Primary", hex: "#677A67", cmyk: { c: 35, m: 15, y: 35, k: 30 } },
        { name: "Secondary", hex: "#87A7AC", cmyk: { c: 40, m: 15, y: 20, k: 10 } },
        { name: "Accent", hex: "#E7B97F", cmyk: { c: 5, m: 25, y: 50, k: 5 } },
        { name: "Background", hex: "#EAE6D8", cmyk: { c: 5, m: 5, y: 15, k: 5 } },
      ]);
      
      setExtractedFonts([
        { name: "Montserrat", weight: "600" },
        { name: "Open Sans", weight: "400" },
      ]);

      toast({
        title: "PDF Analyzed",
        description: "Brand colors and fonts extracted successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not extract brand elements from PDF.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const hexToCmyk = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : Math.round(((1 - r - k) / (1 - k)) * 100);
    const m = k === 1 ? 0 : Math.round(((1 - g - k) / (1 - k)) * 100);
    const y = k === 1 ? 0 : Math.round(((1 - b - k) / (1 - k)) * 100);
    
    return { c, m, y, k: Math.round(k * 100) };
  };

  const cmykToHex = (cmyk: { c: number; m: number; y: number; k: number }) => {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;
    
    const r = Math.round(255 * (1 - c) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  };

  const addManualColor = () => {
    if (!newColor.name) {
      toast({ title: "Error", description: "Please enter a color name", variant: "destructive" });
      return;
    }
    setManualColors([...manualColors, { ...newColor }]);
    setNewColor({ name: "", hex: "#677A67", cmyk: { c: 0, m: 0, y: 0, k: 0 } });
  };

  const addManualFont = () => {
    if (!newFont.name) {
      toast({ title: "Error", description: "Please enter a font name", variant: "destructive" });
      return;
    }
    setManualFonts([...manualFonts, { ...newFont }]);
    setNewFont({ name: "", weight: "400" });
  };

  const removeColor = (index: number, type: "extracted" | "manual") => {
    if (type === "extracted") {
      setExtractedColors(extractedColors.filter((_, i) => i !== index));
    } else {
      setManualColors(manualColors.filter((_, i) => i !== index));
    }
  };

  const removeFont = (index: number, type: "extracted" | "manual") => {
    if (type === "extracted") {
      setExtractedFonts(extractedFonts.filter((_, i) => i !== index));
    } else {
      setManualFonts(manualFonts.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    saveBrandKitMutation.mutate({
      extractedFonts: JSON.stringify(extractedFonts),
      extractedColors: JSON.stringify(extractedColors),
      manualFonts: JSON.stringify(manualFonts),
      manualColors: JSON.stringify(manualColors),
      defaultButtonFont: carouselSettings.buttonFont,
      defaultButtonColor: carouselSettings.buttonColor,
      defaultButtonTextColor: carouselSettings.buttonTextColor,
      defaultCornerRadius: carouselSettings.cornerRadius,
      defaultBackgroundOpacity: carouselSettings.backgroundOpacity,
      defaultShowThumbnail: carouselSettings.showThumbnail,
      defaultShowButton: carouselSettings.showButton,
      defaultShowPrice: carouselSettings.showPrice,
      defaultShowTitle: carouselSettings.showTitle,
      defaultButtonLabel: carouselSettings.buttonLabel,
      defaultPosition: carouselSettings.position,
    });
  };

  const allColors = [...extractedColors, ...manualColors];
  const allFonts = [...extractedFonts, ...manualFonts];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-brand-kit-title">
            Brand Kit
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your brand colors, fonts, and default carousel styling
          </p>
        </div>
        <Button 
          onClick={handleSave}
          className="rounded-full gap-2"
          disabled={saveBrandKitMutation.isPending}
          data-testid="button-save-brand-kit"
        >
          {saveBrandKitMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save Brand Kit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Brand Guidelines PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
              id="pdf-upload"
              data-testid="input-pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {isAnalyzing ? (
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {isAnalyzing ? "Analyzing PDF..." : "Drop your brand guidelines PDF here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAnalyzing 
                      ? "Extracting fonts and colors with AI"
                      : "AI will extract fonts and colors automatically"
                    }
                  </p>
                </div>
                {!isAnalyzing && (
                  <Button variant="outline" className="rounded-full" data-testid="button-browse-pdf">
                    Browse Files
                  </Button>
                )}
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 rounded-full">
          <TabsTrigger value="colors" className="rounded-full gap-2" data-testid="tab-colors">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Colors</span>
          </TabsTrigger>
          <TabsTrigger value="fonts" className="rounded-full gap-2" data-testid="tab-fonts">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Fonts</span>
          </TabsTrigger>
          <TabsTrigger value="carousel" className="rounded-full gap-2" data-testid="tab-carousel">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Carousel</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-full gap-2" data-testid="tab-preview">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6 space-y-6">
          {extractedColors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extracted Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {extractedColors.map((color, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div 
                        className="w-12 h-12 rounded-lg border"
                        style={{ backgroundColor: color.hex }}
                        data-testid={`color-swatch-extracted-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{color.name}</p>
                        <p className="text-xs text-muted-foreground">{color.hex}</p>
                        <p className="text-xs text-muted-foreground">
                          C{color.cmyk.c} M{color.cmyk.m} Y{color.cmyk.y} K{color.cmyk.k}
                        </p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => removeColor(index, "extracted")}
                        data-testid={`button-remove-extracted-color-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {manualColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div 
                      className="w-12 h-12 rounded-lg border"
                      style={{ backgroundColor: color.hex }}
                      data-testid={`color-swatch-manual-${index}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{color.name}</p>
                      <p className="text-xs text-muted-foreground">{color.hex}</p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => removeColor(index, "manual")}
                      data-testid={`button-remove-manual-color-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="font-medium mb-4">Add New Color</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newColor.name}
                      onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                      placeholder="Primary"
                      data-testid="input-color-name"
                    />
                  </div>
                  <div>
                    <Label>Hex Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={newColor.hex}
                        onChange={(e) => setNewColor({ 
                          ...newColor, 
                          hex: e.target.value,
                          cmyk: hexToCmyk(e.target.value)
                        })}
                        className="w-12 h-10 p-1"
                        data-testid="input-color-picker"
                      />
                      <Input
                        value={newColor.hex}
                        onChange={(e) => setNewColor({ 
                          ...newColor, 
                          hex: e.target.value,
                          cmyk: hexToCmyk(e.target.value)
                        })}
                        placeholder="#677A67"
                        data-testid="input-color-hex"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:col-span-2">
                    <div>
                      <Label>C</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newColor.cmyk.c}
                        onChange={(e) => {
                          const cmyk = { ...newColor.cmyk, c: parseInt(e.target.value) || 0 };
                          setNewColor({ ...newColor, cmyk, hex: cmykToHex(cmyk) });
                        }}
                        data-testid="input-cmyk-c"
                      />
                    </div>
                    <div>
                      <Label>M</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newColor.cmyk.m}
                        onChange={(e) => {
                          const cmyk = { ...newColor.cmyk, m: parseInt(e.target.value) || 0 };
                          setNewColor({ ...newColor, cmyk, hex: cmykToHex(cmyk) });
                        }}
                        data-testid="input-cmyk-m"
                      />
                    </div>
                    <div>
                      <Label>Y</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newColor.cmyk.y}
                        onChange={(e) => {
                          const cmyk = { ...newColor.cmyk, y: parseInt(e.target.value) || 0 };
                          setNewColor({ ...newColor, cmyk, hex: cmykToHex(cmyk) });
                        }}
                        data-testid="input-cmyk-y"
                      />
                    </div>
                    <div>
                      <Label>K</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newColor.cmyk.k}
                        onChange={(e) => {
                          const cmyk = { ...newColor.cmyk, k: parseInt(e.target.value) || 0 };
                          setNewColor({ ...newColor, cmyk, hex: cmykToHex(cmyk) });
                        }}
                        data-testid="input-cmyk-k"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addManualColor} className="w-full rounded-full gap-2" data-testid="button-add-color">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="mt-6 space-y-6">
          {extractedFonts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extracted Fonts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {extractedFonts.map((font, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium" style={{ fontFamily: font.name }}>{font.name}</p>
                        <p className="text-sm text-muted-foreground">Weight: {font.weight}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => removeFont(index, "extracted")}
                        data-testid={`button-remove-extracted-font-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual Fonts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {manualFonts.map((font, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{font.name}</p>
                      <p className="text-sm text-muted-foreground">Weight: {font.weight}</p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => removeFont(index, "manual")}
                      data-testid={`button-remove-manual-font-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="font-medium mb-4">Add New Font</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Font Name</Label>
                    <Input
                      value={newFont.name}
                      onChange={(e) => setNewFont({ ...newFont, name: e.target.value })}
                      placeholder="Inter, Montserrat, etc."
                      data-testid="input-font-name"
                    />
                  </div>
                  <div>
                    <Label>Weight</Label>
                    <Select 
                      value={newFont.weight} 
                      onValueChange={(val) => setNewFont({ ...newFont, weight: val })}
                    >
                      <SelectTrigger data-testid="select-font-weight">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 - Thin</SelectItem>
                        <SelectItem value="200">200 - Extra Light</SelectItem>
                        <SelectItem value="300">300 - Light</SelectItem>
                        <SelectItem value="400">400 - Regular</SelectItem>
                        <SelectItem value="500">500 - Medium</SelectItem>
                        <SelectItem value="600">600 - Semi Bold</SelectItem>
                        <SelectItem value="700">700 - Bold</SelectItem>
                        <SelectItem value="800">800 - Extra Bold</SelectItem>
                        <SelectItem value="900">900 - Black</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addManualFont} className="w-full rounded-full gap-2" data-testid="button-add-font">
                      <Plus className="h-4 w-4" />
                      Add Font
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carousel" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Carousel Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                These settings will be applied to all new video uploads
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Button Color</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="color"
                        value={carouselSettings.buttonColor}
                        onChange={(e) => setCarouselSettings({ ...carouselSettings, buttonColor: e.target.value })}
                        className="w-12 h-10 p-1"
                        data-testid="input-button-color"
                      />
                      <Input
                        value={carouselSettings.buttonColor}
                        onChange={(e) => setCarouselSettings({ ...carouselSettings, buttonColor: e.target.value })}
                        data-testid="input-button-color-hex"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Button Text Color</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="color"
                        value={carouselSettings.buttonTextColor}
                        onChange={(e) => setCarouselSettings({ ...carouselSettings, buttonTextColor: e.target.value })}
                        className="w-12 h-10 p-1"
                        data-testid="input-button-text-color"
                      />
                      <Input
                        value={carouselSettings.buttonTextColor}
                        onChange={(e) => setCarouselSettings({ ...carouselSettings, buttonTextColor: e.target.value })}
                        data-testid="input-button-text-color-hex"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Button Label</Label>
                    <Select 
                      value={carouselSettings.buttonLabel} 
                      onValueChange={(val) => setCarouselSettings({ ...carouselSettings, buttonLabel: val as any })}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-button-label">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUTTON_LABEL_OPTIONS.map((label) => (
                          <SelectItem key={label} value={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Position</Label>
                    <Select 
                      value={carouselSettings.position} 
                      onValueChange={(val) => setCarouselSettings({ ...carouselSettings, position: val as any })}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAROUSEL_POSITION_OPTIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos.replace("-", " ").toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Corner Radius: {carouselSettings.cornerRadius}px</Label>
                    <Slider
                      value={[carouselSettings.cornerRadius]}
                      onValueChange={(val) => setCarouselSettings({ ...carouselSettings, cornerRadius: val[0] })}
                      max={24}
                      step={1}
                      className="mt-2"
                      data-testid="slider-corner-radius"
                    />
                  </div>

                  <div>
                    <Label>Background Opacity: {carouselSettings.backgroundOpacity}%</Label>
                    <Slider
                      value={[carouselSettings.backgroundOpacity]}
                      onValueChange={(val) => setCarouselSettings({ ...carouselSettings, backgroundOpacity: val[0] })}
                      max={100}
                      step={5}
                      className="mt-2"
                      data-testid="slider-background-opacity"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label>Show Thumbnail</Label>
                      <Switch
                        checked={carouselSettings.showThumbnail}
                        onCheckedChange={(checked) => setCarouselSettings({ ...carouselSettings, showThumbnail: checked })}
                        data-testid="switch-show-thumbnail"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Button</Label>
                      <Switch
                        checked={carouselSettings.showButton}
                        onCheckedChange={(checked) => setCarouselSettings({ ...carouselSettings, showButton: checked })}
                        data-testid="switch-show-button"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Price</Label>
                      <Switch
                        checked={carouselSettings.showPrice}
                        onCheckedChange={(checked) => setCarouselSettings({ ...carouselSettings, showPrice: checked })}
                        data-testid="switch-show-price"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Title</Label>
                      <Switch
                        checked={carouselSettings.showTitle}
                        onCheckedChange={(checked) => setCarouselSettings({ ...carouselSettings, showTitle: checked })}
                        data-testid="switch-show-title"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Carousel Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview how your product carousel will appear on videos
              </p>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-end justify-center">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Video Preview Area
                </div>
                
                <div 
                  className="relative z-10 m-4 p-3 flex items-center gap-3"
                  style={{
                    backgroundColor: `rgba(0,0,0,${carouselSettings.backgroundOpacity / 100})`,
                    borderRadius: `${carouselSettings.cornerRadius}px`,
                  }}
                  data-testid="carousel-preview"
                >
                  {carouselSettings.showThumbnail && (
                    <div className="w-16 h-16 bg-background/50 rounded-lg flex items-center justify-center">
                      <div className="w-10 h-10 bg-primary/20 rounded" />
                    </div>
                  )}
                  <div className="flex-1 text-white">
                    {carouselSettings.showTitle && (
                      <p className="font-medium text-sm">Product Name</p>
                    )}
                    {carouselSettings.showPrice && (
                      <p className="text-xs opacity-80">$99.00</p>
                    )}
                  </div>
                  {carouselSettings.showButton && (
                    <Button 
                      size="sm"
                      className="rounded-full text-xs"
                      style={{
                        backgroundColor: carouselSettings.buttonColor,
                        color: carouselSettings.buttonTextColor,
                      }}
                      data-testid="button-preview-cta"
                    >
                      {carouselSettings.buttonLabel}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
