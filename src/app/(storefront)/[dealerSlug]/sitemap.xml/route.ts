import { NextResponse } from "next/server";

import { getDealerBySlug, listPolicyPages } from "@/features/storefront/service";
import { forDealership } from "@/features/tenancy";
import { dealerUrl } from "@/lib/seo";

export const revalidate = 3600;

type UrlEntry = { loc: string; lastmod?: string; priority?: string };

function toXml(urls: UrlEntry[]): string {
  const body = urls
    .map(
      (u) =>
        `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}${
          u.priority ? `<priority>${u.priority}</priority>` : ""
        }</url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ dealerSlug: string }> }) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return new NextResponse("Not found", { status: 404 });

  const db = forDealership(dealer.id);
  const [vehicles, collections, pages] = await Promise.all([
    db.vehicle.findMany({
      where: { status: "AVAILABLE" },
      select: { slug: true, updatedAt: true },
    }),
    db.collection.findMany({ select: { slug: true, updatedAt: true } }),
    listPolicyPages(dealer.id),
  ]);

  const urls: UrlEntry[] = [
    { loc: dealerUrl(dealerSlug), priority: "1.0" },
    { loc: dealerUrl(dealerSlug, "/inventory"), priority: "0.9" },
    { loc: dealerUrl(dealerSlug, "/collections"), priority: "0.7" },
    { loc: dealerUrl(dealerSlug, "/about"), priority: "0.5" },
    { loc: dealerUrl(dealerSlug, "/contact"), priority: "0.5" },
    ...vehicles.map((v) => ({
      loc: dealerUrl(dealerSlug, `/inventory/${v.slug}`),
      lastmod: v.updatedAt.toISOString(),
      priority: "0.8",
    })),
    ...collections.map((c) => ({
      loc: dealerUrl(dealerSlug, `/collections/${c.slug}`),
      lastmod: c.updatedAt.toISOString(),
      priority: "0.6",
    })),
    ...pages.map((p) => ({
      loc: dealerUrl(dealerSlug, `/${p.slug}`),
      lastmod: p.updatedAt.toISOString(),
      priority: "0.3",
    })),
  ];

  return new NextResponse(toXml(urls), {
    headers: { "Content-Type": "application/xml" },
  });
}
