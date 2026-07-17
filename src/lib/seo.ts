import { getEnv } from "./env";

/** Base URL for canonical links, sitemaps, and JSON-LD — no trailing slash. */
export function siteUrl(): string {
  return getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function dealerUrl(dealerSlug: string, path = ""): string {
  return `${siteUrl()}/${dealerSlug}${path}`;
}

type VehicleForJsonLd = {
  title: string;
  description: string;
  slug: string;
  year: number;
  price: unknown; // Prisma.Decimal — stringified
  currency: string;
  condition: string;
  mileage: number | null;
  mileageUnit: string;
  fuelType: string;
  transmission: string;
  color: string | null;
  brand: { name: string };
  images: { url: string }[];
};

/** schema.org Vehicle JSON-LD for a vehicle detail page. */
export function vehicleJsonLd(dealerSlug: string, dealerName: string, vehicle: VehicleForJsonLd) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.title,
    description: vehicle.description,
    url: dealerUrl(dealerSlug, `/inventory/${vehicle.slug}`),
    image: vehicle.images.map((i) => i.url),
    brand: { "@type": "Brand", name: vehicle.brand.name },
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: vehicle.mileage
      ? { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: vehicle.mileageUnit === "MILES" ? "SMI" : "KMT" }
      : undefined,
    fuelType: vehicle.fuelType,
    vehicleTransmission: vehicle.transmission,
    color: vehicle.color ?? undefined,
    itemCondition:
      vehicle.condition === "NEW"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: String(vehicle.price),
      priceCurrency: vehicle.currency,
      availability: "https://schema.org/InStock",
      seller: { "@type": "AutoDealer", name: dealerName },
    },
  };
}

type DealerForJsonLd = {
  name: string;
  tagline?: string | null;
  logoLightUrl?: string | null;
  phonePrimary?: string | null;
  email?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** schema.org AutoDealer JSON-LD for the storefront root / about page. */
export function autoDealerJsonLd(dealerSlug: string, setting: DealerForJsonLd) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: setting.name,
    description: setting.tagline ?? undefined,
    url: dealerUrl(dealerSlug),
    logo: setting.logoLightUrl ?? undefined,
    telephone: setting.phonePrimary ?? undefined,
    email: setting.email ?? undefined,
    address: setting.address
      ? { "@type": "PostalAddress", streetAddress: setting.address }
      : undefined,
    geo:
      setting.latitude != null && setting.longitude != null
        ? { "@type": "GeoCoordinates", latitude: setting.latitude, longitude: setting.longitude }
        : undefined,
  };
}
