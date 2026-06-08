/** Re-decode UTF-8 strings that were misread as Latin-1 (e.g. AraucanÃ­a → Araucanía). */
export function fixMojibake(value: unknown): string {
  if (value == null) return "—"
  if (typeof value !== "string") return String(value)

  if (!/[ÃÂ][\u0080-\u00BF]/.test(value)) return value

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff)
    return new TextDecoder("utf-8").decode(bytes)
  } catch {
    return value
  }
}

export function fixMojibakeRecord(
  record: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!record) return {}

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      typeof value === "string" ? fixMojibake(value) : String(value ?? ""),
    ]),
  )
}