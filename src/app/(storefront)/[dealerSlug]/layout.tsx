import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Phone } from "lucide-react";

import { titleCaseSlug } from "@/lib/utils";

/**
 * Storefront shell for `/{dealerSlug}`.
 * Stage 0: renders the real header/footer chrome with a placeholder brand
 * name derived from the slug. Stage 3 replaces this with the dealer resolved
 * from the database (branding, contacts, nav, 404 for unknown slugs) — the
 * `notFound()` import is already wired for that.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;

  // Slugs are validated for real once dealers are resolved from the DB (Stage 3).
  if (!dealerSlug) notFound();

  const dealerName = titleCaseSlug(dealerSlug);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/${dealerSlug}`} className="font-heading text-lg font-bold text-ink">
            {dealerName}
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <Link href={`/${dealerSlug}`} className="hover:text-ink">
              Inventory
            </Link>
            <Link href={`/${dealerSlug}`} className="hover:text-ink">
              About
            </Link>
            <Link href={`/${dealerSlug}`} className="hover:text-ink">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
          <div className="font-heading text-lg font-bold">{dealerName}</div>
          <div className="flex flex-wrap gap-6 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <Phone className="size-4" aria-hidden="true" /> Contact via dashboard settings
            </span>
            <span className="flex items-center gap-2">
              <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp link (Stage 3)
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" /> Address (Stage 3)
            </span>
          </div>
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} {dealerName}. Powered by Moto.
          </p>
        </div>
      </footer>
    </div>
  );
}
