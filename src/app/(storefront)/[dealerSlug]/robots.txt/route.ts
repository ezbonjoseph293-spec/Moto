import { NextResponse } from "next/server";

import { getDealerBySlug } from "@/features/storefront/service";
import { dealerUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ dealerSlug: string }> }) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return new NextResponse("Not found", { status: 404 });

  const body = [
    "User-agent: *",
    `Disallow: /${dealerSlug}/reserve`,
    "Allow: /",
    `Sitemap: ${dealerUrl(dealerSlug, "/sitemap.xml")}`,
  ].join("\n");

  return new NextResponse(body, { headers: { "Content-Type": "text/plain" } });
}
