import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import {
  getDealerBySlug,
  getPublicVehicleBySlug,
  getRelatedVehicles,
  recordVehicleView,
} from "@/features/storefront/service";
import { VehicleGallery } from "@/components/storefront/vehicle-gallery";
import { VehicleStickyBar } from "@/components/storefront/vehicle-sticky-bar";
import { VehicleInquiryForm } from "@/components/storefront/vehicle-inquiry-form";
import { VehicleCard } from "@/components/storefront/vehicle-card";
import { ShareButton } from "@/components/storefront/share-button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  conditionLabel,
  driveTypeLabel,
  formatMileage,
  fuelLabel,
  transmissionLabel,
} from "@/lib/format";
import { dealerUrl, vehicleJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string; slug: string }>;
}): Promise<Metadata> {
  const { dealerSlug, slug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return {};

  const vehicle = await getPublicVehicleBySlug(dealer.id, slug);
  if (!vehicle) return {};

  const title = `${vehicle.year} ${vehicle.title}`;
  const description = vehicle.description.slice(0, 160);
  const cover = vehicle.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: dealerUrl(dealerSlug, `/inventory/${vehicle.slug}`) },
    openGraph: { title, description, images: cover ? [cover] : undefined },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ dealerSlug: string; slug: string }>;
}) {
  const { dealerSlug, slug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const vehicle = await getPublicVehicleBySlug(dealer.id, slug);
  if (!vehicle) notFound();

  await recordVehicleView(dealer.id, vehicle.id, `/${dealerSlug}/inventory/${slug}`);

  const related = await getRelatedVehicles(dealer.id, {
    id: vehicle.id,
    brandId: vehicle.brandId,
    bodyTypeId: vehicle.bodyTypeId,
  });

  const setting = dealer.setting;
  const dealerName = setting?.businessName || dealer.name;
  const features = Array.isArray(vehicle.features) ? (vehicle.features as string[]) : [];

  const specs: [string, string][] = [
    ["Condition", conditionLabel(vehicle.condition)],
    ["Year", String(vehicle.year)],
    ["Mileage", formatMileage(vehicle.mileage, vehicle.mileageUnit)],
    ["Fuel type", fuelLabel(vehicle.fuelType)],
    ["Transmission", transmissionLabel(vehicle.transmission)],
    ...(vehicle.driveType ? ([["Drive type", driveTypeLabel(vehicle.driveType)]] as [string, string][]) : []),
    ...(vehicle.color ? ([["Color", vehicle.color]] as [string, string][]) : []),
    ...(vehicle.seats ? ([["Seats", String(vehicle.seats)]] as [string, string][]) : []),
    ...(vehicle.doors ? ([["Doors", String(vehicle.doors)]] as [string, string][]) : []),
    ...(vehicle.engineSizeCc
      ? ([["Engine size", `${vehicle.engineSizeCc} cc`]] as [string, string][])
      : []),
    ...(vehicle.bodyType ? ([["Body style", vehicle.bodyType.name]] as [string, string][]) : []),
  ];

  const jsonLd = vehicleJsonLd(dealerSlug, dealerName, {
    title: vehicle.title,
    description: vehicle.description,
    slug: vehicle.slug,
    year: vehicle.year,
    price: (vehicle.discountPrice ?? vehicle.price).toString(),
    currency: vehicle.currency,
    condition: vehicle.condition,
    mileage: vehicle.mileage,
    mileageUnit: vehicle.mileageUnit,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    color: vehicle.color,
    brand: vehicle.brand,
    images: vehicle.images,
  });

  return (
    <main className="pb-28 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link href={`/${dealerSlug}/inventory`} className="hover:text-ink">
            Inventory
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink">
            {vehicle.year} {vehicle.title}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <VehicleGallery
              images={vehicle.images.map((i) => ({ id: i.id, url: i.url, altText: i.altText }))}
              title={vehicle.title}
            />

            <div className="mt-6">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {vehicle.brand.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
                  {vehicle.year} {vehicle.title}
                </h1>
                {vehicle.status === "RESERVED" && <Badge variant="reserved">Reserved</Badge>}
                {vehicle.isFeatured && <Badge variant="gold">Featured</Badge>}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Description</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink/80">
                {vehicle.description}
              </p>
            </div>

            <div className="mt-8">
              <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Specifications</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-3">
                {specs.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {features.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Features</h2>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink/80">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {vehicle.documents.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Brochures</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-ink hover:bg-muted"
                    >
                      <FileText className="size-4" aria-hidden="true" />
                      {doc.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {vehicle.videos.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Video</h2>
                <div className="space-y-3">
                  {vehicle.videos.map((v) => (
                    <div key={v.id} className="aspect-video overflow-hidden rounded-lg bg-ink">
                      <video src={v.url} controls className="h-full w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <Accordion type="single" collapsible>
                <AccordionItem value="deposit">
                  <AccordionTrigger className="font-heading text-base font-semibold text-ink">
                    Reservation & deposit policy
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {setting?.refundPolicyText ||
                      "Reserve this car with a small deposit to hold it while you arrange payment or a viewing. Full terms are shown at checkout."}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="mt-8">
              <ShareButton title={`${vehicle.year} ${vehicle.title}`} />
            </div>
          </div>

          {/* Desktop sidebar: price/reserve + inquiry form */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <VehicleStickyBar
                dealerSlug={dealerSlug}
                dealershipId={dealer.id}
                dealerName={dealerName}
                vehicleId={vehicle.id}
                vehicleSlug={vehicle.slug}
                title={`${vehicle.year} ${vehicle.title}`}
                price={vehicle.price.toString()}
                discountPrice={vehicle.discountPrice?.toString() ?? null}
                currency={vehicle.currency}
                whatsappNumber={setting?.whatsappNumber}
                phone={setting?.phonePrimary}
              />

              <div className="rounded-lg border border-border bg-card p-5 shadow-card">
                <h2 className="mb-3 font-heading text-base font-semibold text-ink">
                  Ask about this car
                </h2>
                <VehicleInquiryForm
                  dealershipId={dealer.id}
                  vehicleId={vehicle.id}
                  vehicleTitle={`${vehicle.year} ${vehicle.title}`}
                />
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-4 font-heading text-xl font-bold text-ink">Related vehicles</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((v) => (
                <VehicleCard key={v.id} vehicle={v} dealerSlug={dealerSlug} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile-only inquiry form, below the fold */}
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:hidden">
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-heading text-base font-semibold text-ink">
            Ask about this car
          </h2>
          <VehicleInquiryForm
            dealershipId={dealer.id}
            vehicleId={vehicle.id}
            vehicleTitle={`${vehicle.year} ${vehicle.title}`}
          />
        </div>
      </div>

      {/* Sticky mobile price + reserve bar */}
      <div className="lg:hidden">
        <VehicleStickyBar
          dealerSlug={dealerSlug}
          dealershipId={dealer.id}
          dealerName={dealerName}
          vehicleId={vehicle.id}
          vehicleSlug={vehicle.slug}
          title={`${vehicle.year} ${vehicle.title}`}
          price={vehicle.price.toString()}
          discountPrice={vehicle.discountPrice?.toString() ?? null}
          currency={vehicle.currency}
          whatsappNumber={setting?.whatsappNumber}
          phone={setting?.phonePrimary}
        />
      </div>
    </main>
  );
}
