import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDealerBySlug, getPageByKey } from "@/features/storefront/service";
import { dealerUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}): Promise<Metadata> {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return {};

  const page = await getPageByKey(dealer.id, "ABOUT");
  const name = dealer.setting?.businessName || dealer.name;

  return {
    title: page?.seoTitle || "About",
    description: page?.seoDescription || `Learn more about ${name}.`,
    alternates: { canonical: dealerUrl(dealerSlug, "/about") },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const page = await getPageByKey(dealer.id, "ABOUT");
  const name = dealer.setting?.businessName || dealer.name;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        {page?.title || `About ${name}`}
      </h1>
      <div className="mt-6 text-sm leading-relaxed whitespace-pre-line text-ink/80 sm:text-base">
        {page?.content ||
          dealer.setting?.tagline ||
          `${name} is committed to helping you find the right vehicle at a fair price.`}
      </div>
    </main>
  );
}
