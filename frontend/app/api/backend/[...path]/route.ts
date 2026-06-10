import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { createBackendApiToken } from "@/lib/api-token"
import { getBackendInternalUrl } from "@/lib/backend-url"

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  const targetPath = `/${pathSegments.join("/")}`
  const url = new URL(targetPath, getBackendInternalUrl())
  url.search = req.nextUrl.search

  const token = await createBackendApiToken({
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name,
  })

  const headers = new Headers()
  const contentType = req.headers.get("content-type")
  if (contentType) {
    headers.set("Content-Type", contentType)
  }
  headers.set("Authorization", `Bearer ${token}`)

  const init: RequestInit = {
    method: req.method,
    headers,
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text()
  }

  const backendRes = await fetch(url, init)
  const body = await backendRes.arrayBuffer()

  return new NextResponse(body, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("Content-Type") ?? "application/json",
    },
  })
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(req, path)
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(req, path)
}