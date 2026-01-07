import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Settings,
  Eye,
  EyeOff,
  Move,
  RotateCcw,
} from "lucide-react";
import { BUTTON_LABEL_OPTIONS, CAROUSEL_POSITION_OPTIONS } from "@shared/schema";

export interface CarouselSettings {
  position: typeof CAROUSEL_POSITION_OPTIONS[number];
  positionOffsetX: number;
  positionOffsetY: number;
  delayUntilEnd: boolean;
  cornerRadius: number;
  backgroundOpacity: number;
  showThumbnail: boolean;
  showButton: boolean;
  showPrice: boolean;
  showTitle: boolean;
  buttonLabel: typeof BUTTON_LABEL_OPTIONS[number];
  buttonColor: string;
  buttonTextColor: string;
}

interface ProductCarouselEditorProps {
  settings: CarouselSettings;
  onChange: (settings: CarouselSettings) => void;
  onReset?: () => void;
  compact?: boolean;
}

const defaultSettings: CarouselSettings = {
  position: "bottom",
  positionOffsetX: 0,
  positionOffsetY: 0,
  delayUntilEnd: false,
  cornerRadius: 8,
  backgroundOpacity: 80,
  showThumbnail: true,
  showButton: true,
  showPrice: true,
  showTitle: true,
  buttonLabel: "BUY NOW",
  buttonColor: "#677A67",
  buttonTextColor: "#FFFFFF",
};

export function ProductCarouselEditor({ 
  settings, 
  onChange, 
  onReset,
  compact = false 
}: ProductCarouselEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  const updateSetting = <K extends keyof CarouselSettings>(
    key: K, 
    value: CarouselSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onChange(defaultSettings);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Carousel Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1"
            data-testid="button-toggle-preview"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleReset}
            className="gap-1"
            data-testid="button-reset-settings"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-end justify-center mb-4">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Video Preview
          </div>
          
          <div 
            className="relative z-10 m-4 p-3 flex items-center gap-3 max-w-xs"
            style={{
              backgroundColor: `rgba(0,0,0,${settings.backgroundOpacity / 100})`,
              borderRadius: `${settings.cornerRadius}px`,
            }}
            data-testid="carousel-preview-element"
          >
            {settings.showThumbnail && (
              <div className="w-12 h-12 bg-background/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-8 h-8 bg-primary/20 rounded" />
              </div>
            )}
            <div className="flex-1 text-white min-w-0">
              {settings.showTitle && (
                <p className="font-medium text-sm truncate">Product Name</p>
              )}
              {settings.showPrice && (
                <p className="text-xs opacity-80">$99.00</p>
              )}
            </div>
            {settings.showButton && (
              <Button 
                size="sm"
                className="rounded-full text-xs flex-shrink-0"
                style={{
                  backgroundColor: settings.buttonColor,
                  color: settings.buttonTextColor,
                }}
                data-testid="button-preview-cta"
              >
                {settings.buttonLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Position</Label>
            <Select 
              value={settings.position} 
              onValueChange={(val) => updateSetting("position", val as any)}
            >
              <SelectTrigger className="mt-1" data-testid="select-carousel-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAROUSEL_POSITION_OPTIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Button Text</Label>
            <Select 
              value={settings.buttonLabel} 
              onValueChange={(val) => updateSetting("buttonLabel", val as any)}
            >
              <SelectTrigger className="mt-1" data-testid="select-button-label">
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
            <Label className="text-sm">Corner Radius: {settings.cornerRadius}px</Label>
            <Slider
              value={[settings.cornerRadius]}
              onValueChange={(val) => updateSetting("cornerRadius", val[0])}
              max={24}
              step={1}
              className="mt-2"
              data-testid="slider-corner-radius"
            />
          </div>

          <div>
            <Label className="text-sm">Background Opacity: {settings.backgroundOpacity}%</Label>
            <Slider
              value={[settings.backgroundOpacity]}
              onValueChange={(val) => updateSetting("backgroundOpacity", val[0])}
              max={100}
              step={5}
              className="mt-2"
              data-testid="slider-background-opacity"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Button Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={settings.buttonColor}
                onChange={(e) => updateSetting("buttonColor", e.target.value)}
                className="w-12 h-9 p-1"
                data-testid="input-button-color"
              />
              <Input
                value={settings.buttonColor}
                onChange={(e) => updateSetting("buttonColor", e.target.value)}
                className="flex-1"
                data-testid="input-button-color-hex"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Button Text Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={settings.buttonTextColor}
                onChange={(e) => updateSetting("buttonTextColor", e.target.value)}
                className="w-12 h-9 p-1"
                data-testid="input-button-text-color"
              />
              <Input
                value={settings.buttonTextColor}
                onChange={(e) => updateSetting("buttonTextColor", e.target.value)}
                className="flex-1"
                data-testid="input-button-text-color-hex"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Thumbnail</Label>
              <Switch
                checked={settings.showThumbnail}
                onCheckedChange={(checked) => updateSetting("showThumbnail", checked)}
                data-testid="switch-show-thumbnail"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Button</Label>
              <Switch
                checked={settings.showButton}
                onCheckedChange={(checked) => updateSetting("showButton", checked)}
                data-testid="switch-show-button"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Price</Label>
              <Switch
                checked={settings.showPrice}
                onCheckedChange={(checked) => updateSetting("showPrice", checked)}
                data-testid="switch-show-price"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Title</Label>
              <Switch
                checked={settings.showTitle}
                onCheckedChange={(checked) => updateSetting("showTitle", checked)}
                data-testid="switch-show-title"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Delay Until End of Video</Label>
              <Switch
                checked={settings.delayUntilEnd}
                onCheckedChange={(checked) => updateSetting("delayUntilEnd", checked)}
                data-testid="switch-delay-until-end"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { defaultSettings as defaultCarouselSettings };
