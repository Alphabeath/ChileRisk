import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { AlertFilter } from "@/lib/alert-types"
import { clampQueryDate, todayIsoDate } from "@/lib/query-date"

type UIPersistedState = {
  selectedDate: string
  alertsExpanded: boolean
  dateExpanded: boolean
  alertsFilter: AlertFilter
}

type UIState = UIPersistedState & {
  setSelectedDate: (iso: string) => void
  setAlertsExpanded: (expanded: boolean) => void
  setDateExpanded: (expanded: boolean) => void
  setAlertsFilter: (filter: AlertFilter) => void
}

const STORAGE_KEY = "chilerisk-ui-v1"

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedDate: todayIsoDate(),
      alertsExpanded: false,
      dateExpanded: false,
      alertsFilter: "all",
      setSelectedDate: (iso) => set({ selectedDate: clampQueryDate(iso) }),
      setAlertsExpanded: (expanded) => set({ alertsExpanded: expanded }),
      setDateExpanded: (expanded) => set({ dateExpanded: expanded }),
      setAlertsFilter: (filter) => set({ alertsFilter: filter }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      partialize: (state): UIPersistedState => ({
        selectedDate: state.selectedDate,
        alertsExpanded: state.alertsExpanded,
        dateExpanded: state.dateExpanded,
        alertsFilter: state.alertsFilter,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UIPersistedState>
        return {
          ...current,
          ...p,
          selectedDate: clampQueryDate(p.selectedDate ?? current.selectedDate),
          alertsExpanded: p.alertsExpanded ?? current.alertsExpanded,
          dateExpanded: p.dateExpanded ?? current.dateExpanded,
          alertsFilter: p.alertsFilter ?? current.alertsFilter,
        }
      },
    },
  ),
)
