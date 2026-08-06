export type EvacuationUserLocationState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ready"; lng: number; lat: number }
  | {
      status: "unavailable"
      reason: "denied" | "dismissed" | "error" | "unsupported" | "out-of-bounds"
    }

/** Before the user requests GPS — not an in-flight locate. */
export const INITIAL_EVACUATION_USER_LOCATION_STATE: EvacuationUserLocationState =
  {
    status: "idle",
  }
