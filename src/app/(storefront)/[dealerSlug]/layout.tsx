import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Phone } from "lucide-react";

import { forPlatform } from "@/features/tenancy";
import { FONT_HEADING_STACK, RADIUS_PX, whatsappLink } from "@/lib/theme";
import type { BusinessHours, SocialLinks } from "@/features/settings/schema";

async function resolveDealer(slug: string) {
  const db = forPlatform();
  return db.dealership.findUnique({
    where: { slug },
    include: {
      setting: true,
      menus: { orderBy: { order: "asc" } },
    },
  });
}

/**
 * Storefront shell for `/{dealerSlug}` — resolves the dealer from the
 * database (branding, contacts, nav) and 404s for unknown slugs. Branding
 * (brand color, corner radius, heading font) is applied via inline CSS
 * variables scoped to this subtree, so it can never leak between dealers on
 * the same request.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const dealer = await resolveDealer(dealerSlug);

  if (!dealer) notFound();

  const setting = dealer.setting;
  const dealerName = setting?.businessName || dealer.name;
  const headerLinks = dealer.menus.filter((m) => m.location === "HEADER");
  const footerLinks = dealer.menus.filter((m) => m.location === "FOOTER");
  const socials = (setting?.socialLinks as SocialLinks | null) ?? {};
  const hours = setting?.businessHours as BusinessHours | null;

  return (
    <div
      className="flex min-h-screen flex-col bg-surface"
      style={{
        ["--brand" as string]: setting?.brandColor || "#2563eb",
        ["--radius" as string]: RADIUS_PX[setting?.borderRadius ?? "md"] ?? RADIUS_PX.md,
        ["--font-heading" as string]: FONT_HEADING_STACK[setting?.fontChoice ?? "default"],
      }}
    >
      {setting?.announcementBarActive && setting.announcementBarText && (
        <div className="bg-brand px-4 py-2 text-center text-sm font-medium text-white">
          {setting.announcementBarText}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/${dealerSlug}`} className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            {setting?.logoLightUrl ? (
              <Image
                src={setting.logoLightUrl}
                alt={dealerName}
                width={140}
                height={40}
                className="h-9 w-auto object-contain"
                unoptimized
              />
            ) : (
              dealerName
            )}
          </Link>
          {headerLinks.length > 0 && (
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
              {headerLinks.map((link) => (
                <Link key={link.id} href={`/${dealerSlug}${link.url}`} className="hover:text-ink">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div className="font-heading text-lg font-bold">{dealerName}</div>
            {setting?.tagline && <p className="text-sm text-white/70">{setting.tagline}</p>}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {setting?.phonePrimary && (
                <a href={`tel:${setting.phonePrimary}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="size-4" aria-hidden="true" /> {setting.phonePrimary}
                </a>
              )}
              {setting?.whatsappNumber && (
                <a
                  href={whatsappLink(setting.whatsappNumber, `Hi ${dealerName}, `)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp us
                </a>
              )}
              {setting?.address && (
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" aria-hidden="true" /> {setting.address}
                </span>
              )}
            </div>

            {hours && (
              <dl className="grid max-w-xs grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/60">
                <dt>Mon – Fri</dt>
                <dd>{hours.mon_fri}</dd>
                <dt>Saturday</dt>
                <dd>{hours.sat}</dd>
                <dt>Sunday</dt>
                <dd>{hours.sun}</dd>
              </dl>
            )}

            {(socials.facebook || socials.instagram || socials.twitter || socials.tiktok) && (
              <div className="flex gap-4 text-xs text-white/60">
                {socials.facebook && <a href={socials.facebook} target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>}
                {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>}
                {socials.twitter && <a href={socials.twitter} target="_blank" rel="noreferrer" className="hover:text-white">X / Twitter</a>}
                {socials.tiktok && <a href={socials.tiktok} target="_blank" rel="noreferrer" className="hover:text-white">TikTok</a>}
              </div>
            )}

            {footerLinks.length > 0 && (
              <nav className="flex flex-wrap gap-4 text-xs text-white/60">
                {footerLinks.map((link) => (
                  <Link key={link.id} href={`/${dealerSlug}${link.url}`} className="hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {setting?.latitude != null && setting?.longitude != null && (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <iframe
                title={`${dealerName} location`}
                className="h-48 w-full"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${setting.longitude - 0.01}%2C${setting.latitude - 0.01}%2C${setting.longitude + 0.01}%2C${setting.latitude + 0.01}&layer=mapnik&marker=${setting.latitude}%2C${setting.longitude}`}
              />
            </div>
          )}
        </div>

        <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40 sm:px-6">
          &copy; {new Date().getFullYear()} {dealerName}. Powered by Moto.
        </p>
      </footer>
    </div>
  );
}
