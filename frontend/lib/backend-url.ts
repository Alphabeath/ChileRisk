/** Internal backend base URL (server-side only — Docker or local). */
export function getBackendInternalUrl(): string {
  return (
    process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
    "http://localhost:8000"
  )
}
