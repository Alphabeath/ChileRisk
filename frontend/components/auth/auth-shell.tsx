import Link from "next/link"
import type { ReactNode } from "react"

import { GLASS_PANEL_CLASS } from "@/lib/glass-panel"
import { cn } from "@/lib/utils"

interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-3xl font-extrabold tracking-tighter text-foreground"
        >
          Chile<span className="text-red-500">Risk</span>
        </Link>
      </div>

      <div className={cn(GLASS_PANEL_CLASS, "w-full max-w-md p-8")}>
        <div className="mb-6 space-y-2">
          <h1 className="text-xl font-semibold tracking-wide text-white/90 uppercase">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-relaxed text-white/55">{description}</p>
          ) : null}
        </div>
        {children}
      </div>

      {footer ? <div className="mt-6 text-sm text-white/45">{footer}</div> : null}
    </div>
  )
}