"use client";

import { useActionState, useEffect, useState } from "react";
import type { SerializedSetting } from "./schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/media/image-upload";
import { updateIdentityAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function IdentityForm({
  setting,
  onSaved,
}: {
  setting: SerializedSetting;
  onSaved?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateIdentityAction, initialState);
  const [brandColor, setBrandColor] = useState(setting.brandColor);
  const [borderRadius, setBorderRadius] = useState(setting.borderRadius);
  const [businessName, setBusinessName] = useState(setting.businessName ?? "");
  const [tagline, setTagline] = useState(setting.tagline ?? "");

  useEffect(() => {
    if (state.ok) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const radiusPx = { none: "0px", sm: "6px", md: "12px", lg: "20px" }[borderRadius] ?? "12px";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              name="businessName"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              placeholder="e.g. Uganda's trusted premium dealer"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload
            name="logoLightUrl"
            label="Logo (light background)"
            purpose="branding"
            defaultValue={setting.logoLightUrl}
          />
          <ImageUpload
            name="logoDarkUrl"
            label="Logo (dark background)"
            purpose="branding"
            defaultValue={setting.logoDarkUrl}
          />
        </div>
        <ImageUpload
          name="faviconUrl"
          label="Favicon"
          purpose="favicon"
          defaultValue={setting.faviconUrl}
          hint="Square image, at least 64x64."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brandColor">Brand color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick brand color"
                value={/^#([0-9a-f]{6})$/i.test(brandColor) ? brandColor : "#2563eb"}
                onChange={(e) => setBrandColor(e.target.value)}
                className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-card p-1"
              />
              <Input
                id="brandColor"
                name="brandColor"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fontChoice">Font</Label>
            <Select name="fontChoice" defaultValue={setting.fontChoice}>
              <SelectTrigger id="fontChoice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Space Grotesk + Inter (default)</SelectItem>
                <SelectItem value="classic">Classic serif headings</SelectItem>
                <SelectItem value="modern">Modern system sans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="borderRadius">Corner style</Label>
            <Select
              name="borderRadius"
              defaultValue={setting.borderRadius}
              onValueChange={setBorderRadius}
            >
              <SelectTrigger id="borderRadius">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sharp (0px)</SelectItem>
                <SelectItem value="sm">Subtle (6px)</SelectItem>
                <SelectItem value="md">Rounded (12px)</SelectItem>
                <SelectItem value="lg">Very rounded (20px)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buttonStyle">Button style</Label>
            <Select name="buttonStyle" defaultValue={setting.buttonStyle}>
              <SelectTrigger id="buttonStyle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.ok && state.message && (
          <p className="text-status-available text-sm">{state.message}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save branding"}
        </Button>
      </form>

      <div className="space-y-2">
        <span className="text-sm font-medium text-ink">Live preview</span>
        <div
          className="overflow-hidden border border-border shadow-card"
          style={{ borderRadius: radiusPx }}
        >
          <div className="p-5" style={{ backgroundColor: "#0F1722" }}>
            <div className="font-heading text-lg font-bold text-white">
              {businessName || "Your Dealership"}
            </div>
            {tagline && <p className="mt-1 text-xs text-white/70">{tagline}</p>}
          </div>
          <div className="space-y-3 bg-card p-5">
            <p className="text-xs text-muted-foreground">Reserve this car</p>
            <button
              type="button"
              disabled
              className="w-full px-4 py-2 text-sm font-medium text-white"
              style={{
                backgroundColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(brandColor)
                  ? brandColor
                  : "#2563eb",
                borderRadius: radiusPx,
              }}
            >
              Pay deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
