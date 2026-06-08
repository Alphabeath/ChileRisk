declare module "@mapbox/geojson-rewind" {
  import type { GeoJSON } from "geojson"

  function rewind(geojson: GeoJSON, outer?: boolean): GeoJSON
  export default rewind
}