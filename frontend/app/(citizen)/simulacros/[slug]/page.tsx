import type { Metadata } from "next"

import { SimulacroDetailPage } from "@/components/simulacros/simulacro-detail-page"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Simulacro · ${slug}`,
  }
}

export default async function SimulacroDetailRoute({ params }: Props) {
  const { slug } = await params
  return <SimulacroDetailPage slug={slug} />
}
