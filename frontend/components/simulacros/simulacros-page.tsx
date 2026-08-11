import { SimulacrosAgenda } from "@/components/simulacros/simulacros-agenda"
import { SimulacrosHero } from "@/components/simulacros/simulacros-hero"
import {
  SimulacrosClosing,
  SimulacrosIntroduction,
  SimulacrosScenarios,
} from "@/components/simulacros/simulacros-overview"
import { ScrollRoot } from "@/components/disasters/scroll-reveal"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"

export function SimulacrosPage() {
  return (
    <ScrollRoot
      className={cn("h-full overflow-y-auto", CITIZEN_NAVBAR_PAD_TOP_CLASS)}
    >
      <SimulacrosHero />
      <SimulacrosIntroduction />
      <SimulacrosAgenda />
      <SimulacrosScenarios />
      <SimulacrosClosing />
    </ScrollRoot>
  )
}
