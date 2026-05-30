import { create } from "zustand"

interface UIState {
  selectedRegion: number | null
  selectedComuna: number | null
  selectedEventId: number | null
  sidebarOpen: boolean
  mapStyle: "default" | "satellite" | "terrain"
  setSelectedRegion: (region: number | null) => void
  setSelectedComuna: (comuna: number | null) => void
  setSelectedEventId: (eventId: number | null) => void
  toggleSidebar: () => void
  setMapStyle: (style: "default" | "satellite" | "terrain") => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedRegion: null,
  selectedComuna: null,
  selectedEventId: null,
  sidebarOpen: true,
  mapStyle: "default",
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setSelectedComuna: (comuna) => set({ selectedComuna: comuna }),
  setSelectedEventId: (eventId) => set({ selectedEventId: eventId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMapStyle: (style) => set({ mapStyle: style }),
}))
