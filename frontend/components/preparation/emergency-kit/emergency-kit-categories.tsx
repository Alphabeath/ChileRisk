import {
  FamilyPlanCategoryShell,
  FamilyPlanStatusChip,
} from "@/components/preparation/family-plan/family-plan-layout"
import {
  KIT_CATEGORIES,
  type KitCategoryMeta,
} from "@/components/preparation/emergency-kit/emergency-kit-content"
import { KIT_ITEMS_BASE } from "@/lib/family-plan-defaults"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

const ITEMS_BY_CATEGORY: Record<KitCategoryMeta["id"], readonly string[]> = {
  water: ["Agua (2 L/persona/día)"],
  food: ["Barras energéticas", "Conservas", "Alimentos deshidratados", "Tetrapack"],
  gear: ["Linterna", "Radio portátil", "Pilas", "Dinero efectivo", "Abrelatas"],
  hygiene: [
    "Alcohol gel",
    "Papel higiénico",
    "Toallas absorbentes",
    "Bolsas de basura",
    "Mascarillas",
  ],
  documents: [
    "Identificaciones",
    "Escrituras",
    "Contratos",
    "Certificados",
    "Copia del plan",
    "Llaves de la vivienda",
  ],
  health: ["Medicamentos", "Botiquín", "Recetas médicas"],
}

function ensureAllBaseItemsPresent(): void {
  const categorized = Object.values(ITEMS_BY_CATEGORY).flat()
  const missing = KIT_ITEMS_BASE.filter((item) => !categorized.includes(item))
  if (missing.length > 0) {
    console.warn(
      "[emergency-kit] items sin categoría asignada:",
      missing.join(", "),
    )
  }
}

export function EmergencyKitCategories() {
  ensureAllBaseItemsPresent()

  return (
    <section aria-labelledby="emergency-kit-categories-heading">
      <div className="mb-3 flex flex-col gap-1">
        <h2
          id="emergency-kit-categories-heading"
          className={cn(PREPARATION_EYEBROW_CLASS, "text-white/90")}
        >
          Composición del kit
        </h2>
        <p className="text-[12px] text-white/50">
          Seis categorías con lo mínimo para 72 horas. Ajusta cantidades según
          tu familia.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KIT_CATEGORIES.map((category) => (
          <li key={category.id}>
            <CategoryCard category={category} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CategoryCard({ category }: { category: KitCategoryMeta }) {
  const Icon = category.icon
  const items = ITEMS_BY_CATEGORY[category.id]

  return (
    <FamilyPlanCategoryShell
      accentClassName={category.borderAccent}
      className="h-full"
      header={
        <div className="flex w-full items-start gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center border",
              category.iconChip,
            )}
          >
            <Icon className={cn("size-4", category.accent)} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/95">
                {category.title}
              </h3>
              <FamilyPlanStatusChip tone="empty">
                {items.length} {items.length === 1 ? "ítem" : "ítems"}
              </FamilyPlanStatusChip>
            </div>
            <p className="mt-0.5 text-[12px] leading-snug text-white/55">
              {category.summary}
            </p>
          </div>
        </div>
      }
    >
      {items.map((item) => (
        <div
          key={item}
          className="flex min-h-10 items-center gap-2.5 border border-transparent px-2 py-1.5 text-[12.5px] leading-snug text-white/80 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-white/40" aria-hidden />
          {item}
        </div>
      ))}
    </FamilyPlanCategoryShell>
  )
}
