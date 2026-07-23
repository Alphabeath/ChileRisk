import type { LucideIcon } from "lucide-react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function FamilyPlanField({
  label,
  htmlFor,
  helper,
  icon: Icon,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  helper?: string
  icon?: LucideIcon
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={htmlFor}
        className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65"
      >
        {Icon ? <Icon className="size-3 shrink-0 opacity-70" aria-hidden /> : null}
        {label}
      </Label>
      {children}
      {helper ? (
        <p className="text-[11px] leading-snug text-white/40">{helper}</p>
      ) : null}
    </div>
  )
}

export function FamilyPlanSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 sm:gap-5">
      <div className="border-b border-white/10 pb-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-[1.2px] text-white/85">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-snug text-white/55">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}