import type { Metadata } from "next"

import { KitEmergenciaPage } from "@/components/preparacion/kit-emergencia-page"

export const metadata: Metadata = { title: "Kit de emergencia" }

export default function KitEmergenciaRoute() {
  return <KitEmergenciaPage />
}
