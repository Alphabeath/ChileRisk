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
      {
        source: "/evacuacion",
        destination: "/evacuation",
        permanent: true,
      },
      {
        source: "/preparacion",
        destination: "/preparation",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
