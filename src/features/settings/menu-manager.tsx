"use client";

import { useActionState, useTransition } from "react";
import type { Menu } from "@prisma/client";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMenuItemAction,
  deleteMenuItemAction,
  moveMenuItemAction,
  type FormState,
} from "./actions";

const initialState: FormState = { ok: false };

function MenuList({ items, location }: { items: Menu[]; location: "HEADER" | "FOOTER" }) {
  const [, startTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(createMenuItemAction, initialState);

  return (
    <fieldset className="space-y-3 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        {location === "HEADER" ? "Header navigation" : "Footer navigation"}
      </legend>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No links yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.url}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => startTransition(() => void moveMenuItemAction(item.id, "up"))}
                  aria-label={`Move ${item.label} up`}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === items.length - 1}
                  onClick={() => startTransition(() => void moveMenuItemAction(item.id, "down"))}
                  aria-label={`Move ${item.label} down`}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Button>
                <ConfirmActionButton
                  title={`Delete "${item.label}"?`}
                  description="This link will be removed from the menu. You can always add it back."
                  confirmLabel="Delete"
                  onConfirm={() => startTransition(() => void deleteMenuItemAction(item.id))}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${item.label}`}
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                    </Button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={formAction}
        className="flex flex-wrap items-end gap-2 border-t border-border pt-3"
      >
        <input type="hidden" name="location" value={location} />
        <div className="min-w-32 flex-1 space-y-1">
          <Label htmlFor={`${location}-label`} className="text-xs">
            Label
          </Label>
          <Input
            id={`${location}-label`}
            name="label"
            placeholder="Inventory"
            required
            maxLength={60}
          />
        </div>
        <div className="min-w-40 flex-1 space-y-1">
          <Label htmlFor={`${location}-url`} className="text-xs">
            URL
          </Label>
          <Input
            id={`${location}-url`}
            name="url"
            placeholder="/inventory"
            required
            maxLength={300}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? "Adding…" : "Add link"}
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </fieldset>
  );
}

export function MenuManager({ header, footer }: { header: Menu[]; footer: Menu[] }) {
  return (
    <div className="max-w-xl space-y-6">
      <MenuList items={header} location="HEADER" />
      <MenuList items={footer} location="FOOTER" />
    </div>
  );
}
