import { create } from "zustand"

const RELEASE_MS = 500

/** Named sources — extend when adding features that affect global loading. */
export const LOADING_SOURCE = {
  REACT_QUERY: "react-query",
  MAP_DATA: "map-data",
} as const

export type LoadingSource = (typeof LOADING_SOURCE)[keyof typeof LOADING_SOURCE]

interface LoadingState {
  /** Refcount per source (e.g. parallel map fetches). */
  sources: Partial<Record<LoadingSource, number>>
  /** /map: one session until first regions+comunas hydrate. */
  mapInitialPending: boolean
  /** Debounced signal for the top bar (nprogress). */
  visible: boolean
  track: (source: LoadingSource) => void
  untrack: (source: LoadingSource) => void
  setSourceActive: (source: LoadingSource, active: boolean) => void
  setMapInitialPending: (pending: boolean) => void
}

let releaseTimer: ReturnType<typeof setTimeout> | null = null

function isRawActive(state: Pick<LoadingState, "sources" | "mapInitialPending">): boolean {
  if (state.mapInitialPending) return true
  return Object.values(state.sources).some((n) => (n ?? 0) > 0)
}

function scheduleVisible(set: (partial: Partial<LoadingState>) => void, visible: boolean) {
  if (releaseTimer) {
    clearTimeout(releaseTimer)
    releaseTimer = null
  }
  if (visible) {
    set({ visible: true })
    return
  }
  releaseTimer = setTimeout(() => {
    releaseTimer = null
    set({ visible: false })
  }, RELEASE_MS)
}

function recompute(
  get: () => LoadingState,
  set: (partial: Partial<LoadingState>) => void
) {
  scheduleVisible(set, isRawActive(get()))
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  sources: {},
  mapInitialPending: false,
  visible: false,

  track: (source) => {
    set((state) => ({
      sources: {
        ...state.sources,
        [source]: (state.sources[source] ?? 0) + 1,
      },
    }))
    recompute(get, set)
  },

  untrack: (source) => {
    set((state) => {
      const next = Math.max(0, (state.sources[source] ?? 0) - 1)
      const sources = { ...state.sources }
      if (next === 0) delete sources[source]
      else sources[source] = next
      return { sources }
    })
    recompute(get, set)
  },

  setSourceActive: (source, active) => {
    set((state) => {
      const sources = { ...state.sources }
      if (active) sources[source] = 1
      else delete sources[source]
      return { sources }
    })
    recompute(get, set)
  },

  setMapInitialPending: (pending) => {
    set({ mapInitialPending: pending })
    recompute(get, set)
  },
}))

export function useGlobalLoadingVisible(): boolean {
  return useLoadingStore((s) => s.visible)
}