import { create } from "zustand"
import { clampQueryDate, todayIsoDate } from "@/lib/query-date"

export interface PanelPosition {
  x: number
  y: number
}

interface UIState {
  selectedRegion: number | null
  selectedComuna: number | null
  selectedEventId: number | null
  sidebarOpen: boolean
  mapStyle: "default" | "satellite" | "terrain"
  selectedDate: string
  /** Draggable panel positions (persist to localStorage later). */
  panelPositions: Record<string, PanelPosition>
  /** Bumped when all panel positions reset (corner panels remeasure). */
  panelLayoutVersion: number
  /** Bumped to force map layers + query refetch from toolbar. */
  mapDataRefreshNonce: number
  /** Disaster detail phase nav is sticky (hides main citizen navbar). */
  disasterPhaseNavPinned: boolean
  /** Map color mode — controls fill of regions/comunas. Session-only. */
  mapColorMode: "risk" | "alerts" | "air"
  setSelectedRegion: (region: number | null) => void
  setSelectedComuna: (comuna: number | null) => void
  setSelectedEventId: (eventId: number | null) => void
  toggleSidebar: () => void
  setMapStyle: (style: "default" | "satellite" | "terrain") => void
  setSelectedDate: (date: string) => void
  setPanelPosition: (panelId: string, position: PanelPosition) => void
  resetPanelPosition: (panelId: string) => void
  resetAllPanelPositions: () => void
  requestMapDataRefresh: () => void
  setDisasterPhaseNavPinned: (pinned: boolean) => void
  setMapColorMode: (mode: "risk" | "alerts" | "air") => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedRegion: null,
  selectedComuna: null,
  selectedEventId: null,
  sidebarOpen: true,
  mapStyle: "default",
  selectedDate: todayIsoDate(),
  panelPositions: {},
  panelLayoutVersion: 0,
  mapDataRefreshNonce: 0,
  disasterPhaseNavPinned: false,
  mapColorMode: "alerts",
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setSelectedComuna: (comuna) => set({ selectedComuna: comuna }),
  setSelectedEventId: (eventId) => set({ selectedEventId: eventId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMapStyle: (style) => set({ mapStyle: style }),
  setSelectedDate: (date) => set({ selectedDate: clampQueryDate(date) }),
  setPanelPosition: (panelId, position) =>
    set((state) => ({
      panelPositions: { ...state.panelPositions, [panelId]: position },
    })),
  resetPanelPosition: (panelId) =>
    set((state) => {
      const rest = { ...state.panelPositions }
      delete rest[panelId]
      return { panelPositions: rest }
    }),
  resetAllPanelPositions: () =>
    set((state) => ({
      panelPositions: {},
      panelLayoutVersion: state.panelLayoutVersion + 1,
    })),
  requestMapDataRefresh: () =>
    set((state) => ({ mapDataRefreshNonce: state.mapDataRefreshNonce + 1 })),
  setDisasterPhaseNavPinned: (pinned) => set({ disasterPhaseNavPinned: pinned }),
  setMapColorMode: (mode) => set({ mapColorMode: mode }),
}))