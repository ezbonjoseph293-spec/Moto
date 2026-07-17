import Link from "next/link";

import { requireRole } from "@/features/auth/require-role";
import { listStaff, listPendingInvites, listTeamActivity } from "@/features/team/service";
import { InviteStaffForm } from "@/features/team/invite-form";
import { StaffTable } from "@/features/team/staff-table";
import { PendingInvitesList } from "@/features/team/pending-invites-list";
import { ActivityLog } from "@/features/team/activity-log";

export const metadata = { title: "Team" };

export default async function AdminTeamPage() {
  const user = await requireRole(["OWNER"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const [staff, invites, activity] = await Promise.all([
    listStaff(user.dealershipId),
    listPendingInvites(user.dealershipId),
    listTeamActivity(user.dealershipId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/settings" className="text-sm text-muted-foreground hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-ink">Team</h1>
        <p className="text-sm text-muted-foreground">
          Invite staff, manage roles, and review recent activity.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-base font-bold text-ink">Invite staff</h2>
        <InviteStaffForm />
        <PendingInvitesList invites={invites} />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-base font-bold text-ink">Staff</h2>
        <StaffTable staff={staff} currentUserId={user.id} />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-base font-bold text-ink">Activity log</h2>
        <ActivityLog entries={activity} />
      </div>
    </div>
  );
}
