import Link from "next/link";

import { requireRole } from "@/features/auth/require-role";
import { listPages } from "@/features/settings/service";

export const metadata = { title: "Pages & policies" };

const PAGE_LABELS: Record<string, string> = {
  ABOUT: "About",
  PRIVACY: "Privacy policy",
  TERMS: "Terms & conditions",
  COOKIE_POLICY: "Cookie policy",
  WARRANTY: "Warranty",
  RETURNS: "Returns",
  FINANCING: "Financing",
};

export default async function AdminPagesPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const pages = await listPages(user.dealershipId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/settings" className="text-sm text-muted-foreground hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-ink">Pages &amp; policies</h1>
        <p className="text-sm text-muted-foreground">
          Edit the content that appears on your storefront&apos;s about and policy pages.
        </p>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {pages.map((page) => (
          <li key={page.id}>
            <Link
              href={`/admin/settings/pages/${page.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {PAGE_LABELS[page.key] ?? page.title}
                </p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                Updated {page.updatedAt.toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
