import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { EmergencyKitHero } from "@/components/preparation/emergency-kit/emergency-kit-hero"
import { EmergencyKitCategories } from "@/components/preparation/emergency-kit/emergency-kit-categories"
import { EmergencyKitSpecialNeeds } from "@/components/preparation/emergency-kit/emergency-kit-special-needs"
import { EmergencyKitCta } from "@/components/preparation/emergency-kit/emergency-kit-cta"
import {
  DISASTERS_NAV_LINK_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

export default function EmergencyKitPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-16 sm:gap-5 sm:px-6 lg:px-8">
        <EmergencyKitHero />

        <EmergencyKitCategories />

        <EmergencyKitSpecialNeeds />

        <aside
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
              Siguiente paso
            </p>
            <p className="mt-1 max-w-xl text-[12px] text-white/50">
              Marca los items que ya tienes en el paso 7 de tu Plan Familia
              Preparada para llevar control de tu kit.
            </p>
          </div>
          <EmergencyKitCta />
        </aside>

        <aside
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-white/75">
              Referencia oficial
            </p>
            <p className="mt-1 text-[12px] text-white/45">
              Recomendaciones alineadas con SENAPRED y la metodología Familia
              Preparada.
            </p>
          </div>
          <Link
            href="https://www.senapred.cl/recomendaciones/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              DISASTERS_NAV_LINK_CLASS,
              "inline-flex shrink-0 items-center gap-2",
            )}
          >
            Ver en SENAPRED
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </aside>
      </div>
    </div>
  )
}
