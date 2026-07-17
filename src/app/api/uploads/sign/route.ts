import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/features/auth/require-role";
import { isCloudinaryConfigured, signCloudinaryUpload } from "@/lib/cloudinary";

const bodySchema = z.object({
  purpose: z.enum(["branding", "favicon"]),
});

/**
 * Issues a short-lived signature so the browser can upload directly to
 * Cloudinary (the image never touches our server). Scoped to the caller's
 * own dealership folder — a dealer can never write into another dealer's
 * media folder even though this signature isn't itself tenant-checked by
 * Cloudinary.
 */
export async function POST(request: Request) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) {
    return NextResponse.json({ error: "No dealership on this account." }, { status: 403 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Media uploads are not configured yet. Paste an image URL instead." },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const folder = `dealers/${user.dealershipId}/${parsed.data.purpose}`;
  const signature = signCloudinaryUpload(folder);

  return NextResponse.json(signature);
}
