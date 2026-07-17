"use client";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export type GalleryImage = { id: string; url: string; altText: string | null };

/**
 * Swipeable main gallery + thumbnail strip for the vehicle detail page.
 * Falls back to a placeholder tile when the vehicle has no photos yet.
 */
export function VehicleGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageOff className="size-8" aria-hidden="true" />
          Photos coming soon
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Swiper
          modules={[Navigation, Thumbs, FreeMode]}
          thumbs={{ swiper: thumbsSwiper }}
          navigation={{ prevEl: ".vg-prev", nextEl: ".vg-next" }}
          className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted"
        >
          {images.map((img, i) => (
            <SwiperSlide key={img.id}>
              <div className="relative h-full w-full">
                <Image
                  src={img.url}
                  alt={img.altText || `${title} — photo ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              className="vg-prev absolute top-1/2 left-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink shadow-card hover:bg-card"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              className="vg-next absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink shadow-card hover:bg-card"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <Swiper
          modules={[FreeMode, Thumbs]}
          onSwiper={setThumbsSwiper}
          freeMode
          watchSlidesProgress
          slidesPerView={4.5}
          spaceBetween={8}
          className="w-full"
        >
          {images.map((img, i) => (
            <SwiperSlide key={img.id} className="cursor-pointer">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border opacity-70 transition-opacity hover:opacity-100 [.swiper-slide-thumb-active_&]:border-brand [.swiper-slide-thumb-active_&]:opacity-100">
                <Image
                  src={img.url}
                  alt={img.altText || `${title} — thumbnail ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
