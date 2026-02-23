"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Loader2,
  Lock,
  ArrowLeft,
  ImagePlus,
  CheckCircle2,
  XCircle,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

// ─── Types ──────────────────────────────────────────────────

interface UploadedImage {
  id: string;
  src: string;
  filename: string;
  uploadedAt: string | null;
  size: number;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: "pending" | "uploading" | "done" | "error";
  error?: string;
}

// ─── Main component ─────────────────────────────────────────

export function UploadManager() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/images");
      const data = (await res.json()) as { images?: UploadedImage[] };
      setImages(data.images ?? []);
    } catch {
      console.error("Failed to fetch images");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-upload-password": password,
        },
        body: JSON.stringify({ fileName: "__auth_check__.png" }),
      });
      if (res.status === 401) {
        setAuthError("Wrong password");
        return;
      }
      setIsAuthenticated(true);
      void fetchImages();
    } catch {
      setAuthError("Connection error");
    }
  };

  const uploadFile = async (file: File) => {
    const uploadId = `${Date.now()}-${file.name}`;
    setUploads((prev) => [
      ...prev,
      { id: uploadId, file, progress: "pending" },
    ]);

    try {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, progress: "uploading" } : u,
        ),
      );

      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-upload-password": password,
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!presignRes.ok) throw new Error("Failed to get upload URL");

      const { url, fields } = (await presignRes.json()) as {
        url: string;
        fields: Record<string, string>;
      };

      const form = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        form.append(key, value);
      });
      form.append("Content-Type", file.type);
      form.append("file", file);

      const uploadRes = await fetch(url, { method: "POST", body: form });
      if (!uploadRes.ok && uploadRes.status !== 204)
        throw new Error("Upload failed");

      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, progress: "done" } : u)),
      );

      void fetchImages();
    } catch (err) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? {
                ...u,
                progress: "error",
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : u,
        ),
      );
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    imageFiles.forEach((file) => void uploadFile(file));
  };

  const handleDelete = async (key: string) => {
    setDeletingKeys((prev) => new Set(prev).add(key));
    try {
      await fetch("/api/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-upload-password": password,
        },
        body: JSON.stringify({ key }),
      });
      setImages((prev) => prev.filter((img) => img.id !== key));
    } catch {
      console.error("Failed to delete image");
    } finally {
      setDeletingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [password],
  );

  // ─── Password gate ────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="bg-primary/4 absolute -top-48 left-1/4 h-96 w-96 rounded-full blur-[120px]" />
        </div>

        <Card className="animate-fade-in-up border-border/40 bg-card/60 w-full max-w-sm backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="bg-primary/10 mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
              <Lock className="text-primary size-5" />
            </div>
            <CardTitle className="font-display text-xl">Upload Access</CardTitle>
            <CardDescription>
              Enter the upload password to manage beer images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleLogin();
              }}
              className="space-y-4"
            >
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border/40 bg-card/40"
                autoFocus
              />
              {authError && (
                <p className="text-destructive text-sm">{authError}</p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={!password}>
                <Lock className="size-4" />
                Unlock
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                <ArrowLeft className="size-3" />
                Back to tester
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Authenticated view ───────────────────────────────────

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/4 absolute -top-48 left-1/4 h-96 w-96 rounded-full blur-[120px]" />
        <div className="bg-primary/3 absolute right-1/4 -bottom-48 h-80 w-80 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
              <FlaskConical className="text-primary size-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight">
                Image Manager
              </h1>
              <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                Upload & manage beer photos
              </p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to tester
            </Button>
          </Link>
        </div>
        <div className="via-primary/20 h-px bg-linear-to-r from-transparent to-transparent" />
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Drop zone */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border/40 hover:border-primary/40 hover:bg-card/30",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <ImagePlus
              className={cn(
                "mx-auto size-10 transition-colors",
                isDragging
                  ? "text-primary"
                  : "text-muted-foreground/40 group-hover:text-primary/60",
              )}
            />
            <p className="text-muted-foreground mt-4 text-sm">
              Drop images here or click to browse
            </p>
            <p className="text-muted-foreground/60 mt-1 text-xs">
              JPG, PNG, WebP, GIF — up to 10 MB each
            </p>
          </div>
        </div>

        {/* Active uploads */}
        {uploads.length > 0 && (
          <div
            className="animate-fade-in-up space-y-2"
            style={{ animationDelay: "0.1s" }}
          >
            <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Uploads
            </h3>
            {uploads.map((u) => (
              <div
                key={u.id}
                className="border-border/30 bg-card/30 flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                {u.progress === "uploading" || u.progress === "pending" ? (
                  <Loader2 className="text-primary size-4 animate-spin" />
                ) : u.progress === "done" ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <XCircle className="text-destructive size-4" />
                )}
                <span className="flex-1 truncate text-sm">
                  {u.file.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {u.progress === "error" ? u.error : u.progress}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Image grid */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg">
              Beer Images{" "}
              <span className="text-muted-foreground text-sm font-normal">
                ({images.length})
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchImages()}
              disabled={isLoading}
              className="text-muted-foreground gap-2 text-xs"
            >
              {isLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
              Refresh
            </Button>
          </div>

          {isLoading && images.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-primary size-8 animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-muted-foreground py-20 text-center text-sm">
              No images uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group border-border/30 bg-card/30 relative overflow-hidden rounded-lg border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.filename}
                    className="aspect-3/4 w-full object-cover"
                  />
                  <div className="p-2.5">
                    <p className="truncate text-xs" title={img.filename}>
                      {img.filename}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(img.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => void handleDelete(img.id)}
                      disabled={deletingKeys.has(img.id)}
                    >
                      {deletingKeys.has(img.id) ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trash2 className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
