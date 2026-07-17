"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { VehicleImage } from "@prisma/client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Star, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/components/media/upload-file";
import {
  addVehicleImageAction,
  deleteVehicleImageAction,
  reorderVehicleImagesAction,
  setCoverImageAction,
} from "./actions";

function SortableThumb({
  image,
  onSetCover,
  onDelete,
}: {
  image: VehicleImage;
  onSetCover: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted",
        isDragging && "z-10 opacity-70",
      )}
    >
      <Image src={image.url} alt={image.altText ?? ""} fill unoptimized className="object-cover" />

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 flex size-7 cursor-grab items-center justify-center rounded-md bg-ink/60 text-white active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>

      {image.isCover && (
        <span className="absolute top-1.5 right-1.5 rounded-md bg-gold px-2 py-0.5 text-[10px] font-semibold text-ink">
          Cover
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        {!image.isCover && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-white hover:bg-white/20 hover:text-white"
            onClick={() => onSetCover(image.id)}
            aria-label="Set as cover"
          >
            <Star className="size-4" aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto size-7 text-white hover:bg-white/20 hover:text-white"
          onClick={() => onDelete(image.id)}
          aria-label="Delete image"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function VehicleImageManager({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: VehicleImage[];
}) {
  const [items, setItems] = useState(images);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const router = useRouter();

  useEffect(() => {
    setItems(images);
  }, [images]);

  async function handleFiles(files: FileList) {
    setIsUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadToCloudinary(file, "vehicle-images", "image");
        await addVehicleImageAction(vehicleId, { url: uploaded.url, publicId: uploaded.publicId });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((i) => i.id === active.id);
      const newIndex = current.findIndex((i) => i.id === over.id);
      const next = arrayMove(current, oldIndex, newIndex);
      startTransition(() => {
        void reorderVehicleImagesAction(
          vehicleId,
          next.map((i) => i.id),
        );
      });
      return next;
    });
  }

  function handleSetCover(id: string) {
    setItems((current) => current.map((i) => ({ ...i, isCover: i.id === id })));
    startTransition(() => {
      void setCoverImageAction(vehicleId, id);
    });
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((i) => i.id !== id));
    startTransition(() => {
      void deleteVehicleImageAction(vehicleId, id);
    });
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((image) => (
              <SortableThumb
                key={image.id}
                image={image}
                onSetCover={handleSetCover}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground hover:bg-muted">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="size-4" aria-hidden="true" />
        )}
        {isUploading ? "Uploading…" : "Upload photos (drag thumbnails to reorder, star sets cover)"}
      </label>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
