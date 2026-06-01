export function severityColor(severity: string): string {
  switch (severity) {
    case "bajo":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
    case "moderado":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30"
    case "alto":
      return "bg-orange-500/10 text-orange-400 border border-orange-500/30"
    case "critico":
      return "bg-red-500/10 text-red-400 border border-red-500/30"
    default:
      return "bg-muted text-muted-foreground border border-border"
  }
}

export function formatMagnitude(mag: number): string {
  return `M${mag.toFixed(1)}`
}

export function formatDepth(depth: number): string {
  return `${depth.toFixed(0)} km`
}
