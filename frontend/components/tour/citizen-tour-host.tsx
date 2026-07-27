"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import "driver.js/dist/driver.css"

import { TOUR_START_EVENT } from "@/lib/tour/tour-steps"
import { hasSeenTour } from "@/lib/tour/tour-storage"
import { startCitizenTour, stopCitizenTour } from "@/lib/tour/run-tour"

/**
 * Mounts once in the citizen layout. Auto-starts the tour on `/dashboard`
 * the first time; listens for `chilerisk:start-tour` to replay.
 */
export function CitizenTourHost() {
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const autoStartedRef = useRef(false)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const navigate = (path: string) => {
      router.push(path)
    }
    const getPathname = () => pathnameRef.current

    const onStart = () => {
      void startCitizenTour({ navigate, getPathname })
    }

    window.addEventListener(TOUR_START_EVENT, onStart)
    return () => {
      window.removeEventListener(TOUR_START_EVENT, onStart)
      stopCitizenTour()
    }
  }, [router])

  useEffect(() => {
    if (autoStartedRef.current) return
    if (pathname !== "/dashboard") return
    if (hasSeenTour()) return

    autoStartedRef.current = true
    const id = window.setTimeout(() => {
      void startCitizenTour({
        navigate: (path) => router.push(path),
        getPathname: () => pathnameRef.current,
      })
    }, 600)

    return () => window.clearTimeout(id)
  }, [pathname, router])

  return null
}
