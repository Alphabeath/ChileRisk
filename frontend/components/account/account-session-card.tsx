"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  GLASS_MICA_INTERACTIVE_CLASS,
  GLASS_PANEL_CLASS,
} from "@/lib/glass-panel"
import { PREPARATION_EYEBROW_CLASS } from "@/lib/preparation-ui"
import { cn } from "@/lib/utils"

export function AccountSessionCard({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        GLASS_PANEL_CLASS,
        GLASS_MICA_INTERACTIVE_CLASS,
        "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
        className,
      )}
    >
      <div className="min-w-0">
        <p className={cn(PREPARATION_EYEBROW_CLASS, "text-white/45")}>Sesión</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-white/90">
          Cerrar sesión
        </h2>
        <p className="mt-1 text-[12.5px] leading-snug text-white/50">
          Saldrás de ChileRisk en este dispositivo. Tu comuna de hogar queda
          guardada en la cuenta.
        </p>
      </div>
      <Button
        type="button"
        variant="destructive"
        className="w-full shrink-0 sm:w-auto"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="size-3.5" aria-hidden />
        Cerrar sesión
      </Button>
    </section>
  )
}
