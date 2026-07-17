import { Car } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function AdminInventoryPage() {
  return (
    <EmptyState
      icon={Car}
      title="Inventory"
      description="Vehicle CRUD, media, brands, body types, and collections are built in Stage 4."
    />
  );
}
