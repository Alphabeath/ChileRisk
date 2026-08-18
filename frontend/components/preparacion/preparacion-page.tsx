import { ScrollRoot } from "@/components/disasters/scroll-reveal"
import { PreparacionHero } from "@/components/preparacion/preparacion-hero"
import {
  PreparacionDocuments,
  PreparacionIntroduction,
  PreparacionInvitations,
  PreparacionSteps,
  PreparacionTownStage,
} from "@/components/preparacion/preparacion-overview"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"

export function PreparacionPage() {
  return (
    <ScrollRoot
      className={cn("h-full overflow-y-auto", CITIZEN_NAVBAR_PAD_TOP_CLASS)}
    >
      <PreparacionHero />
      <PreparacionIntroduction />
      <PreparacionInvitations />
      <PreparacionTownStage>
        <PreparacionSteps />
      </PreparacionTownStage>
      <PreparacionDocuments />
    </ScrollRoot>
  )
}
