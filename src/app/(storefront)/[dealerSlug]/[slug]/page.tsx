import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDealerBySlug, getPageBySlug } from "@/features/storefront/service";
import { MarkdownContent } from "@/components/content/markdown-content";
import { dealerUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string; slug: string }>;
}): Promise<Metadata> {
  const { dealerSlug, slug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return {};

  const page = await getPageBySlug(dealer.id, slug);
  if (!page) return {};

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription ?? undefined,
    alternates: { canonical: dealerUrl(dealerSlug, `/${slug}`) },
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ dealerSlug: string; slug: string }>;
}) {
  const { dealerSlug, slug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const page = await getPageBySlug(dealer.id, slug);
  if (!page || page.key === "ABOUT") notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">{page.title}</h1>
      <div className="mt-6">
        <MarkdownContent content={page.content} />
      </div>
    </main>
  );
}
