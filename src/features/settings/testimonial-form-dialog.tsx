"use client";

import { useActionState, useEffect, useState } from "react";
import type { Testimonial } from "@prisma/client";
import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/media/image-upload";
import {
  createTestimonialAction,
  updateTestimonialAction,
  type FormState,
} from "./actions";

const initialState: FormState = { ok: false };

export function TestimonialFormDialog({ testimonial }: { testimonial?: Testimonial }) {
  const [open, setOpen] = useState(false);
  const [featured, setFeatured] = useState(testimonial?.isFeatured ?? false);
  const action = testimonial
    ? updateTestimonialAction.bind(null, testimonial.id)
    : createTestimonialAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {testimonial ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Edit testimonial from ${testimonial.customerName}`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Add testimonial
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{testimonial ? "Edit testimonial" : "Add testimonial"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customerName">Customer name</Label>
            <Input
              id="customerName"
              name="customerName"
              required
              defaultValue={testimonial?.customerName}
              maxLength={120}
            />
          </div>
          <ImageUpload
            name="customerPhoto"
            label="Photo (optional)"
            purpose="testimonials"
            defaultValue={testimonial?.customerPhoto}
          />
          <div className="space-y-1.5">
            <Label htmlFor="rating">Rating (1–5)</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              min={1}
              max={5}
              required
              defaultValue={testimonial?.rating ?? 5}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              rows={4}
              required
              defaultValue={testimonial?.message}
              maxLength={2000}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="isFeatured"
              name="isFeatured"
              value="on"
              checked={featured}
              onCheckedChange={setFeatured}
            />
            <Label htmlFor="isFeatured">Feature on homepage</Label>
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
