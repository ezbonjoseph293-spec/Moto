"use client";

import { useActionState, useEffect, useState } from "react";
import type { BodyType } from "@prisma/client";
import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/media/image-upload";
import { createBodyTypeAction, updateBodyTypeAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function BodyTypeFormDialog({ bodyType }: { bodyType?: BodyType }) {
  const [open, setOpen] = useState(false);
  const action = bodyType ? updateBodyTypeAction.bind(null, bodyType.id) : createBodyTypeAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {bodyType ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Edit ${bodyType.name}`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Add body type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bodyType ? "Edit body type" : "Add body type"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bodytype-name">Name</Label>
            <Input id="bodytype-name" name="name" required defaultValue={bodyType?.name} />
          </div>
          <ImageUpload
            name="iconUrl"
            label="Icon"
            purpose="body-types"
            defaultValue={bodyType?.iconUrl}
          />
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
