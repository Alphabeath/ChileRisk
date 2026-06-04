import { create } from "zustand"
import { clampQueryDate, todayIsoDate } from "@/lib/query-date"

interface UIState {
  selectedRegion: number | null
  selectedComuna: number | null
  selectedEventId: number | null
  sidebarOpen: boolean
  mapStyle: "default" | "satellite" | "terrain"
  selectedDate: string
  setSelectedRegion: (region: number | null) => void
  setSelectedComuna: (comuna: number | null) => void
  setSelectedEventId: (eventId: number | null) => void
  toggleSidebar: () => void
  setMapStyle: (style: "default" | "satellite" | "terrain") => void
  setSelectedDate: (date: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedRegion: null,
  selectedComuna: null,
  selectedEventId: null,
  sidebarOpen: true,
  mapStyle: "default",
  selectedDate: todayIsoDate(),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setSelectedComuna: (comuna) => set({ selectedComuna: comuna }),
  setSelectedEventId: (eventId) => set({ selectedEventId: eventId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMapStyle: (style) => set({ mapStyle: style }),
  setSelectedDate: (date) => set({ selectedDate: clampQueryDate(date) }),
}))