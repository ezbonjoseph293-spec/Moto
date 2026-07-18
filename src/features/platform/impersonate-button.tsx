"use client";

import { useTransition } from "react";
import { UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startImpersonationAction } from "./impersonation";

export function ImpersonateButton({ targetUserId }: { targetUserId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => startImpersonationAction(formData))}
    >
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        <UserCog className="size-4" aria-hidden="true" />
        {isPending ? "Switching…" : "Impersonate"}
      </Button>
    </form>
  );
}
