import type { NextConfig } from "next"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Parent repo has its own bun.lock (tooling). Pin Turbopack to this app so the
// Client Manifest resolves modules under frontend/, not the monorepo root.
const appRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Required by frontend/Dockerfile (standalone runner copies .next/standalone).
  output: "standalone",
  turbopack: {
    root: appRoot,
  },
}

export default nextConfig
