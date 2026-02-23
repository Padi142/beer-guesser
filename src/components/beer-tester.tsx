"use client";

import { useState } from "react";
import {
  ScanEye,
  Sparkles,
  Loader2,
  ImageIcon,
  RotateCcw,
  Beer,
  FlaskConical,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";

// ─── Types ──────────────────────────────────────────────────

export interface BeerImage {
  id: string;
  src: string;
  alt: string;
}

export interface GuessResult {
  brand: string;
  confidence: number;
  reasoning: string;
}

// ─── Mock data — replace with real data loading ─────────────

const MOCK_IMAGES: BeerImage[] = Array.from({ length: 12 }, (_, i) => ({
  id: `beer-${i + 1}`,
  src: `/beers/beer-${i + 1}.jpg`,
  alt: `Beer sample ${i + 1}`,
}));

const BEER_BRANDS = [
  "Pilsner Urquell",
  "Budweiser Budvar",
  "Staropramen",
  "Kozel",
  "Gambrinus",
  "Bernard",
  "Krušovice",
  "Radegast",
  "Svijany",
  "Zlatopramen",
  "Březňák",
  "Lobkowicz",
  "Heineken",
  "Corona",
  "Guinness",
  "Stella Artois",
];

// ─── Placeholder gradient for gallery thumbnails ────────────

function PlaceholderImage({
  index,
  size = "sm",
}: {
  index: number;
  size?: "sm" | "lg";
}) {
  const hue = 28 + index * 7;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        size === "sm" ? "aspect-3/4" : "h-full min-h-[280px]",
      )}
      style={{
        background: `linear-gradient(155deg, hsl(${hue}, 35%, 20%), hsl(${hue - 5}, 50%, 7%))`,
      }}
    >
      <Beer
        className={cn(
          "text-foreground/15",
          size === "sm" ? "size-6" : "size-16",
        )}
        strokeWidth={1.2}
      />
      <span
        className={cn(
          "font-display text-foreground/20 mt-1",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        #{index + 1}
      </span>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────

export function BeerTester() {
  const [selectedImage, setSelectedImage] = useState<BeerImage | null>(null);
  const [description, setDescription] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(
    new Set(BEER_BRANDS),
  );
  const [isGuessing, setIsGuessing] = useState(false);
  const [result, setResult] = useState<GuessResult | null>(null);

  // TODO: Replace with your OCR LLM call
  const handleGenerateDescription = async () => {
    if (!selectedImage) return;
    setIsGeneratingDescription(true);
    // Placeholder — swap with: const desc = await ocrDescribe(selectedImage.src);
    await new Promise((r) => setTimeout(r, 2000));
    setDescription(
      "Tall green glass bottle, 500ml. Gold foil cap. Central label with ornate crest featuring two lions rampant. Text reads 'PREMIUM' across a ribbon banner. Established date visible: 1842. Barley and hop motifs border the label edges.",
    );
    setIsGeneratingDescription(false);
  };

  // TODO: Replace with your fine-tuned LLM call
  const handleGuess = async () => {
    if (!description || selectedBrands.size === 0) return;
    setIsGuessing(true);
    // Placeholder — swap with: const res = await guessFromDescription(description, [...selectedBrands]);
    await new Promise((r) => setTimeout(r, 2000));
    setResult({
      brand: "Pilsner Urquell",
      confidence: 0.87,
      reasoning:
        "The description mentions a green bottle with an ornate crest featuring two lions, a 'PREMIUM' banner, and the establishment year 1842 — all consistent with the iconic Pilsner Urquell label design.",
    });
    setIsGuessing(false);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const selectAllBrands = () => setSelectedBrands(new Set(BEER_BRANDS));
  const clearAllBrands = () => setSelectedBrands(new Set());

  const handleSelectImage = (image: BeerImage) => {
    setSelectedImage(image);
    setDescription("");
    setResult(null);
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/4 absolute -top-48 left-1/4 h-96 w-96 rounded-full blur-[120px]" />
        <div className="bg-primary/3 absolute right-1/4 -bottom-48 h-80 w-80 rounded-full blur-[100px]" />
      </div>

      {/* ─── Header ─── */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
              <FlaskConical className="text-primary size-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight">
                Beer Guesser
              </h1>
              <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase"></p>
            </div>
          </div>
        </div>
        <div className="via-primary/20 h-px bg-linear-to-r from-transparent to-transparent" />
      </header>

      {/* ─── Main ─── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          {/* ─── Gallery Panel ─── */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.05s" }}
          >
            <StepLabel step="01" label="Select a Beer" />
            <div className="border-border/40 bg-card/40 rounded-xl border p-3 backdrop-blur-sm">
              <ScrollArea className="h-[calc(100vh-240px)] pr-3">
                <div className="grid grid-cols-3 gap-2">
                  {MOCK_IMAGES.map((image, i) => {
                    const isSelected = selectedImage?.id === image.id;
                    return (
                      <button
                        key={image.id}
                        onClick={() => handleSelectImage(image)}
                        className={cn(
                          "group relative overflow-hidden rounded-lg border-2 transition-all duration-300",
                          isSelected
                            ? "animate-glow-pulse border-primary"
                            : "hover:border-primary/40 border-transparent",
                        )}
                      >
                        {/* TODO: Replace PlaceholderImage with <img src={image.src} /> */}
                        <PlaceholderImage index={i} size="sm" />
                        <div
                          className={cn(
                            "absolute inset-0 transition-opacity duration-300",
                            isSelected
                              ? "bg-primary/5"
                              : "group-hover:bg-primary/5 bg-transparent",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </section>

          {/* ─── Inspector Panel ─── */}
          <section className="space-y-8">
            {/* Preview + Description */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.15s" }}
            >
              <StepLabel step="02" label="Preview & Describe" />

              <Card className="border-border/40 bg-card/40 overflow-hidden py-0 backdrop-blur-sm">
                <div className="bg-muted/30 relative flex items-center justify-center overflow-hidden">
                  {selectedImage ? (
                    <PlaceholderImage
                      index={
                        parseInt(selectedImage.id.split("-")[1] ?? "1") - 1
                      }
                      size="lg"
                    />
                  ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center py-16 text-center">
                      <ImageIcon className="text-muted-foreground/20 size-14" />
                      <p className="text-muted-foreground mt-4 text-sm">
                        Select a beer from the gallery
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  onClick={handleGenerateDescription}
                  disabled={!selectedImage || isGeneratingDescription}
                  size="lg"
                  className="gap-2"
                >
                  {isGeneratingDescription ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ScanEye className="size-4" />
                  )}
                  Generate Description
                </Button>
                {description && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDescription("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                )}
              </div>

              {(description || isGeneratingDescription) && (
                <div className="relative mt-3">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Generating description..."
                    className="border-border/40 bg-card/40 min-h-[100px] resize-y"
                    disabled={isGeneratingDescription}
                  />
                  {isGeneratingDescription && (
                    <div className="animate-shimmer absolute inset-0 rounded-md" />
                  )}
                </div>
              )}
            </div>

            {/* Brand Selector */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.25s" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <StepLabel step="03" label="Allowed Brands" />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllBrands}
                    className="text-muted-foreground text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllBrands}
                    className="text-muted-foreground text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {BEER_BRANDS.map((brand) => {
                  const isActive = selectedBrands.has(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200",
                        isActive
                          ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                          : "border-border/40 bg-card/30 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      )}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground mt-2.5 text-xs">
                {selectedBrands.size} of {BEER_BRANDS.length} brands selected
              </p>
            </div>

            <Separator className="bg-border/20" />

            {/* Submit */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.35s" }}
            >
              <StepLabel step="04" label="Get Prediction" />
              <Button
                size="lg"
                onClick={handleGuess}
                disabled={
                  !description || selectedBrands.size === 0 || isGuessing
                }
                className="h-12 w-full gap-2 text-base"
              >
                {isGuessing ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Sparkles className="size-5" />
                )}
                Guess the Beer
              </Button>
            </div>

            {/* Results */}
            {result && (
              <div className="animate-fade-in-up">
                <Card className="border-primary/25 bg-primary/4 overflow-hidden">
                  <div className="from-primary/60 via-primary to-primary/60 h-1 bg-linear-to-r" />
                  <CardHeader>
                    <CardTitle className="font-display text-lg font-medium">
                      Prediction Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                        Predicted Brand
                      </p>
                      <p className="font-display text-primary text-3xl font-bold">
                        {result.brand}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">
                        Confidence
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                          <div
                            className="from-primary/70 to-primary h-full rounded-full bg-linear-to-r transition-all duration-1000 ease-out"
                            style={{ width: `${result.confidence * 100}%` }}
                          />
                        </div>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {Math.round(result.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                        Reasoning
                      </p>
                      <p className="text-foreground/80 leading-relaxed">
                        {result.reasoning}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Small reusable pieces ──────────────────────────────────

function StepLabel({ step, label }: { step: string; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-display text-primary text-base">{step}</span>
      <h2 className="font-display text-lg">{label}</h2>
    </div>
  );
}
