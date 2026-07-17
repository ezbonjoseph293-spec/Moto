import { AdminBottomTabBar, AdminSidebar } from "@/components/layout/admin-nav";
import { AdminUserMenu } from "@/components/layout/admin-user-menu";
import { requireRole } from "@/features/auth/require-role";

/**
 * Dealer admin dashboard shell. Mobile: bottom tab bar (a salesperson on a
 * phone). Desktop: sidebar. Guarded to signed-in OWNER/MANAGER/SALES staff,
 * scoped to their own dealership (session.dealershipId) — Stage 4+ fill in
 * each module.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1">
        <AdminUserMenu user={user} />
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:pb-6">{children}</main>
      </div>
      <AdminBottomTabBar />
    </div>
  );
}
