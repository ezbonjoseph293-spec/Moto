import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function AdminLeadsPage() {
  return (
    <EmptyState
      icon={Inbox}
      title="Leads inbox"
      description="Inquiries, deposit events, and staff assignment land in Stage 7."
    />
  );
}
