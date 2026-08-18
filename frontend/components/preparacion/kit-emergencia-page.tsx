import { ScrollRoot } from "@/components/disasters/scroll-reveal"
import { KitEmergenciaFooter } from "@/components/preparacion/kit-emergencia-footer"
import { KitEmergenciaHero } from "@/components/preparacion/kit-emergencia-hero"
import {
  KitEmergenciaBasic,
  KitEmergenciaCar,
  KitEmergenciaExtra,
  KitEmergenciaIntroduction,
} from "@/components/preparacion/kit-emergencia-overview"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"

export function KitEmergenciaPage() {
  return (
    <ScrollRoot
      className={cn("h-full overflow-y-auto", CITIZEN_NAVBAR_PAD_TOP_CLASS)}
    >
      <KitEmergenciaHero />
      <KitEmergenciaIntroduction />
      <KitEmergenciaBasic />
      <KitEmergenciaExtra />
      <KitEmergenciaCar />
      <KitEmergenciaFooter />
    </ScrollRoot>
  )
}
