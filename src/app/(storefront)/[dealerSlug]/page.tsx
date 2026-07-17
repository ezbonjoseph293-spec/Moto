import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, ThumbsUp, Truck } from "lucide-react";

import {
  getDealerBySlug,
  listFeaturedVehicles,
  listLatestVehicles,
  listPublicBrands,
  listPublicCollections,
  listTestimonials,
} from "@/features/storefront/service";
import { VehicleCard } from "@/components/storefront/vehicle-card";
import { SectionHeading } from "@/components/storefront/section-heading";
import { TestimonialCard } from "@/components/storefront/testimonial-card";
import { Button } from "@/components/ui/button";
import { autoDealerJsonLd, dealerUrl } from "@/lib/seo";
import type { SocialLinks } from "@/features/settings/schema";

const WHY_CHOOSE_US = [
  { icon: ShieldCheck, title: "Verified inventory", body: "Every listing is inspected and accurately described before it goes live." },
  { icon: ThumbsUp, title: "Fair, transparent pricing", body: "No hidden fees — the price you see is the price you pay." },
  { icon: Truck, title: "Nationwide delivery", body: "We can arrange delivery to wherever you are." },
  { icon: Sparkles, title: "Easy online reservation", body: "Secure your car with a deposit from your phone, in minutes." },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}): Promise<Metadata> {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return {};

  const name = dealer.setting?.businessName || dealer.name;
  const description =
    dealer.setting?.tagline || `Browse ${name}'s current inventory of quality vehicles.`;

  return {
    title: name,
    description,
    alternates: { canonical: dealerUrl(dealerSlug) },
    openGraph: {
      title: name,
      description,
      url: dealerUrl(dealerSlug),
      images: dealer.setting?.logoLightUrl ? [dealer.setting.logoLightUrl] : undefined,
    },
  };
}

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const setting = dealer.setting;
  const dealerName = setting?.businessName || dealer.name;

  const [featured, latest, collections, brands, testimonials] = await Promise.all([
    listFeaturedVehicles(dealer.id, 8),
    listLatestVehicles(dealer.id, 8),
    listPublicCollections(dealer.id, { featuredOnly: true }),
    listPublicBrands(dealer.id, { featuredOnly: true }),
    listTestimonials(dealer.id, { featuredOnly: true }),
  ]);

  const socials = (setting?.socialLinks as SocialLinks | null) ?? {};
  const jsonLd = autoDealerJsonLd(dealerSlug, {
    name: dealerName,
    tagline: setting?.tagline,
    logoLightUrl: setting?.logoLightUrl,
    phonePrimary: setting?.phonePrimary,
    email: setting?.email,
    address: setting?.address,
    latitude: setting?.latitude,
    longitude: setting?.longitude,
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-start justify-center gap-6 px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold tracking-widest text-brand uppercase">
            {dealerName}
          </p>
          <h1 className="max-w-2xl font-heading text-4xl leading-tight font-bold text-white sm:text-5xl md:text-6xl">
            {setting?.tagline || "Find your next car, reserved online in minutes"}
          </h1>
          <p className="max-w-xl text-lg text-white/70">
            Browse verified, quality-checked vehicles and secure the one you want with a
            refundable online deposit — no dealership visit required to hold your car.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={`/${dealerSlug}/inventory`}>
                Browse inventory
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="inverse">
              <Link href={`/${dealerSlug}/contact`}>Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured vehicles */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <SectionHeading eyebrow="Handpicked" title="Featured vehicles" className="mb-0" />
            <Link
              href={`/${dealerSlug}/inventory`}
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline sm:flex"
            >
              View all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} dealerSlug={dealerSlug} />
            ))}
          </div>
        </section>
      )}

      {/* Latest arrivals */}
      {latest.length > 0 && (
        <section className="bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Just in" title="Latest arrivals" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {latest.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} dealerSlug={dealerSlug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="Curated" title="Shop by collection" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/${dealerSlug}/collections/${c.slug}`}
                className="group relative flex aspect-[16/9] items-end overflow-hidden rounded-lg bg-ink"
              >
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover opacity-70 transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="relative z-10 p-5">
                  <h3 className="font-heading text-lg font-semibold text-white">{c.name}</h3>
                  {c.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-white/70">{c.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why choose us */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Why us" title={`Why buy from ${dealerName}`} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE_US.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-6 shadow-card">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand strip */}
      {brands.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="We stock" title="Brands we carry" align="center" />
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/${dealerSlug}/inventory?brandId=${b.id}`}
                className="flex items-center gap-2 grayscale transition hover:grayscale-0"
              >
                {b.logoUrl ? (
                  <Image
                    src={b.logoUrl}
                    alt={b.name}
                    width={100}
                    height={40}
                    className="h-8 w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="font-heading text-lg font-semibold text-ink">{b.name}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Trusted" title="What our customers say" align="center" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-lg bg-ink px-6 py-14 text-center">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Ready to find your next car?
          </h2>
          <p className="max-w-md text-white/70">
            Browse the full inventory, filter by what matters to you, and reserve online with a
            deposit.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link href={`/${dealerSlug}/inventory`}>
              Browse inventory <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          {(socials.facebook || socials.instagram) && (
            <p className="text-xs text-white/50">Follow us for new arrivals and offers.</p>
          )}
        </div>
      </section>
    </main>
  );
}
