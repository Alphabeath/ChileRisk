import type { Metadata } from "next"

import { DisastersPage } from "@/components/disasters/disasters-page"

export const metadata: Metadata = { title: "Desastres" }

export default function DesastresRoute() {
  return <DisastersPage />
}
