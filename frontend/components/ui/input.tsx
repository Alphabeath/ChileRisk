import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 outline-none transition-colors placeholder:text-white/40 hover:border-white/20 focus-visible:border-white/30 focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/25 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30 dark:aria-invalid:border-destructive/60",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
