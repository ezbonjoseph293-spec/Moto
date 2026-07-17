import { createHash } from "crypto";
import { getEnv } from "./env";

export type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export function isCloudinaryConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

/**
 * Signs a direct-to-Cloudinary upload so image bytes never pass through our
 * server. Per Cloudinary's signing algorithm: every param that will be sent
 * with the upload (other than file/api_key/signature/resource_type) is
 * sorted alphabetically, joined as `key=value&key2=value2`, the API secret
 * is appended, and the result is SHA-1 hashed. Implemented with Node's
 * built-in crypto — no Cloudinary SDK dependency needed for this.
 */
export function signCloudinaryUpload(folder: string): CloudinaryUploadSignature {
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
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
    signature,
  };
}
