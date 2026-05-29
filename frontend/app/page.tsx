"use client"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { useCallback, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion';
const RotatingEarth = dynamic(
  () => import('@/components/globe/rotating-earth').then((m) => m.RotatingEarth),
  { ssr: false }
)

export default function Home() {

  const [introComplete, setIntroComplete] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-bg-primary">
      <div className="relative flex h-screen flex-col items-center justify-center px-4">
        {/* Globe background — fills entire viewport */}
        <div className="pointer-events-none absolute inset-0">
          <RotatingEarth className="h-full w-full" onIntroComplete={handleIntroComplete} />
        </div>

        {introComplete && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
              className="text-6xl font-extrabold tracking-tighter text-white dark:text-text-primary sm:text-7xl lg:text-8xl"
              style={{ textShadow: 'none' }}
            >
              <span className="text-white" style={{ textShadow: '0 6px 30px rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.6)' }}>Chile</span>
              <span className="text-red-500" style={{ textShadow: '0 6px 30px rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.6)' }}>Risk</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-4 max-w-lg text-lg font-light text-text-primary sm:text-xl"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.9)' }}
            >
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-2 max-w-md text-sm text-text-primary/80"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.9)' }}
            >
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/dashboard"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-accent-green px-10 text-base font-semibold text-bg-primary transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                <Button className="h-full px-6 py-0">Entrar a la plataforma</Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
