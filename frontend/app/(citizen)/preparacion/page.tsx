import type { Metadata } from "next"

import { PreparacionPage } from "@/components/preparacion/preparacion-page"

export const metadata: Metadata = { title: "Preparación" }

export default function PreparacionRoute() {
  return <PreparacionPage />
}
