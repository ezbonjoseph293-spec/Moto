import { Settings } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function AdminSettingsPage() {
  return (
    <EmptyState
      icon={Settings}
      title="Website & business settings"
      description="Branding, contacts, navigation, and deposit rules are built in Stage 3."
    />
  );
}
