import Image from "next/image";
import { Star } from "lucide-react";
import type { Testimonial } from "@prisma/client";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6 shadow-card">
      <div className="mb-3 flex gap-0.5 text-gold">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="size-4"
            fill={i < testimonial.rating ? "currentColor" : "none"}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="flex-1 text-sm text-ink/90">&ldquo;{testimonial.message}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        {testimonial.customerPhoto ? (
          <Image
            src={testimonial.customerPhoto}
            alt={testimonial.customerName}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-brand/10 font-heading text-sm font-semibold text-brand">
            {testimonial.customerName.charAt(0)}
          </div>
        )}
        <p className="text-sm font-semibold text-ink">{testimonial.customerName}</p>
      </div>
    </div>
  );
}
