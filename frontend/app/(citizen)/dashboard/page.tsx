"use client"

import { DashboardAlertsCard } from "@/components/dashboard/dashboard-alerts-card"
import { DashboardComunaCard } from "@/components/dashboard/dashboard-comuna-card"
import { DashboardEventsCard } from "@/components/dashboard/dashboard-events-card"
import { DashboardFamilyPlanCard } from "@/components/dashboard/dashboard-family-plan-card"
import { DashboardPageHero } from "@/components/dashboard/dashboard-page-hero"
import { DashboardSummaryPanel } from "@/components/dashboard/dashboard-summary-panel"
import { FamilyPlanProvider } from "@/hooks"
import {
  PREPARATION_PAGE_INNER_CLASS,
  PREPARATION_PAGE_SHELL_CLASS,
} from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  return (
    <div className={PREPARATION_PAGE_SHELL_CLASS}>
      <FamilyPlanProvider>
        <div className={cn(PREPARATION_PAGE_INNER_CLASS, "gap-4 sm:gap-5")}>
          <DashboardPageHero />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-5">
            <DashboardComunaCard className="order-1 lg:col-span-8" />

            <aside
              className={cn(
                "order-3 flex flex-col gap-4",
                "max-lg:contents",
                "lg:order-2 lg:col-span-4 lg:row-span-4 lg:sticky lg:top-24",
              )}
            >
              <DashboardFamilyPlanCard className="max-lg:order-3" />
              <DashboardEventsCard className="max-lg:order-4" />
            </aside>

            <DashboardSummaryPanel className="order-2 lg:col-span-8" />
            <DashboardAlertsCard className="order-5 lg:col-span-8" />
          </div>
        </div>
      </FamilyPlanProvider>
    </div>
  )
}
