"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ScanEye,
  Sparkles,
  Loader2,
  ImageIcon,
  RotateCcw,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";

// ─── Types ──────────────────────────────────────────────────

export interface BeerImage {
  id: string;
  src: string;
  alt: string;
  filename?: string;
}

export interface GuessResult {
  brand: string;
  reasoning: string;
}

const BEER_BRANDS = [
  "branik",
  "plzen",
  "starobrno",
  "jezek",
  "bernard",
  "radegast",
  "zubr",
  "svijany",
  "proud",
  "birell",
  "budweiser",
  "zlaty bazant",
  "poutnik",
  "Kozel",
  "krusovice",
  "primator tchyne",
  "pardal",
  "primator",
  "nachmelena opice",
  "gambrinus",
];

const DESCRIPTION_MODELS = [
  { id: "gpt-5.1", label: "GPT 5.1" },
  { id: "gemini-flash", label: "Gemini Flash" },
  { id: "gemini-pro", label: "Gemini Pro" },
] as const;

const GUESS_MODELS = [
  {
    id: "Qwen/Qwen3-30B-A3B-Instruct-2507:ovtsznhz12dzk34njrvose0m",
    label: "Qwen/Qwen3-30B-A3B-Instruct-2507:ovtsznhz12dzk34njrvose0m",
  },
] as const;

// ─── Main component ─────────────────────────────────────────

export function BeerTester() {
  const [images, setImages] = useState<BeerImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<BeerImage | null>(null);
  const [description, setDescription] = useState("");
  const [descriptionModel, setDescriptionModel] = useState<
    (typeof DESCRIPTION_MODELS)[number]["id"]
  >("gemini-flash");
  const [guessModel, setGuessModel] = useState<
    (typeof GUESS_MODELS)[number]["id"]
  >("Qwen/Qwen3-30B-A3B-Instruct-2507:ovtsznhz12dzk34njrvose0m");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(
    new Set(BEER_BRANDS),
  );
  const [isGuessing, setIsGuessing] = useState(false);
  const [result, setResult] = useState<GuessResult | null>(null);

  const fetchImages = useCallback(async () => {
    setImagesLoading(true);
    try {
      const res = await fetch("/api/images");
      const data = (await res.json()) as { images?: BeerImage[] };
      setImages(data.images ?? []);
    } catch {
      console.error("Failed to fetch images");
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  const handleGenerateDescription = async () => {
    if (!selectedImage) return;
    setIsGeneratingDescription(true);
    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedImage.src,
          model: descriptionModel,
        }),
      });
      const data = (await res.json()) as {
        description?: string;
        error?: string;
      };
      if (data.description) {
        setDescription(data.description);
      } else {
        setDescription(`Error: ${data.error ?? "Unknown error"}`);
      }
    } catch {
      setDescription("Error: Failed to generate description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGuess = async () => {
    if (!description || selectedBrands.size === 0) return;
    setIsGuessing(true);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          allowedBrands: [...selectedBrands],
          model: guessModel,
        }),
      });
      const data = (await res.json()) as GuessResult & { error?: string };
      if (data.error) {
        setResult({ brand: "Error", reasoning: data.error });
      } else {
        setResult({ brand: data.brand, reasoning: data.reasoning });
      }
    } catch {
      setResult({
        brand: "Error",
        reasoning: "Failed to contact the model",
      });
    } finally {
      setIsGuessing(false);
    }
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
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
            <Link
              href="https://app.primeintellect.ai/dashboard/environments/padisoft-sro/czech-beer-brand-name"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs hover:underline"
            >
              Training Environment
            </Link>
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
                {imagesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="text-primary size-6 animate-spin" />
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-20 text-center">
                    <ImageIcon className="size-10 opacity-20" />
                    <p className="mt-3 text-sm">No images yet</p>
                    <Link
                      href="/upload"
                      className="text-primary mt-1 text-xs hover:underline"
                    >
                      Upload some
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image) => {
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="aspect-3/4 w-full object-cover"
                          />
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
                )}
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedImage.src}
                      alt={selectedImage.alt}
                      className="max-h-[400px] w-full object-contain"
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

              <div className="mt-4">
                <ModelSelect
                  id="description-model"
                  label="Description Model"
                  value={descriptionModel}
                  onChange={(value) =>
                    setDescriptionModel(
                      value as (typeof DESCRIPTION_MODELS)[number]["id"],
                    )
                  }
                  options={DESCRIPTION_MODELS}
                />
              </div>

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

              {!isGeneratingDescription && (
                <div className="relative mt-3">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a description of the beer bottle..."
                    className="border-border/40 bg-card/40 min-h-[150px] resize-y"
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
              <div className="mb-3">
                <ModelSelect
                  id="guess-model"
                  label="Beer Guess Model"
                  value={guessModel}
                  onChange={(value) =>
                    setGuessModel(value as (typeof GUESS_MODELS)[number]["id"])
                  }
                  options={GUESS_MODELS}
                />
              </div>
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
                      <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                        Model Output
                      </p>
                      <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
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

function ModelSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
}) {
  return (
    <label htmlFor={id} className="space-y-1">
      <span className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-visible:border-ring focus-visible:ring-ring/50 border-input bg-card/60 h-10 w-full rounded-md border px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
