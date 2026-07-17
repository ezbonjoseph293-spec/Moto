import type { UploadPurpose } from "./upload-purpose";

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export type UploadedAsset = { url: string; publicId: string };

/**
 * Direct-to-Cloudinary upload shared by every media manager (single image,
 * multi-image, video, document). File bytes never touch our server — only a
 * short-lived signature does (`/api/uploads/sign`).
 */
export async function uploadToCloudinary(
  file: File,
  purpose: UploadPurpose,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<UploadedAsset> {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose }),
  });

  if (!signRes.ok) {
    const body = (await signRes.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not start the upload.");
  }

  const sig = (await signRes.json()) as CloudinarySignature;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
    { method: "POST", body: form },
  );

  if (!uploadRes.ok) throw new Error("Upload to Cloudinary failed.");

  const uploaded = (await uploadRes.json()) as { secure_url: string; public_id: string };
  return { url: uploaded.secure_url, publicId: uploaded.public_id };
}
