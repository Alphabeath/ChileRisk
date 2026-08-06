/**
 * Re-exports monitor alert/air types from the canonical `lib/types.ts`.
 * Prefer importing from `@/lib/types` in new code.
 */
export type {
  ActiveAlert,
  AffectedScope,
  AirQualityLevel,
  AirQualityZone,
  AlertFilter,
  AlertSource,
  RecordKind,
  UnifiedAlertLevel,
} from "@/lib/types"
