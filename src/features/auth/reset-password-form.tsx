"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: FormState = { ok: false };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  if (state.ok && state.message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {state.error && <p className="text-destructive text-sm">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
