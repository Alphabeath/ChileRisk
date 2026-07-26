"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"
import { ExternalLink } from "lucide-react"
import { motion } from "motion/react"

const RotatingEarth = dynamic(
  () => import("@/components/globe/rotating-earth").then((m) => m.RotatingEarth),
  { ssr: false },
)

const TITLE_SHADOW =
  "0 6px 30px rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.6)"
const BODY_SHADOW = "0 2px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.9)"

export default function Home() {
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
              <span className="text-white" style={{ textShadow: TITLE_SHADOW }}>
                Chile
              </span>
              <span className="text-red-500" style={{ textShadow: TITLE_SHADOW }}>
                Risk
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-4 max-w-lg text-lg font-light text-white/90 sm:text-xl"
              style={{ textShadow: BODY_SHADOW }}
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
              <Link
                href="/login"
                className="group inline-flex h-14 items-center justify-center gap-2 bg-[var(--primary-chile)] px-10 text-base font-semibold text-white shadow-lg shadow-black/40 transition-all hover:scale-[1.03] hover:bg-[var(--primary-chile)]/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Entrar a la plataforma
              </Link>
            </motion.div>
          </motion.div>
        ) : null}

        {introComplete ? (
          <motion.footer
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-4 pb-6 pt-10 sm:pb-8"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
            }}
          >
            <a
              href="https://cubepath.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[1.4px] text-white/50">
                Alojado en
              </span>
              <Image
                src="/cubepath.png"
                alt="CubePath"
                width={400}
                height={200}
                className="h-11 w-auto object-contain opacity-95 transition-opacity group-hover:opacity-100 sm:h-12"
                priority
              />
            </a>

            <p
              className="max-w-md text-center text-[12px] leading-relaxed text-white/55 sm:text-[13px]"
              style={{ textShadow: BODY_SHADOW }}
            >
              Inspirado en{" "}
              <a
                href="https://truerisk.cloud/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-white/80 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white hover:decoration-white/60"
              >
                TrueRisk
                <ExternalLink className="size-3" aria-hidden />
              </a>
              {" "}
              — inteligencia multi-amenaza para España. ChileRisk adapta esa
              visión al contexto oficial chileno.
            </p>
          </motion.footer>
        ) : null}
      </div>
    </div>
  )
}
