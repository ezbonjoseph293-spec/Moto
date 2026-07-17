"use client";

import { useActionState, useEffect, useState } from "react";
import type { Brand } from "@prisma/client";
import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/media/image-upload";
import { createBrandAction, updateBrandAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function BrandFormDialog({ brand }: { brand?: Brand }) {
  const [open, setOpen] = useState(false);
  const action = brand ? updateBrandAction.bind(null, brand.id) : createBrandAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isFeatured, setIsFeatured] = useState(brand?.isFeatured ?? false);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {brand ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Edit ${brand.name}`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Add brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{brand ? "Edit brand" : "Add brand"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Name</Label>
            <Input id="brand-name" name="name" required defaultValue={brand?.name} />
          </div>
          <ImageUpload name="logoUrl" label="Logo" purpose="brands" defaultValue={brand?.logoUrl} />
          <div className="space-y-1.5">
            <Label htmlFor="brand-description">Description</Label>
            <Textarea
              id="brand-description"
              name="description"
              rows={3}
              defaultValue={brand?.description ?? ""}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="brand-featured"
              name="isFeatured"
              value="on"
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
            <Label htmlFor="brand-featured" className="cursor-pointer">
              Featured brand
            </Label>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
