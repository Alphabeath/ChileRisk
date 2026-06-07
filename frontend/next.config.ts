import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/map",
        destination: "/monitor",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
