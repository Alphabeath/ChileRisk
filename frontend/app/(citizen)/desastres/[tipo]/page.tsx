import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { GuideContent } from "@/components/disasters/guide-content"
import { ScrollRoot } from "@/components/disasters/scroll-reveal"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import { getGuide, getGuideSummary, listGuideSummaries } from "@/lib/senapred-guides"
import { cn } from "@/lib/utils"

type Props = { params: Promise<{ tipo: string }> }

export function generateStaticParams() {
  return listGuideSummaries().map((g) => ({ tipo: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tipo } = await params
  const summary = getGuideSummary(tipo)
  if (!summary) return {}
  return { title: summary.title, description: summary.blurb }
}

export default async function DisasterGuidePage({ params }: Props) {
  const { tipo } = await params
  const guide = getGuide(tipo)
  if (!guide) notFound()

  return (
    <ScrollRoot
      className={cn("h-full overflow-y-auto", CITIZEN_NAVBAR_PAD_TOP_CLASS)}
    >
      <GuideContent guide={guide} />
    </ScrollRoot>
  )
}
