import { useUIStore } from "@/stores/ui-store"

export function useQueryDate() {
  const selectedDate = useUIStore((s) => s.selectedDate)
  const setSelectedDate = useUIStore((s) => s.setSelectedDate)
  return { selectedDate, setSelectedDate }
}