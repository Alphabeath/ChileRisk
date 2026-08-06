"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { ExternalLink } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const RotatingEarth = dynamic(
  () => import("@/components/globe/rotating-earth").then((m) => m.RotatingEarth),
  { ssr: false },
)

const titleShadowClass =
  "[text-shadow:0_2px_16px_rgba(255,255,255,0.9)] dark:[text-shadow:0_6px_30px_rgba(0,0,0,0.85),0_0_12px_rgba(0,0,0,0.6)]"
const bodyShadowClass =
  "[text-shadow:0_1px_10px_rgba(255,255,255,0.95)] dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.8),0_0_4px_rgba(0,0,0,0.9)]"

export default function Home() {
  const router = useRouter()
  const [introComplete, setIntroComplete] = useState(false)
  const handleIntroComplete = useCallback(() => setIntroComplete(true), [])

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-bg-primary">
      <div className="relative flex h-screen flex-col items-center justify-center px-4">
        <div className="pointer-events-none absolute inset-0">
          <RotatingEarth className="h-full w-full" onIntroComplete={handleIntroComplete} />
        </div>

        {introComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
              className="text-6xl font-extrabold tracking-tighter sm:text-7xl lg:text-8xl"
            >
              <span className={cn("text-slate-900 dark:text-white", titleShadowClass)}>
                Chile
              </span>
              <span className={cn("text-red-600 dark:text-red-500", titleShadowClass)}>
                Risk
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className={cn(
                "mt-4 max-w-lg text-lg font-light text-slate-700 sm:text-xl dark:text-white/90",
                bodyShadowClass,
              )}
            >
              Monitoreo multi-amenaza para Chile — alertas, preparación y acción
              ciudadana.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Button
                size="lg"
                className="h-14 px-10 text-base font-semibold normal-case tracking-normal bg-[var(--primary-chile)] text-white shadow-lg shadow-black/40 transition-all hover:scale-[1.03] hover:bg-[var(--primary-chile)]/90 active:scale-[0.97] focus-visible:ring-white/40"
                onClick={() => router.push("/iniciar-sesion")}
              >
                Entrar a la plataforma
              </Button>
            </motion.div>
          </motion.div>
        ) : null}

        {introComplete ? (
          <motion.footer
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center bg-gradient-to-t from-white/85 via-white/45 to-transparent px-4 pb-6 pt-10 sm:pb-8 dark:from-black/72 dark:via-black/35"
          >
            <p
              className={cn(
                "max-w-md text-center text-[12px] leading-relaxed text-slate-600 sm:text-[13px] dark:text-white/55",
                bodyShadowClass,
              )}
            >
              Inspirado en{" "}
              <a
                href="https://truerisk.cloud/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-slate-800 underline decoration-slate-400/50 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-600 dark:text-white/80 dark:decoration-white/25 dark:hover:text-white dark:hover:decoration-white/60"
              >
                TrueRisk
                <ExternalLink className="size-3" aria-hidden />
              </a>{" "}
              — inteligencia multi-amenaza para España. ChileRisk adapta esa
              visión al contexto oficial chileno.
            </p>
          </motion.footer>
        ) : null}
      </div>
    </div>
  )
}
