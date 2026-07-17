import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <ShieldAlert className="text-destructive size-10" aria-hidden="true" />
      <h1 className="font-heading text-2xl font-bold text-ink">You don&apos;t have access</h1>
      <p className="text-muted-foreground max-w-sm">
        Your account doesn&apos;t have permission to view this page. If you think this is a
        mistake, contact your dealership owner or the platform admin.
      </p>
      <Link href="/" className="text-primary underline underline-offset-4">
        Back to home
      </Link>
    </div>
  );
}
