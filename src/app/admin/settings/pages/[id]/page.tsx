import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/features/auth/require-role";
import { getPage, getPageHistory } from "@/features/settings/service";
import { PageEditorForm } from "@/features/settings/page-editor-form";

export const metadata = { title: "Edit page" };

export default async function AdminPageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const { id } = await params;
  const page = await getPage(user.dealershipId, id);
  if (!page) notFound();

  const history = await getPageHistory(user.dealershipId, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/settings/pages"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Pages &amp; policies
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-ink">{page.title}</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <PageEditorForm page={page} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-base font-bold text-ink">Save history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="flex justify-between border-b border-border pb-2 last:border-0"
            >
              <span className="text-ink">Saved</span>
              <span className="text-muted-foreground">
                {entry.actor?.name ?? "System"} · {entry.createdAt.toLocaleString()}
              </span>
            </li>
          ))}
          {history.length === 0 && <li className="text-muted-foreground">No edits yet.</li>}
        </ul>
      </div>
    </div>
  );
}
