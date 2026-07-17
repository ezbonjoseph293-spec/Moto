import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers } from "lucide-react";

import { getDealerBySlug, listPublicCollections } from "@/features/storefront/service";
import { EmptyState } from "@/components/ui/empty-state";
import { dealerUrl } from "@/lib/seo";

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
    title: "Collections",
    description: `Browse curated vehicle collections at ${name}.`,
    alternates: { canonical: dealerUrl(dealerSlug, "/collections") },
  };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const collections = await listPublicCollections(dealer.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink sm:text-3xl">Collections</h1>

      {collections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No collections yet"
          description="Check back soon — curated collections will appear here."
        />
      ) : (
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
                <h2 className="font-heading text-lg font-semibold text-white">{c.name}</h2>
                {c.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-white/70">{c.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
