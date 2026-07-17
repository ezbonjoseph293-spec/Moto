import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/**
 * Platform Super Admin shell. Simple top-nav layout (operator-only surface,
 * no phone-usage requirement). Stage 2 adds the PLATFORM_ADMIN-only guard;
 * Stage 8 fills in dealers/plans/metrics.
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <ShieldCheck className="size-5 text-gold" aria-hidden="true" />
          <Link href="/platform" className="font-heading text-lg font-bold text-white">
            Moto Platform
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-lg bg-surface p-6 shadow-card">{children}</div>
      </main>
    </div>
  );
}
