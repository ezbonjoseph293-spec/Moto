import { AdminBottomTabBar, AdminSidebar } from "@/components/layout/admin-nav";
import { AdminUserMenu } from "@/components/layout/admin-user-menu";
import { AdminBillingGate } from "@/components/layout/admin-billing-gate";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { requireRole } from "@/features/auth/require-role";
import { forPlatform } from "@/features/tenancy";

/**
 * Dealer admin dashboard shell. Mobile: bottom tab bar (a salesperson on a
 * phone). Desktop: sidebar. Guarded to signed-in OWNER/MANAGER/SALES staff,
 * scoped to their own dealership (session.dealershipId) — Stage 4+ fill in
 * each module.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);

  const dealership = user.dealershipId
    ? await forPlatform().dealership.findUnique({
        where: { id: user.dealershipId },
        select: { status: true },
      })
    : null;

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1">
        {user.impersonatedBy && <ImpersonationBanner adminName={user.impersonatedBy.name} />}
        <AdminUserMenu user={user} />
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:pb-6">
          <AdminBillingGate dealershipStatus={dealership?.status ?? "ACTIVE"}>
            {children}
          </AdminBillingGate>
        </main>
      </div>
      <AdminBottomTabBar />
    </div>
  );
}
