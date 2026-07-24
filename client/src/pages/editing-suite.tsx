import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play, Pause, Volume2, VolumeX,
  Wand2, Copy, Check, Layout, Palette, Type, ToggleLeft,
  ShoppingCart, Ban, ArrowLeft, MousePointer2,
  Code, RotateCcw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BUTTON_LABEL_OPTIONS, CAROUSEL_POSITION_OPTIONS, FONT_OPTIONS } from "@shared/schema";
import type { Video } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type HoverAnimation = "none" | "scale" | "glow" | "pulse";
type ButtonAnimation = "none" | "bounce" | "fade-in" | "slide-up";
type AspectRatio = "16:9" | "9:16" | "4:3" | "1:1";

interface SuiteSettings {
  commerceEnabled: boolean;
  playerAspectRatio: AspectRatio;
  position: string;
  positionOffsetX: number;
  positionOffsetY: number;
  cornerRadius: number;
  backgroundOpacity: number;
  showThumbnail: boolean;
  showButton: boolean;
  showPrice: boolean;
  showTitle: boolean;
  delayUntilEnd: boolean;
  buttonLabel: string;
  button1Url: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonFont: string;
  buttonFontSize: number;
  buttonHoverAnimation: HoverAnimation;
  buttonAnimation: ButtonAnimation;
  button2Enabled: boolean;
  button2Label: string;
  button2Url: string;
  button2Color: string;
  button2TextColor: string;
  titleFont: string;
  titleFontSize: number;
  priceFontSize: number;
}

const defaultSettings: SuiteSettings = {
  commerceEnabled: true,
  playerAspectRatio: "16:9",
  position: "bottom",
  positionOffsetX: 0,
  positionOffsetY: 0,
  cornerRadius: 16,
  backgroundOpacity: 55,
  showThumbnail: true,
  showButton: true,
  showPrice: true,
  showTitle: true,
  delayUntilEnd: false,
  buttonLabel: "BUY NOW",
  button1Url: "",
  buttonColor: "#1351aa",
  buttonTextColor: "#FFFFFF",
  buttonFont: "system",
  buttonFontSize: 100,
  buttonHoverAnimation: "scale",
  buttonAnimation: "none",
  button2Enabled: false,
  button2Label: "LEARN MORE",
  button2Url: "",
  button2Color: "#333333",
  button2TextColor: "#FFFFFF",
  titleFont: "system",
  titleFontSize: 100,
  priceFontSize: 100,
};

const FONT_MAP: Record<string, string> = {
  "system": "system-ui, -apple-system, sans-serif",
  "public-pixel": "'Public Pixel', monospace",
  "inter": "'Inter', sans-serif",
  "roboto": "'Roboto', sans-serif",
  "poppins": "'Poppins', sans-serif",
  "montserrat": "'Montserrat', sans-serif",
  "playfair": "'Playfair Display', serif",
  "oswald": "'Oswald', sans-serif",
};

const HOVER_OPTIONS: { value: HoverAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "scale", label: "Scale Up" },
  { value: "glow", label: "Glow" },
  { value: "pulse", label: "Pulse" },
];

const ANIM_OPTIONS: { value: ButtonAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "bounce", label: "Bounce In" },
  { value: "fade-in", label: "Fade In" },
  { value: "slide-up", label: "Slide Up" },
];

const ASPECT_OPTIONS: { value: AspectRatio; label: string; padding: string }[] = [
  { value: "16:9", label: "16:9 Landscape", padding: "56.25%" },
  { value: "9:16", label: "9:16 Portrait", padding: "177.78%" },
  { value: "4:3", label: "4:3 Classic", padding: "75%" },
  { value: "1:1", label: "1:1 Square", padding: "100%" },
];

const MOCK_PRODUCTS = [
  { name: "Sample Product A", price: "$99.00" },
  { name: "Sample Product B", price: "$149.00" },
  { name: "Sample Product C", price: "$79.00" },
];

function getPositionStyle(s: SuiteSettings): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", zIndex: 20 };
  const ox = s.positionOffsetX, oy = s.positionOffsetY;
  switch (s.position) {
    case "top":         return { ...base, top: `${8 + oy}px`, left: "50%", transform: "translateX(-50%)" };
    case "bottom":      return { ...base, bottom: `${8 - oy}px`, left: "50%", transform: "translateX(-50%)" };
    case "left":        return { ...base, left: `${8 + ox}px`, top: "50%", transform: "translateY(-50%)" };
    case "right":       return { ...base, right: `${8 - ox}px`, top: "50%", transform: "translateY(-50%)" };
    case "top-left":    return { ...base, top: `${8 + oy}px`, left: `${8 + ox}px` };
    case "top-right":   return { ...base, top: `${8 + oy}px`, right: `${8 - ox}px` };
    case "bottom-left": return { ...base, bottom: `${8 - oy}px`, left: `${8 + ox}px` };
    case "bottom-right":return { ...base, bottom: `${8 - oy}px`, right: `${8 - ox}px` };
    default:            return { ...base, bottom: "8px", left: "50%", transform: "translateX(-50%)" };
  }
}

function PreviewCarousel({ settings }: { settings: SuiteSettings }) {
  const [idx, setIdx] = useState(0);
  const product = MOCK_PRODUCTS[idx];
  const tf = FONT_MAP[settings.titleFont] || FONT_MAP.system;
  const bf = FONT_MAP[settings.buttonFont] || FONT_MAP.system;

  const hoverClass = {
    scale: "hover:scale-105 transition-transform duration-150",
    glow:  "hover:brightness-110 transition-all duration-150",
    pulse: "hover:animate-pulse",
    none:  "",
  }[settings.buttonHoverAnimation];

  const justifyClass = settings.position.includes("right") ? "flex-end"
    : settings.position.includes("left") && !settings.position.includes("right") ? "flex-start"
    : "center";

  return (
    <div style={getPositionStyle(settings)} className="flex flex-col gap-1.5 pointer-events-auto">
      <div
        style={{
          backgroundColor: `rgba(0,0,0,${settings.backgroundOpacity / 100})`,
          borderRadius: `${settings.cornerRadius}px`,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: "180px",
          maxWidth: "260px",
        }}
      >
        <button className="text-white/60 hover:text-white shrink-0" onClick={() => setIdx(i => (i - 1 + MOCK_PRODUCTS.length) % MOCK_PRODUCTS.length)}>
          <ChevronLeft className="h-3 w-3" />
        </button>
        {settings.showThumbnail && (
          <div className="w-8 h-8 shrink-0 rounded bg-white/10 flex items-center justify-center">
            <div className="w-5 h-5 rounded bg-white/20" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {settings.showTitle && (
            <p className="text-white font-medium truncate" style={{ fontFamily: tf, fontSize: `${12 * settings.titleFontSize / 100}px` }}>
              {product.name}
            </p>
          )}
          {settings.showPrice && (
            <p className="text-white/75" style={{ fontSize: `${10 * settings.priceFontSize / 100}px` }}>
              {product.price}
            </p>
          )}
        </div>
        <button className="text-white/60 hover:text-white shrink-0" onClick={() => setIdx(i => (i + 1) % MOCK_PRODUCTS.length)}>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {(settings.showButton || settings.button2Enabled) && (
        <div className="flex gap-1.5" style={{ justifyContent: justifyClass }}>
          {settings.showButton && (
            <button
              className={`rounded-full font-medium px-3 py-1 cursor-default ${hoverClass}`}
              style={{
                backgroundColor: settings.buttonColor,
                color: settings.buttonTextColor,
                fontFamily: bf,
                fontSize: `${9 * settings.buttonFontSize / 100}px`,
              }}
            >
              {settings.buttonLabel}
            </button>
          )}
          {settings.button2Enabled && (
            <button
              className="rounded-full font-medium px-3 py-1 cursor-default hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: settings.button2Color,
                color: settings.button2TextColor,
                fontFamily: bf,
                fontSize: `${9 * settings.buttonFontSize / 100}px`,
              }}
            >
              {settings.button2Label || "LEARN MORE"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ settings, onChange }: { settings: SuiteSettings; onChange: (s: SuiteSettings) => void }) {
  const set = <K extends keyof SuiteSettings>(key: K, val: SuiteSettings[K]) =>
    onChange({ ...settings, [key]: val });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.commerceEnabled
              ? <ShoppingCart className="h-4 w-4 text-green-500" />
              : <Ban className="h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-semibold">Commerce</p>
              <p className="text-[11px] text-muted-foreground">
                {settings.commerceEnabled ? "Product carousel enabled" : "Carousel hidden"}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.commerceEnabled}
            onCheckedChange={(v) => set("commerceEnabled", v)}
            data-testid="switch-commerce-enabled"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="layout" className="w-full">
          <div className="sticky top-0 bg-background z-10 border-b">
            <TabsList className="grid grid-cols-5 h-9 mx-3 my-2 w-[calc(100%-24px)]">
              <TabsTrigger value="layout" className="text-[10px] px-0.5 gap-0.5">
                <Layout className="h-3 w-3" />
                <span className="hidden sm:inline">Layout</span>
              </TabsTrigger>
              <TabsTrigger value="buttons" className="text-[10px] px-0.5 gap-0.5">
                <MousePointer2 className="h-3 w-3" />
                <span className="hidden sm:inline">Buttons</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="text-[10px] px-0.5 gap-0.5">
                <Palette className="h-3 w-3" />
                <span className="hidden sm:inline">Style</span>
              </TabsTrigger>
              <TabsTrigger value="fonts" className="text-[10px] px-0.5 gap-0.5">
                <Type className="h-3 w-3" />
                <span className="hidden sm:inline">Fonts</span>
              </TabsTrigger>
              <TabsTrigger value="display" className="text-[10px] px-0.5 gap-0.5">
                <ToggleLeft className="h-3 w-3" />
                <span className="hidden sm:inline">Display</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 space-y-4">
            <TabsContent value="layout" className="space-y-4 mt-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Player Size</p>
                <Label className="text-xs">Aspect Ratio</Label>
                <Select value={settings.playerAspectRatio} onValueChange={(v) => set("playerAspectRatio", v as AspectRatio)}>
                  <SelectTrigger className="mt-1 h-8 text-xs" data-testid="select-aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Carousel Position</p>
                <Select value={settings.position} onValueChange={(v) => set("position", v)}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAROUSEL_POSITION_OPTIONS.map(p => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label className="text-xs">Offset X: {settings.positionOffsetX}px</Label>
                    <Slider value={[settings.positionOffsetX]} onValueChange={([v]) => set("positionOffsetX", v)} min={-50} max={50} step={1} className="mt-2" data-testid="slider-offset-x" />
                  </div>
                  <div>
                    <Label className="text-xs">Offset Y: {settings.positionOffsetY}px</Label>
                    <Slider value={[settings.positionOffsetY]} onValueChange={([v]) => set("positionOffsetY", v)} min={-50} max={50} step={1} className="mt-2" data-testid="slider-offset-y" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="buttons" className="space-y-4 mt-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Primary Button</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Button Text</Label>
                    <Select value={settings.buttonLabel} onValueChange={(v) => set("buttonLabel", v)}>
                      <SelectTrigger className="mt-1 h-8 text-xs" data-testid="select-button-label">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUTTON_LABEL_OPTIONS.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Navigation URL</Label>
                    <Input
                      placeholder="https://example.com/product"
                      value={settings.button1Url}
                      onChange={(e) => set("button1Url", e.target.value)}
                      className="mt-1 h-8 text-xs"
                      data-testid="input-button1-url"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Hover Effect</Label>
                      <Select value={settings.buttonHoverAnimation} onValueChange={(v) => set("buttonHoverAnimation", v as HoverAnimation)}>
                        <SelectTrigger className="mt-1 h-8 text-xs" data-testid="select-hover-animation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOVER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Entry Animation</Label>
                      <Select value={settings.buttonAnimation} onValueChange={(v) => set("buttonAnimation", v as ButtonAnimation)}>
                        <SelectTrigger className="mt-1 h-8 text-xs" data-testid="select-button-animation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ANIM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Second Button</p>
                  <Switch
                    checked={settings.button2Enabled}
                    onCheckedChange={(v) => set("button2Enabled", v)}
                    data-testid="switch-button2-enabled"
                  />
                </div>
                {settings.button2Enabled && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Button Text</Label>
                      <Input
                        value={settings.button2Label}
                        onChange={(e) => set("button2Label", e.target.value)}
                        className="mt-1 h-8 text-xs"
                        placeholder="LEARN MORE"
                        data-testid="input-button2-label"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Navigation URL</Label>
                      <Input
                        placeholder="https://example.com"
                        value={settings.button2Url}
                        onChange={(e) => set("button2Url", e.target.value)}
                        className="mt-1 h-8 text-xs"
                        data-testid="input-button2-url"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Button Color</Label>
                        <div className="flex gap-1 mt-1">
                          <Input type="color" value={settings.button2Color} onChange={(e) => set("button2Color", e.target.value)} className="w-8 h-8 p-0.5" data-testid="input-button2-color" />
                          <Input value={settings.button2Color} onChange={(e) => set("button2Color", e.target.value)} className="flex-1 h-8 text-xs font-mono" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Text Color</Label>
                        <div className="flex gap-1 mt-1">
                          <Input type="color" value={settings.button2TextColor} onChange={(e) => set("button2TextColor", e.target.value)} className="w-8 h-8 p-0.5" data-testid="input-button2-text-color" />
                          <Input value={settings.button2TextColor} onChange={(e) => set("button2TextColor", e.target.value)} className="flex-1 h-8 text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Background Fill</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Opacity: {settings.backgroundOpacity}%</Label>
                    <Slider value={[settings.backgroundOpacity]} onValueChange={([v]) => set("backgroundOpacity", v)} max={100} step={5} className="mt-2" data-testid="slider-opacity" />
                  </div>
                  <div>
                    <Label className="text-xs">Corner Radius: {settings.cornerRadius}px</Label>
                    <Slider value={[settings.cornerRadius]} onValueChange={([v]) => set("cornerRadius", v)} max={32} step={1} className="mt-2" data-testid="slider-corner-radius" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Primary Button Colors</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Button Color</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={settings.buttonColor} onChange={(e) => set("buttonColor", e.target.value)} className="w-8 h-8 p-0.5" data-testid="input-button-color" />
                      <Input value={settings.buttonColor} onChange={(e) => set("buttonColor", e.target.value)} className="flex-1 h-8 text-xs font-mono" data-testid="input-button-color-hex" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Text Color</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={settings.buttonTextColor} onChange={(e) => set("buttonTextColor", e.target.value)} className="w-8 h-8 p-0.5" data-testid="input-button-text-color" />
                      <Input value={settings.buttonTextColor} onChange={(e) => set("buttonTextColor", e.target.value)} className="flex-1 h-8 text-xs font-mono" data-testid="input-button-text-color-hex" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fonts" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Title Font</Label>
                  <Select value={settings.titleFont} onValueChange={(v) => set("titleFont", v)}>
                    <SelectTrigger className="mt-1 h-8 text-xs" data-testid="select-title-font">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value} className="text-xs" style={{ fontFamily: FONT_MAP[f.value] }}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Button Font</Label>
                  <Select value={settings.buttonFont} onValueChange={(v) => set("buttonFont", v)}>
                    <SelectTrigger className="mt-1 h-8 text-xs" data-testid="select-button-font">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value} className="text-xs" style={{ fontFamily: FONT_MAP[f.value] }}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Font Size Scale</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Title: {settings.titleFontSize}%</Label>
                    <Slider value={[settings.titleFontSize]} onValueChange={([v]) => set("titleFontSize", v)} min={50} max={150} step={5} className="mt-2" data-testid="slider-title-size" />
                  </div>
                  <div>
                    <Label className="text-xs">Price: {settings.priceFontSize}%</Label>
                    <Slider value={[settings.priceFontSize]} onValueChange={([v]) => set("priceFontSize", v)} min={50} max={150} step={5} className="mt-2" data-testid="slider-price-size" />
                  </div>
                  <div>
                    <Label className="text-xs">Button: {settings.buttonFontSize}%</Label>
                    <Slider value={[settings.buttonFontSize]} onValueChange={([v]) => set("buttonFontSize", v)} min={50} max={150} step={5} className="mt-2" data-testid="slider-button-size" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-2">Live Preview</p>
                <p className="font-semibold" style={{ fontFamily: FONT_MAP[settings.titleFont], fontSize: `${14 * settings.titleFontSize / 100}px` }}>
                  Product Title
                </p>
                <p className="text-muted-foreground" style={{ fontSize: `${12 * settings.priceFontSize / 100}px` }}>
                  $99.00
                </p>
                <span
                  className="inline-block mt-1.5 px-2 py-0.5 rounded-full font-medium"
                  style={{
                    fontFamily: FONT_MAP[settings.buttonFont],
                    backgroundColor: settings.buttonColor,
                    color: settings.buttonTextColor,
                    fontSize: `${12 * settings.buttonFontSize / 100}px`,
                  }}
                >
                  {settings.buttonLabel}
                </span>
              </div>
            </TabsContent>

            <TabsContent value="display" className="space-y-0 mt-0">
              {([
                ["showThumbnail", "Show Product Thumbnail"],
                ["showTitle", "Show Product Title"],
                ["showPrice", "Show Product Price"],
                ["showButton", "Show Primary Button"],
                ["delayUntilEnd", "Show Carousel at End Only"],
              ] as [keyof SuiteSettings, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
                  <Label className="text-xs cursor-pointer">{label}</Label>
                  <Switch
                    checked={!!settings[key]}
                    onCheckedChange={(v) => set(key, v as any)}
                    data-testid={`switch-${key}`}
                  />
                </div>
              ))}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function VideoSelector({ onSelect }: { onSelect: (video: Video) => void }) {
  const { data: videos = [], isLoading } = useQuery<Video[]>({ queryKey: ["/api/videos"] });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-lg font-semibold mb-1">Choose a Video</h2>
      <p className="text-sm text-muted-foreground mb-6">Pick a video to open in the Editing Suite.</p>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl overflow-hidden border border-border animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-2 space-y-1">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wand2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No videos yet. Upload a video first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {videos.map(video => (
            <div
              key={video.id}
              className="cursor-pointer group rounded-xl overflow-hidden border border-border hover:border-primary/60 transition-all hover:shadow-md"
              onClick={() => onSelect(video)}
              data-testid={`card-select-video-${video.id}`}
            >
              <div className="aspect-video bg-muted relative">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-chart-2/20">
                    <Play className="h-8 w-8 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-2 shadow-lg">
                    <Wand2 className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium truncate">{video.title}</p>
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{video.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditingSuite() {
  const [matchWithId, params] = useRoute("/:role/editing-suite/:videoId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const roleFromPath = (() => {
    const p = window.location.pathname;
    if (p.startsWith("/brand")) return "brand";
    if (p.startsWith("/affiliate")) return "affiliate";
    return "creator";
  })();

  const videoIdFromUrl = matchWithId ? params?.videoId : undefined;
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(videoIdFromUrl);
  const [settings, setSettings] = useState<SuiteSettings>(defaultSettings);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { data: video } = useQuery<Video>({
    queryKey: ["/api/videos", selectedVideoId],
    enabled: !!selectedVideoId,
    select: (data: any) => Array.isArray(data) ? data.find((v: Video) => String(v.id) === selectedVideoId) : data,
  });

  const aspectPadding = ASPECT_OPTIONS.find(o => o.value === settings.playerAspectRatio)?.padding ?? "56.25%";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const embedCode = video
    ? `<div style="position:relative;padding-bottom:${aspectPadding};height:0;overflow:hidden;">\n  <iframe\n    src="${baseUrl}/embed/${video.id}?utm=${video.utmCode}&commerce=${settings.commerceEnabled ? 1 : 0}&pos=${settings.position}&cr=${settings.cornerRadius}&op=${settings.backgroundOpacity}&btn=${encodeURIComponent(settings.buttonLabel)}&bc=${encodeURIComponent(settings.buttonColor)}&btc=${encodeURIComponent(settings.buttonTextColor)}"\n    style="position:absolute;top:0;left:0;width:100%;height:100%;"\n    frameborder="0"\n    allowfullscreen\n    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"\n  ></iframe>\n</div>`
    : "";

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    toast({ title: "Copied!", description: "Embed code copied to clipboard" });
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleSave = async () => {
    if (!selectedVideoId) return;
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/videos/${selectedVideoId}/carousel-override`, {
        position: settings.position,
        positionOffsetX: settings.positionOffsetX,
        positionOffsetY: settings.positionOffsetY,
        cornerRadius: settings.cornerRadius,
        backgroundOpacity: settings.backgroundOpacity,
        showThumbnail: settings.showThumbnail,
        showButton: settings.showButton,
        showPrice: settings.showPrice,
        showTitle: settings.showTitle,
        buttonLabel: settings.buttonLabel,
        buttonColor: settings.buttonColor,
        buttonTextColor: settings.buttonTextColor,
        buttonFont: settings.buttonFont,
      });
      toast({ title: "Saved!", description: "Carousel settings saved to this video" });
    } catch {
      toast({ title: "Settings ready", description: "Copy the embed code to apply these settings" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedVideoId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
          <Wand2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Editing Suite</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <VideoSelector onSelect={(v) => {
            const id = String(v.id);
            setSelectedVideoId(id);
            setLocation(`/${roleFromPath}/editing-suite/${id}`);
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => { setSelectedVideoId(undefined); setLocation(`/${roleFromPath}/editing-suite`); }}
            data-testid="button-back-to-selector"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Wand2 className="h-4 w-4 text-primary shrink-0" />
          <h1 className="text-base font-bold shrink-0">Editing Suite</h1>
          {video && (
            <Badge variant="secondary" className="text-xs hidden md:inline-flex truncate max-w-[180px]">{video.title}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettings(defaultSettings)}
            data-testid="button-reset-all"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            style={{ background: "#1351aa47", border: "1px solid rgba(255,255,255,0.2)" }}
            data-testid="button-save-settings"
          >
            {isSaving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 xl:w-80 shrink-0 border-r overflow-hidden flex flex-col">
          <SettingsPanel settings={settings} onChange={setSettings} />
        </div>

        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Live Preview Workspace</p>
            <div className="flex items-center gap-2">
              {!settings.commerceEnabled && (
                <Badge variant="secondary" className="text-[10px] text-yellow-400 bg-yellow-400/10 border-yellow-400/20">
                  Commerce Disabled
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] text-white/40 bg-white/5 border-white/10">
                {settings.playerAspectRatio}
              </Badge>
            </div>
          </div>

          <div className="w-full max-w-3xl mx-auto">
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              style={{ paddingBottom: aspectPadding, height: 0 }}
            >
              {video?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  data-testid="video-preview"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="text-center text-white/30">
                    <Play className="h-14 w-14 mx-auto mb-2" />
                    <p className="text-sm">Video Preview</p>
                    {!video && <p className="text-xs mt-1 opacity-60">Loading…</p>}
                  </div>
                </div>
              )}

              {settings.commerceEnabled && (
                <PreviewCarousel settings={settings} />
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 flex items-center gap-3">
                <button
                  className="text-white/80 hover:text-white transition-colors"
                  onClick={() => {
                    if (!videoRef.current) return;
                    isPlaying ? videoRef.current.pause() : videoRef.current.play();
                  }}
                  data-testid="button-preview-play"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button
                  className="text-white/80 hover:text-white transition-colors"
                  onClick={() => {
                    if (!videoRef.current) return;
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }}
                  data-testid="button-preview-mute"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-3xl mx-auto bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-white/50" />
                <p className="text-sm font-semibold text-white/70">Embed Code</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/50 hover:text-white hover:bg-white/10 h-7 px-2"
                onClick={copyEmbed}
                disabled={!video}
                data-testid="button-copy-embed"
              >
                {copiedEmbed ? <Check className="h-3.5 w-3.5 mr-1 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                <span className="text-xs">{copiedEmbed ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
            <Textarea
              value={embedCode || "Select a video to generate embed code"}
              readOnly
              className="font-mono text-xs bg-black/30 border-white/10 text-white/50 resize-none"
              rows={7}
              data-testid="textarea-embed-code"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
