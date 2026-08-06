"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

const RotatingEarth = dynamic(
  () =>
    import("@/components/globe/rotating-earth").then((m) => m.RotatingEarth),
  { ssr: false },
)

function isMapRoute(pathname: string): boolean {
  return (
    pathname === "/monitor" ||
    pathname.startsWith("/monitor/") ||
    pathname === "/evacuacion" ||
    pathname.startsWith("/evacuacion/")
  )
}

/** Fixed rotating globe behind citizen non-map pages. Hidden on MapLibre routes. */
export function GlobePageBackground() {
  const pathname = usePathname()

  if (isMapRoute(pathname)) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <RotatingEarth
        className="h-full w-full"
        skipIntro
        autoRotate
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  )
}
