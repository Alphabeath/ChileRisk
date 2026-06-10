import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55",
        className,
      )}
      {...props}
    />
  )
}

export { Label }