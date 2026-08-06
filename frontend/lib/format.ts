export function formatMagnitude(mag: number): string {
  return `M${mag.toFixed(1)}`
}

export function formatDepth(depth: number): string {
  return `${depth.toFixed(0)} km`
}
