import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pino uses worker threads and dynamic requires; keep it out of the bundle.
  serverExternalPackages: ["pino", "pino-pretty"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
