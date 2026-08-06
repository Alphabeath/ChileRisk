"use client"

import { useUIStore } from "@/stores/ui-store"

/** Query-day selection for map / listados — backed by `useUIStore`. */
export function useQueryDate() {
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)
  return { selectedDate, setSelectedDate }
}
