import { createHash } from "crypto";
import { getEnv } from "./env";

export type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};

export function isCloudinaryConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

/**
 * `resource_type` (image/video/raw) is only ever part of the upload *URL*,
 * never a signed parameter, so a signature alone can't stop a caller from
 * POSTing to a different resource_type endpoint than the one the UI intended.
 * `allowed_formats` IS a signable parameter Cloudinary enforces server-side,
 * so it's what actually constrains what a "vehicle-images" or
 * "vehicle-documents" signature can be used to upload.
 */
const ALLOWED_FORMATS: Record<string, string> = {
  branding: "jpg,jpeg,png,webp,svg",
  favicon: "jpg,jpeg,png,webp,svg,ico",
  "vehicle-images": "jpg,jpeg,png,webp",
  "vehicle-videos": "mp4,mov,webm",
  "vehicle-documents": "pdf",
  brands: "jpg,jpeg,png,webp,svg",
  "body-types": "jpg,jpeg,png,webp,svg",
  collections: "jpg,jpeg,png,webp",
  testimonials: "jpg,jpeg,png,webp",
};

/**
 * Signs a direct-to-Cloudinary upload so image bytes never pass through our
 * server. Per Cloudinary's signing algorithm: every param that will be sent
 * with the upload (other than file/api_key/signature/resource_type) is
 * sorted alphabetically, joined as `key=value&key2=value2`, the API secret
 * is appended, and the result is SHA-1 hashed. Implemented with Node's
 * built-in crypto — no Cloudinary SDK dependency needed for this.
 */
export function signCloudinaryUpload(folder: string, purpose: string): CloudinaryUploadSignature {
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured.");
  }

  const allowedFormats = ALLOWED_FORMATS[purpose] ?? "jpg,jpeg,png,webp";
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { allowed_formats: allowedFormats, folder, timestamp };
  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
    .join("&");

  const signature = createHash("sha1")
    .update(toSign + env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    allowedFormats,
    signature,
  };
}
