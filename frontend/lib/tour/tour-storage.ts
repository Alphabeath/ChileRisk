const TOUR_SEEN_KEY = "chilerisk-tour-seen:v1"

export function hasSeenTour(): boolean {
  if (typeof window === "undefined") return true
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === "1"
  } catch {
    return true
  }
}

export function markTourSeen(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, "1")
  } catch {
    // ignore quota / private mode
  }
}

export { TOUR_SEEN_KEY }
