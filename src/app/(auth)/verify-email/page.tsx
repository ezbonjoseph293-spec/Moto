import Link from "next/link";
import { verifyEmailToken } from "@/features/auth/service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Verify your email" };

const COPY = {
  verified: {
    title: "Email verified",
    body: "Your email is confirmed. You can now log in.",
  },
  "already-verified": {
    title: "Already verified",
    body: "This email was already confirmed. You can log in.",
  },
  "invalid-or-expired": {
    title: "Link invalid or expired",
    body: "This verification link is no longer valid. Sign up again to get a new one.",
  },
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailToken(token) : "invalid-or-expired";
  const { title, body } = COPY[result];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
