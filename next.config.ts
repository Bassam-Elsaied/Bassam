import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.5"],
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  async redirects() {
    return [
      {
        source: "/lab",
        destination: "/work",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
