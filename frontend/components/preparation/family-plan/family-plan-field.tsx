import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FamilyPlanFieldProps {
  label: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function FamilyPlanField({
  label,
  htmlFor,
  className,
  children,
}: FamilyPlanFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/65">
        {label}
      </Label>
      {children}
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
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-[1.2px] text-white/85">{title}</h3>
        {description ? (
          <p className="mt-1 text-[12.5px] leading-snug text-white/55">{description}</p>
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