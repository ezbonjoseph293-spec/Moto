import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link missing a token</CardTitle>
          <CardDescription>
            This reset link is incomplete. Request a new one from the{" "}
            <Link href="/forgot-password" className="text-primary underline underline-offset-4">
              forgot password
            </Link>{" "}
            page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
