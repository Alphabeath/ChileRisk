import type { InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type AuthFieldProps = {
  id: string
  label: string
  hint?: string
} & InputHTMLAttributes<HTMLInputElement>

export function AuthField({
  id,
  label,
  hint,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "h-11 w-full border border-border bg-background px-3 text-sm text-foreground outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
