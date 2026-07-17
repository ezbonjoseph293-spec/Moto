import { AdminBottomTabBar, AdminSidebar } from "@/components/layout/admin-nav";

/**
 * Dealer admin dashboard shell. Mobile: bottom tab bar (a salesperson on a
 * phone). Desktop: sidebar. Stage 2 wraps this in auth guards scoped to the
 * signed-in staff member's dealership; Stage 4+ fill in each module.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex-1">
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:pb-6">{children}</main>
      </div>
      <AdminBottomTabBar />
    </div>
  );
}
