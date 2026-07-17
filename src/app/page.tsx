import Link from "next/link";
import { Building2, Car, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const entryPoints = [
  {
    href: "/demo-motors",
    icon: Car,
    title: "Demo storefront",
    description: "See a dealership's public site at /{dealerSlug}.",
  },
  {
    href: "/admin",
    icon: Building2,
    title: "Dealer dashboard",
    description: "The admin a dealership owner or salesperson uses day to day.",
  },
  {
    href: "/platform",
    icon: ShieldCheck,
    title: "Platform admin",
    description: "Operator view for managing dealerships and subscriptions.",
  },
];

export default function MarketingHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-16 px-6 py-20 text-center sm:py-28">
      <div className="flex flex-col items-center gap-5">
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase shadow-card">
          Stage 0 — Project Foundation
        </span>
        <h1 className="font-heading max-w-3xl text-4xl font-bold text-balance sm:text-5xl">
          The premium platform for multi-dealer car retail
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Every dealership gets a storefront that rivals Mercedes-Benz, Porsche, and Tesla — plus
          a dashboard powerful enough to run their whole business from a phone.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {entryPoints.map(({ href, icon: Icon, title, description }) => (
          <Card key={href} className="text-left transition-shadow hover:shadow-card-hover">
            <CardHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
