import { ScrollRoot } from "@/components/disasters/scroll-reveal"
import { InicioAccountInvite } from "@/components/inicio/inicio-account-invite"
import { InicioDirectory } from "@/components/inicio/inicio-directory"
import { InicioHeader } from "@/components/inicio/inicio-header"
import { InicioNationalPulse } from "@/components/inicio/inicio-national-pulse"
import { CITIZEN_NAVBAR_PAD_TOP_CLASS } from "@/lib/citizen-layout"
import { cn } from "@/lib/utils"

export function InicioPage({ authenticated }: { authenticated: boolean }) {
  return (
    <ScrollRoot
      className={cn("h-full overflow-y-auto", CITIZEN_NAVBAR_PAD_TOP_CLASS)}
    >
      <InicioHeader />
      <InicioNationalPulse />
      <InicioDirectory />
      <InicioAccountInvite authenticated={authenticated} />
    </ScrollRoot>
  )
}
