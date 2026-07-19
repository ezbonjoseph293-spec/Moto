import { LogoutButton } from "@/features/auth/logout-button";
import type { AuthenticatedUser } from "@/features/auth/require-role";

const ROLE_LABEL: Record<AuthenticatedUser["role"], string> = {
  PLATFORM_ADMIN: "Platform Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  SALES: "Sales",
  CUSTOMER: "Customer",
};

export function AdminUserMenu({ user }: { user: AuthenticatedUser }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{user.name}</p>
        <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
      </div>
      <LogoutButton variant="outline" size="sm" />
    </div>
  );
}
