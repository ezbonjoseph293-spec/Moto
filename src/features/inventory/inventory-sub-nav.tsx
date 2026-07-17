"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/admin/inventory",
    label: "Vehicles",
    match: (p: string) =>
      !p.startsWith("/admin/inventory/brands") && !p.startsWith("/admin/inventory/collections"),
  },
  { href: "/admin/inventory/brands", label: "Brands & body types" },
  { href: "/admin/inventory/collections", label: "Collections" },
];

export function InventorySubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = tab.match ? tab.match(pathname) : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
