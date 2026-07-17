type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
  actor: { name: string; email: string } | null;
};

export function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex justify-between border-b border-border pb-2 last:border-0"
        >
          <span className="text-ink">
            {entry.action.replace(/[._]/g, " ")} · {entry.entityType}
          </span>
          <span className="text-muted-foreground">
            {entry.actor?.name ?? "System"} · {entry.createdAt.toLocaleString()}
          </span>
        </li>
      ))}
      {entries.length === 0 && <li className="text-muted-foreground">No activity yet.</li>}
    </ul>
  );
}
