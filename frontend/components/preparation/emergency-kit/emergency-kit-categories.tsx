import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import {
  KIT_CATEGORIES,
  type KitCategoryMeta,
} from "@/components/preparation/emergency-kit/emergency-kit-content"
import { KIT_ITEMS_BASE } from "@/lib/family-plan-defaults"
import { cn } from "@/lib/utils"

const ITEMS_BY_CATEGORY: Record<KitCategoryMeta["id"], readonly string[]> = {
  water: ["Agua (2 L/persona/día)"],
  food: ["Barras energéticas", "Conservas", "Alimentos deshidratados", "Tetrapack"],
  gear: [
    "Linterna",
    "Radio portátil",
    "Pilas",
    "Dinero efectivo",
    "Abrelatas",
  ],
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
  // Sanity check during build: every base kit item must be categorized
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
          className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/90"
        >
          Composición del kit
        </h2>
        <p className="text-[12px] text-white/50">
          Seis categorías que cubren las necesidades mínimas de un hogar durante
          72 horas. Ajusta cantidades según tu familia.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KIT_CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </ul>
    </section>
  )
}

function CategoryCard({ category }: { category: KitCategoryMeta }) {
  const Icon = category.icon
  const items = ITEMS_BY_CATEGORY[category.id]
  return (
    <li>
      <article
        className={cn(
          GLASS_PANEL_CLASS,
          "flex h-full flex-col overflow-hidden",
        )}
      >
        <header className="flex items-start gap-3 border-b border-white/10 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center border border-white/20 bg-black/40">
            <Icon className={cn("size-5", category.accent)} aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/95">
              {category.title}
            </h3>
            <p className="mt-0.5 text-[12px] leading-snug text-white/55">
              {category.summary}
            </p>
          </div>
        </header>
        <ul className="flex flex-1 flex-col gap-1.5 p-4">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-[12px] leading-snug text-white/75"
            >
              <span
                className="mt-1.5 size-1 shrink-0 rounded-full bg-white/35"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </article>
    </li>
  )
}
