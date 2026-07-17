import Link from "next/link";
import { Inbox } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { listLeads, listAssignableStaff } from "@/features/leads/service";
import { leadStatusValues } from "@/features/leads/schema";
import { LeadStatusBadge, leadSourceLabel } from "@/features/leads/lead-status-badge";
import { LeadFilters } from "@/features/leads/lead-filters";
import { LeadPagination } from "@/features/leads/lead-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Leads" };

type SearchParams = Record<string, string | undefined>;

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const sp = await searchParams;
  const page = sp.page ? Number(sp.page) : 1;
  const status = (leadStatusValues as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof leadStatusValues)[number])
    : undefined;

  const [{ leads, totalPages }, staff] = await Promise.all([
    listLeads(user.dealershipId, {
      search: sp.search,
      status,
      source: sp.source as never,
      assignedToId: sp.assignedToId,
      page,
    }),
    listAssignableStaff(user.dealershipId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Leads inbox</h1>
        <p className="text-sm text-muted-foreground">
          Every inquiry, contact form, and deposit event in one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/leads"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${!status ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
        >
          All
        </Link>
        {leadStatusValues.map((s) => (
          <Link
            key={s}
            href={`/admin/leads?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${status === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      <LeadFilters staff={staff} />

      {leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No leads yet"
          description="Inquiries, contact-form submissions, and deposit events will show up here."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {lead.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {lead.phone ?? lead.email ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {leadSourceLabel(lead.source)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.vehicle ? lead.vehicle.title : "—"}
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.assignedTo?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadPagination page={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
