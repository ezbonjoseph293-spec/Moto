"use client";

import { useState } from "react";
import type { VehicleVideo } from "@prisma/client";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addVehicleVideoAction, deleteVehicleVideoAction } from "./actions";

export function VehicleVideoManager({
  vehicleId,
  videos,
}: {
  vehicleId: string;
  videos: VehicleVideo[];
}) {
  const [items, setItems] = useState(videos);
  const [url, setUrl] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!url.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      await addVehicleVideoAction(vehicleId, url.trim());
      setItems((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          url: url.trim(),
          provider: "cloudinary",
          order: current.length,
        } as VehicleVideo,
      ]);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add video.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(id: string) {
    setItems((current) => current.filter((v) => v.id !== id));
    await deleteVehicleVideoAction(vehicleId, id);
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((video) => (
            <li
              key={video.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-primary"
              >
                {video.url}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => handleDelete(video.id)}
                aria-label="Remove video"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://... (YouTube, Vimeo, or Cloudinary video URL)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !url.trim()}
          onClick={handleAdd}
        >
          Add
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
