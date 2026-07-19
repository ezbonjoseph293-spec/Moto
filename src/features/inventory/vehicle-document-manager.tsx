"use client";

import { useState } from "react";
import type { VehicleDocument } from "@prisma/client";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Input } from "@/components/ui/input";
import { uploadToCloudinary } from "@/components/media/upload-file";
import { addVehicleDocumentAction, deleteVehicleDocumentAction } from "./actions";

export function VehicleDocumentManager({
  vehicleId,
  documents,
}: {
  vehicleId: string;
  documents: VehicleDocument[];
}) {
  const [items, setItems] = useState(documents);
  const [label, setLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const docLabel = label.trim() || file.name.replace(/\.pdf$/i, "");
    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadToCloudinary(file, "vehicle-documents", "raw");
      await addVehicleDocumentAction(vehicleId, { url: uploaded.url, label: docLabel });
      setItems((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          url: uploaded.url,
          label: docLabel,
          order: current.length,
        } as VehicleDocument,
      ]);
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setItems((current) => current.filter((d) => d.id !== id));
    await deleteVehicleDocumentAction(vehicleId, id);
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-primary"
              >
                <FileText className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{doc.label}</span>
              </a>
              <ConfirmActionButton
                title="Remove this document?"
                description={`"${doc.label}" will no longer be available to buyers on this listing.`}
                confirmLabel="Remove"
                onConfirm={() => handleDelete(doc.id)}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label="Remove document"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Brochure label (e.g. Full Spec Sheet)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <label className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {isUploading ? "Uploading…" : "Upload PDF"}
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
