"use client";

import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackClickAction } from "@/features/storefront/actions";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/theme";

/** Sticky price + CTA bar, always visible on mobile; static block on desktop. */
export function VehicleStickyBar({
  dealerSlug,
  dealershipId,
  dealerName,
  vehicleId,
  vehicleSlug,
  title,
  price,
  discountPrice,
  currency,
  whatsappNumber,
  phone,
  className,
}: {
  dealerSlug: string;
  dealershipId: string;
  dealerName: string;
  vehicleId: string;
  vehicleSlug: string;
  title: string;
  price: string;
  discountPrice: string | null;
  currency: string;
  whatsappNumber?: string | null;
  phone?: string | null;
  className?: string;
}) {
  const displayPrice = discountPrice ?? price;

  return (
    <div
      className={
        className ??
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-2px_12px_rgba(15,23,34,0.1)] backdrop-blur-sm lg:static lg:z-auto lg:rounded-lg lg:border lg:p-5 lg:shadow-card"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 lg:mx-0 lg:flex-col lg:items-stretch">
        <div className="flex-1 lg:flex-none">
          <p className="text-lg font-bold tabular-nums text-ink lg:text-2xl">
            {formatPrice(displayPrice, currency)}
          </p>
          {discountPrice && (
            <p className="text-xs tabular-nums text-muted-foreground line-through">
              {formatPrice(price, currency)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 lg:mt-4 lg:flex-col lg:items-stretch">
          {whatsappNumber && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Chat on WhatsApp"
            >
              <a
                href={whatsappLink(whatsappNumber, `Hi ${dealerName}, I'm interested in the ${title}.`)}
                target="_blank"
                rel="noreferrer"
                onClick={() => void trackClickAction(dealershipId, "WHATSAPP_CLICK", vehicleId)}
              >
                <MessageCircle className="size-5" aria-hidden="true" />
              </a>
            </Button>
          )}
          {phone && (
            <Button asChild variant="outline" size="icon" className="lg:hidden" aria-label="Call">
              <a
                href={`tel:${phone}`}
                onClick={() => void trackClickAction(dealershipId, "CALL_CLICK", vehicleId)}
              >
                <Phone className="size-5" aria-hidden="true" />
              </a>
            </Button>
          )}

          <Button asChild size="lg" className="flex-1 lg:flex-none">
            <Link
              href={`/${dealerSlug}/reserve?vehicle=${vehicleSlug}`}
              onClick={() => void trackClickAction(dealershipId, "RESERVE_CLICK", vehicleId)}
            >
              Reserve this car
            </Link>
          </Button>

          {whatsappNumber && (
            <Button asChild variant="outline" size="lg" className="hidden lg:inline-flex">
              <a
                href={whatsappLink(whatsappNumber, `Hi ${dealerName}, I'm interested in the ${title}.`)}
                target="_blank"
                rel="noreferrer"
                onClick={() => void trackClickAction(dealershipId, "WHATSAPP_CLICK", vehicleId)}
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
          )}
          {phone && (
            <Button asChild variant="outline" size="lg" className="hidden lg:inline-flex">
              <a
                href={`tel:${phone}`}
                onClick={() => void trackClickAction(dealershipId, "CALL_CLICK", vehicleId)}
              >
                <Phone className="size-4" aria-hidden="true" />
                Call dealer
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
