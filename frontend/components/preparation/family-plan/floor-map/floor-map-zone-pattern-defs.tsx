import {
  ZONE_VISUALS,
  zonePatternId,
  type ZoneVisualType,
} from "@/lib/floor-map-zone-styles"

export function FloorMapZonePatternDefs({ suffix = "" }: { suffix?: string }) {
  return (
    <defs>
      {(Object.keys(ZONE_VISUALS) as ZoneVisualType[]).map((type) => {
        const visual = ZONE_VISUALS[type]
        const id = zonePatternId(type, suffix)
        return (
          <pattern
            key={id}
            id={id}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke={visual.stroke}
              strokeWidth="2"
              strokeOpacity="0.85"
            />
          </pattern>
        )
      })}
    </defs>
  )
}