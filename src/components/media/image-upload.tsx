"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { UploadPurpose } from "./upload-purpose";

type ImageUploadProps = {
  name: string;
  label: string;
  purpose: UploadPurpose;
  defaultValue?: string | null;
  hint?: string;
};

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/**
 * Uncontrolled-form-friendly image field: renders a hidden `<input name>`
 * carrying the resulting URL so it flows through the parent's
 * `<form action={serverAction}>` exactly like a plain text field would — no
 * extra client-state wiring needed at the call site. Always keeps a manual
 * URL fallback available so the field works even when Cloudinary isn't
 * configured yet (dev, or a dealer who already hosts the image elsewhere).
 */
export function ImageUpload({ name, label, purpose, defaultValue, hint }: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  async function handleFile(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      });

      if (!signRes.ok) {
        const body = (await signRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not start the upload.");
      }

      const sig = (await signRes.json()) as CloudinarySignature;

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        {
          method: "POST",
          body: form,
        },
      );

      if (!uploadRes.ok) throw new Error("Upload to Cloudinary failed.");

      const uploaded = (await uploadRes.json()) as { secure_url: string };
      setUrl(uploaded.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {url ? (
            <Image
              src={url}
              alt=""
              width={64}
              height={64}
              className="size-16 object-contain"
              unoptimized
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <span className="sr-only">Upload {label}</span>
              <input
                id={inputId}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
                <span>
                  {isUploading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {isUploading ? "Uploading…" : "Upload image"}
                </span>
              </Button>
            </label>
            {url && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
                <X className="size-4" aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
          <Input
            type="url"
            placeholder="or paste an image URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      </div>

      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
