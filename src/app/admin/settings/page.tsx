import { requireRole } from "@/features/auth/require-role";
import { getSettings, listMenuItems } from "@/features/settings/service";
import { SettingsTabs } from "@/features/settings/settings-tabs";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) {
    throw new Error("This account has no dealership.");
  }

  const [setting, menus] = await Promise.all([
    getSettings(user.dealershipId),
    listMenuItems(user.dealershipId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Website & business settings</h1>
        <p className="text-sm text-muted-foreground">
          Everything here applies instantly to your live storefront.
        </p>
      </div>

      <SettingsTabs setting={setting} headerMenu={menus.header} footerMenu={menus.footer} />
    </div>
  );
}
