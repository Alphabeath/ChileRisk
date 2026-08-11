import type { Metadata } from "next"

import { SimulacrosPage } from "@/components/simulacros/simulacros-page"

export const metadata: Metadata = { title: "Simulacros" }

export default function SimulacrosRoute() {
  return <SimulacrosPage />
}
