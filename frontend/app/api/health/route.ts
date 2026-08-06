import { NextResponse } from "next/server"

/** Docker / Dokploy health probe — keep cheap and unauthenticated. */
export async function GET() {
  return NextResponse.json({ ok: true })
}
