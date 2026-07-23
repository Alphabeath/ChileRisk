import { FamilyPlanProvider } from "@/hooks/use-family-plan"
import {
  PREPARATION_PAGE_SHELL_CLASS,
  PREPARATION_WIZARD_INNER_CLASS,
} from "@/lib/preparation-ui"

export default function FamilyPlanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FamilyPlanProvider>
      <div className={PREPARATION_PAGE_SHELL_CLASS}>
        <div className={PREPARATION_WIZARD_INNER_CLASS}>{children}</div>
      </div>
    </FamilyPlanProvider>
  )
}
