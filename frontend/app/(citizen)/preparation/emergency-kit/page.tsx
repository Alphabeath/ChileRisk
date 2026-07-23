import { ExternalLink, Users } from "lucide-react"
import Link from "next/link"

import { EmergencyKitHero } from "@/components/preparation/emergency-kit/emergency-kit-hero"
import { EmergencyKitCategories } from "@/components/preparation/emergency-kit/emergency-kit-categories"
import { EmergencyKitSpecialNeeds } from "@/components/preparation/emergency-kit/emergency-kit-special-needs"
import { EmergencyKitCta } from "@/components/preparation/emergency-kit/emergency-kit-cta"
import { PreparationBreadcrumb } from "@/components/preparation/preparation-breadcrumb"
import { PreparationContextBanner } from "@/components/preparation/preparation-context-banner"
import {
  DISASTERS_NAV_LINK_CLASS,
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import {
  PREPARATION_CTA_LIFT_CLASS,
  PREPARATION_EYEBROW_CLASS,
  PREPARATION_PAGE_INNER_CLASS,
  PREPARATION_PAGE_SHELL_CLASS,
  PREPARATION_STICKY_SUBNAV_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export default function EmergencyKitPage() {
  return (
    <div className={PREPARATION_PAGE_SHELL_CLASS}>
      <div className={cn(PREPARATION_PAGE_INNER_CLASS, "pb-28 sm:pb-24")}>
        <PreparationBreadcrumb
          items={[
            { label: "Preparación", href: "/preparation" },
            { label: "Kit de emergencia" },
          ]}
        />

        <EmergencyKitHero />

        <EmergencyKitCategories />

        <EmergencyKitSpecialNeeds />

        <PreparationContextBanner
          eyebrow="Registra en tu plan"
          body="Marca en el paso 7 lo que ya tienes en casa. Esta guía no guarda el checklist."
          href="/preparation/family-plan/step/7?from=emergency-kit"
          cta="Ir al checklist"
          icon={Users}
          accent="emerald"
          className="hidden sm:flex"
        />

        <aside
          className={cn(
            GLASS_PANEL_CLASS,
            GLASS_MICA_INTERACTIVE_CLASS,
            "flex flex-col gap-4 border-l-[3px] border-l-white/25 p-5 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/75")}>
              Referencia oficial
            </p>
            <p className="mt-1 text-[12.5px] text-white/45">
              Recomendaciones alineadas con SENAPRED y Familia Preparada.
            </p>
          </div>
          <Link
            href="https://www.senapred.cl/recomendaciones/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              DISASTERS_NAV_LINK_CLASS,
              PREPARATION_CTA_LIFT_CLASS,
              "inline-flex shrink-0 items-center gap-2",
            )}
          >
            Ver en SENAPRED
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </aside>
      </div>

      <div
        className={cn(
          PREPARATION_STICKY_SUBNAV_CLASS,
          "fixed inset-x-0 bottom-0 top-auto z-20 border-t border-white/10 bg-black/90 p-3 backdrop-blur-xl sm:hidden",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        )}
      >
        <EmergencyKitCta className="w-full" />
      </div>
    </div>
  )
}
