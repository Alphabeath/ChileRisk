export type EvacuationUserLocationState =
  | { status: "pending" }
  | { status: "ready"; lng: number; lat: number }
  | {
      status: "unavailable"
      reason: "denied" | "dismissed" | "error" | "unsupported" | "out-of-bounds"
    }

export const INITIAL_EVACUATION_USER_LOCATION_STATE: EvacuationUserLocationState = {
  status: "pending",
}