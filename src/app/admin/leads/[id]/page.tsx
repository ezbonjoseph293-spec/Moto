import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/features/auth/require-role";
import { getLead, listAssignableStaff } from "@/features/leads/service";
import { LeadStatusBadge, leadSourceLabel } from "@/features/leads/lead-status-badge";
import { LeadActions, LeadNoteForm } from "@/features/leads/lead-actions";

export const metadata = { title: "Lead" };

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const { id } = await params;
  const [lead, staff] = await Promise.all([
    getLead(user.dealershipId, id),
    listAssignableStaff(user.dealershipId),
  ]);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/leads" className="text-sm text-muted-foreground hover:underline">
          ← Leads
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-ink">{lead.name}</h1>
          <LeadStatusBadge status={lead.status} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-heading text-base font-bold text-ink">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="text-ink">{leadSourceLabel(lead.source)}</dd>
            </div>
            {lead.phone && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="text-ink">{lead.phone}</dd>
              </div>
            )}
            {lead.email && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-ink">{lead.email}</dd>
              </div>
            )}
            {lead.vehicle && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Vehicle</dt>
                <dd className="text-ink">{lead.vehicle.title}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-ink">{lead.createdAt.toLocaleString()}</dd>
            </div>
            {lead.message && (
              <div>
                <dt className="text-muted-foreground">Message</dt>
                <dd className="mt-1 text-ink">{lead.message}</dd>
              </div>
            )}
          </dl>
        </div>

        <LeadActions
          leadId={lead.id}
          status={lead.status}
          assignedToId={lead.assignedToId}
          staff={staff}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-base font-bold text-ink">Notes</h2>
        <LeadNoteForm leadId={lead.id} />
        <ul className="space-y-3 border-t border-border pt-3">
          {lead.notes.map((note) => (
            <li key={note.id} className="text-sm">
              <p className="text-ink">{note.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {note.author.name} · {note.createdAt.toLocaleString()}
              </p>
            </li>
          ))}
          {lead.notes.length === 0 && (
            <li className="text-sm text-muted-foreground">No notes yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
