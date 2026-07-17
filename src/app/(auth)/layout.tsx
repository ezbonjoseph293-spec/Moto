import Link from "next/link";

/**
 * Shared shell for the platform-wide identity flows (login, signup,
 * verify-email, forgot/reset password). These are not scoped to a dealer —
 * a staff member's dealership and a customer's role are resolved from their
 * account after sign-in, not from the URL.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border px-4 py-5 sm:px-6">
        <Link href="/" className="font-heading text-lg font-bold text-ink">
          Moto
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
