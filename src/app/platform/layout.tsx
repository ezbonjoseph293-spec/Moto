import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/features/auth/require-role";
import { LogoutButton } from "@/features/auth/logout-button";

/**
 * Platform Super Admin shell. Simple top-nav layout (operator-only surface,
 * no phone-usage requirement). Guarded to PLATFORM_ADMIN only — Stage 8
 * fills in dealers/plans/metrics.
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["PLATFORM_ADMIN"]);

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <ShieldCheck className="size-5 text-gold" aria-hidden="true" />
          <Link href="/platform" className="font-heading text-lg font-bold text-white">
            Moto Platform
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-white/70">{user.name}</span>
            <LogoutButton variant="inverse" size="sm" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-lg bg-surface p-6 shadow-card">{children}</div>
      </main>
    </div>
  );
}
