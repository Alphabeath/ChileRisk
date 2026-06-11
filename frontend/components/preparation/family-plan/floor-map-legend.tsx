import { Info } from "lucide-react"
import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

const LAYERS = [
  { color: "bg-emerald-500/60", label: "Lugar seguro", border: "border-emerald-500/60" },
  { color: "bg-red-500/60", label: "Zona de riesgo", border: "border-red-500/60" },
  { color: "bg-blue-500/60", label: "Ruta de evacuación", border: "border-blue-500/60" },
] as const

export function FloorMapLegend() {
  return (
    <div className={cn(GLASS_PANEL_CLASS, "flex flex-col gap-2 p-3")}>
      <div className="flex items-center gap-2">
        <Info className="size-3 shrink-0 text-white/55" aria-hidden />
        <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-white/75">
          Leyenda
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {LAYERS.map((layer) => (
          <li key={layer.label} className="flex items-center gap-2">
            <span
              className={cn("size-3 shrink-0 border", layer.color, layer.border)}
              aria-hidden
            />
            <span className="text-[10.5px] text-white/70">{layer.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
