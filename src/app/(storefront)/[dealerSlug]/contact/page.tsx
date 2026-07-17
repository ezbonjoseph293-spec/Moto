import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { getDealerBySlug } from "@/features/storefront/service";
import { ContactForm } from "@/components/storefront/contact-form";
import { dealerUrl } from "@/lib/seo";
import { whatsappLink } from "@/lib/theme";
import type { BusinessHours } from "@/features/settings/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}): Promise<Metadata> {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return {};
  const name = dealer.setting?.businessName || dealer.name;

  return {
    title: "Contact",
    description: `Get in touch with ${name} — call, WhatsApp, or send a message.`,
    alternates: { canonical: dealerUrl(dealerSlug, "/contact") },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const setting = dealer.setting;
  const dealerName = setting?.businessName || dealer.name;
  const hours = setting?.businessHours as BusinessHours | null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">Contact us</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Have a question about a vehicle, financing, or a reservation? Send us a message and{" "}
        {dealerName} will get back to you shortly.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="space-y-3 rounded-lg border border-border bg-card p-6 shadow-card">
            {setting?.phonePrimary && (
              <a
                href={`tel:${setting.phonePrimary}`}
                className="flex items-center gap-3 text-sm text-ink hover:text-brand"
              >
                <Phone className="size-4 shrink-0" aria-hidden="true" /> {setting.phonePrimary}
              </a>
            )}
            {setting?.whatsappNumber && (
              <a
                href={whatsappLink(setting.whatsappNumber, `Hi ${dealerName}, `)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-ink hover:text-brand"
              >
                <MessageCircle className="size-4 shrink-0" aria-hidden="true" /> WhatsApp us
              </a>
            )}
            {setting?.email && (
              <a
                href={`mailto:${setting.email}`}
                className="flex items-center gap-3 text-sm text-ink hover:text-brand"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" /> {setting.email}
              </a>
            )}
            {setting?.address && (
              <p className="flex items-start gap-3 text-sm text-ink">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {setting.address}
              </p>
            )}
            {hours && (
              <div className="flex items-start gap-3 text-sm text-ink">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">Mon – Fri</dt>
                  <dd>{hours.mon_fri}</dd>
                  <dt className="text-muted-foreground">Saturday</dt>
                  <dd>{hours.sat}</dd>
                  <dt className="text-muted-foreground">Sunday</dt>
                  <dd>{hours.sun}</dd>
                </dl>
              </div>
            )}
          </div>

          {setting?.latitude != null && setting?.longitude != null && (
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                title={`${dealerName} location`}
                className="h-56 w-full"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${setting.longitude - 0.01}%2C${setting.latitude - 0.01}%2C${setting.longitude + 0.01}%2C${setting.latitude + 0.01}&layer=mapnik&marker=${setting.latitude}%2C${setting.longitude}`}
              />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-card">
          <ContactForm dealershipId={dealer.id} />
        </div>
      </div>
    </main>
  );
}
