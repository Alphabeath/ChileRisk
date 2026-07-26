"use client"

import { Check, Copy, KeyRound, Sparkles } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DEMO_LOGIN } from "@/lib/demo-login"
import { cn } from "@/lib/utils"

interface DemoLoginCardProps {
  onUseAccount: () => void | Promise<void>
  busy?: boolean
}

function CredentialRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard may be blocked */
    }
  }

  return (
    <div className="flex items-center gap-2 border border-white/10 bg-black/35 px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[8px] font-semibold uppercase tracking-[1.3px] text-white/40">
          {label}
        </p>
        <p className="mt-0.5 truncate font-mono text-[12px] tabular-nums text-white/90">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center border transition-colors",
          copied
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
            : "border-white/15 bg-white/[0.04] text-white/55 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/85",
        )}
        aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
      >
        {copied ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
      </button>
    </div>
  )
}

/** Hackathon judge shortcut — matches ChileRisk glass / mono chrome. */
export function DemoLoginCard({ onUseAccount, busy = false }: DemoLoginCardProps) {
  return (
    <aside
      className="relative overflow-hidden border border-white/12 bg-gradient-to-br from-[var(--primary-chile)]/25 via-black/40 to-[var(--secondary-chile)]/20"
      aria-label="Cuenta de prueba para el hackathon"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-y-0 left-0 w-[3px] bg-[var(--secondary-chile)]"
        aria-hidden
      />

      <div className="relative space-y-3 p-3.5 pl-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[1.3px] text-white/55">
              <Sparkles className="size-3 text-[var(--secondary-chile)]" aria-hidden />
              Acceso jurado
            </p>
            <p className="mt-1 text-[13px] font-medium leading-snug text-white/90">
              Cuenta de prueba lista para la demo
            </p>
          </div>
          <span className="shrink-0 border border-white/15 bg-white/[0.06] px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[1.2px] text-white/70">
            Hackathon
          </span>
        </div>

        <div className="grid gap-1.5">
          <CredentialRow label="Email" value={DEMO_LOGIN.email} />
          <CredentialRow label="Contraseña" value={DEMO_LOGIN.password} />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void onUseAccount()}
          className="w-full border-white/20 bg-white/[0.08] text-white hover:border-white/30 hover:bg-white/[0.14] hover:text-white"
        >
          <KeyRound className="size-3.5" aria-hidden />
          {busy ? "Ingresando…" : "Entrar con cuenta demo"}
        </Button>
      </div>
    </aside>
  )
}
