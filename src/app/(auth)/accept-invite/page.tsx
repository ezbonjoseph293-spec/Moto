import Link from "next/link";
import { getInviteByToken } from "@/features/team/service";
import { AcceptInviteForm } from "@/features/team/accept-invite-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Accept invite" };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invite = token ? await getInviteByToken(token) : null;

  if (!token || !invite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite invalid or expired</CardTitle>
          <CardDescription>
            This invite link is no longer valid. Ask the dealership owner to send you a new one, or{" "}
            <Link href="/login" className="text-primary underline underline-offset-4">
              log in
            </Link>{" "}
            if you already have an account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <AcceptInviteForm token={token} email={invite.email} />;
}
