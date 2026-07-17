"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Collection } from "@prisma/client";
import { ArrowDown, ArrowUp, Layers, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCollectionAction, moveCollectionAction } from "./actions";

type CollectionRow = Collection & { _count: { items: number } };

export function CollectionList({ collections }: { collections: CollectionRow[] }) {
  const [, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  if (collections.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
        No collections yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {collections.map((collection, index) => (
        <li
          key={collection.id}
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
        >
          <Link
            href={`/admin/inventory/collections/${collection.id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {collection.imageUrl ? (
                <Image
                  src={collection.imageUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="size-10 object-cover"
                />
              ) : (
                <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{collection.name}</p>
              <p className="text-xs text-muted-foreground">
                {collection.ruleType === "MANUAL"
                  ? `${collection._count.items} vehicle(s)`
                  : "Rule-based"}
                {collection.isFeatured && (
                  <>
                    {" "}
                    · <Badge variant="gold">Featured</Badge>
                  </>
                )}
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={() => startTransition(() => void moveCollectionAction(collection.id, "up"))}
              aria-label={`Move ${collection.name} up`}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === collections.length - 1}
              onClick={() =>
                startTransition(() => void moveCollectionAction(collection.id, "down"))
              }
              aria-label={`Move ${collection.name} down`}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
            <AlertDialog
              open={deleting === collection.id}
              onOpenChange={(o) => setDeleting(o ? collection.id : null)}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${collection.name}`}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete &quot;{collection.name}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      startTransition(() => void deleteCollectionAction(collection.id))
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </li>
      ))}
    </ul>
  );
}
