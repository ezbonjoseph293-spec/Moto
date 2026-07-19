"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { Testimonial } from "@prisma/client";
import { Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { deleteTestimonialAction } from "./actions";
import { TestimonialFormDialog } from "./testimonial-form-dialog";

export function TestimonialManager({ testimonials }: { testimonials: Testimonial[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">Testimonials</h2>
          <p className="text-sm text-muted-foreground">
            Featured testimonials show on your homepage.
          </p>
        </div>
        <TestimonialFormDialog />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {testimonials.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          No testimonials yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {testimonials.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                {t.customerPhoto ? (
                  <Image
                    src={t.customerPhoto}
                    alt={t.customerName}
                    width={40}
                    height={40}
                    unoptimized
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-sm font-semibold text-brand">
                    {t.customerName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{t.customerName}</p>
                    {t.isFeatured && <Badge variant="gold">Featured</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.message}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="mr-1 flex gap-0.5 text-gold">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-3.5" fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <TestimonialFormDialog testimonial={t} />
                <ConfirmActionButton
                  title="Delete this testimonial?"
                  description={`The testimonial from ${t.customerName} will be permanently removed, including from your homepage if it's featured.`}
                  confirmLabel="Delete"
                  onConfirm={() =>
                    startTransition(async () => {
                      await deleteTestimonialAction(t.id);
                      setError(null);
                    })
                  }
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Delete testimonial from ${t.customerName}`}
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
    </div>
  );
}
