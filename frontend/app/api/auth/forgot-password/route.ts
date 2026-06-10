import { NextResponse } from "next/server"

import { getBackendInternalUrl } from "@/lib/backend-url"

export async function POST(req: Request) {
  const body = await req.json()
  const res = await fetch(`${getBackendInternalUrl()}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const text = await res.text()
  return new NextResponse(text || null, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  })
}