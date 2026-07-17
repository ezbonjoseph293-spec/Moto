"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { BodyType } from "@prisma/client";
import { ArrowDown, ArrowUp, Shapes, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteBodyTypeAction, moveBodyTypeAction } from "./actions";
import { BodyTypeFormDialog } from "./body-type-form-dialog";

type BodyTypeRow = BodyType & { _count: { vehicles: number } };

export function BodyTypeManager({ bodyTypes }: { bodyTypes: BodyTypeRow[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-ink">Body types</h2>
        <BodyTypeFormDialog />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {bodyTypes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          No body types yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {bodyTypes.map((bodyType, index) => (
            <li
              key={bodyType.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {bodyType.iconUrl ? (
                    <Image
                      src={bodyType.iconUrl}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="size-10 object-contain"
                    />
                  ) : (
                    <Shapes className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{bodyType.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bodyType._count.vehicles} vehicle(s)
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => startTransition(() => void moveBodyTypeAction(bodyType.id, "up"))}
                  aria-label={`Move ${bodyType.name} up`}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === bodyTypes.length - 1}
                  onClick={() =>
                    startTransition(() => void moveBodyTypeAction(bodyType.id, "down"))
                  }
                  aria-label={`Move ${bodyType.name} down`}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Button>
                <BodyTypeFormDialog bodyType={bodyType} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteBodyTypeAction(bodyType.id);
                      if (!result.ok) setError(result.error ?? "Could not delete body type.");
                      else setError(null);
                    })
                  }
                  aria-label={`Delete ${bodyType.name}`}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
