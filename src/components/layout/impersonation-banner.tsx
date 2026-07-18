import { UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exitImpersonationAction } from "@/features/platform/impersonation";

export function ImpersonationBanner({ adminName }: { adminName: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-gold px-4 py-2 text-sm font-medium text-ink sm:px-6">
      <span className="flex items-center gap-2">
        <UserCog className="size-4" aria-hidden="true" />
        Viewing as this dealer — impersonated by {adminName}
      </span>
      <form action={exitImpersonationAction}>
        <Button type="submit" size="sm" variant="outline">
          Exit
        </Button>
      </form>
    </div>
  );
}
