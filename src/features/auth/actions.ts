"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import * as authService from "./service";

export type FormState = { ok: boolean; error?: string; message?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export async function signupAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const limited = rateLimit(`signup:${ip}`, 5, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many signup attempts. Please try again later." };
  }

  const result = await authService.signupCustomer(parsed.data);
  if (!result.ok) return result;

  return { ok: true, message: "Check your email for a verification link." };
}

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  callbackUrl: z.string().optional(),
});

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const limited = rateLimit(`login:${ip}:${parsed.data.email.toLowerCase()}`, 8, 60);
  if (!limited.success) {
    return { ok: false, error: "Too many login attempts. Please wait a minute and try again." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl || "/admin",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password, or your email isn't verified yet." };
    }
    // Auth.js signals a successful sign-in redirect by throwing a special
    // Next.js redirect error — it must be rethrown, not swallowed, so the
    // navigation actually happens.
    throw error;
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export async function forgotPasswordAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const limited = rateLimit(`forgot-password:${ip}`, 5, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many requests. Please try again later." };
  }

  await authService.requestPasswordReset(parsed.data.email);

  return { ok: true, message: "If an account exists for that email, a reset link is on its way." };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export async function resetPasswordAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const limited = rateLimit(`reset-password:${ip}`, 10, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  const result = await authService.resetPassword(parsed.data.token, parsed.data.password);
  if (result === "invalid-or-expired") {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  return { ok: true, message: "Password updated. You can now log in." };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
