import type { Metadata } from "next"

import { auth } from "@/auth"
import { InicioPage } from "@/components/inicio/inicio-page"

export const metadata: Metadata = { title: "Inicio" }

export default async function InicioRoute() {
  const session = await auth()
  return <InicioPage authenticated={Boolean(session?.user)} />
}
