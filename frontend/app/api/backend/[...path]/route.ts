import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import {
  createBackendApiToken,
  createGuestBackendApiToken,
} from "@/lib/api-token"
import { getBackendInternalUrl } from "@/lib/backend-url"

/**
 * Same-origin proxy → FastAPI. Always attaches a Bearer JWT.
 * Signed-in Auth.js session → `sub` = user id; otherwise guest.
 */
async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const targetPath = `/${pathSegments.join("/")}`
  const url = new URL(targetPath, getBackendInternalUrl())
  url.search = req.nextUrl.search

  const session = await auth()
  const token = session?.user?.id
    ? await createBackendApiToken({
        sub: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })
    : await createGuestBackendApiToken()

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
  const responseContentType =
    backendRes.headers.get("Content-Type") ?? "application/json"

  if (
    responseContentType.includes("text/event-stream") &&
    backendRes.body
  ) {
    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  }

  const body = await backendRes.arrayBuffer()

  return new NextResponse(body, {
    status: backendRes.status,
    headers: {
      "Content-Type": responseContentType,
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

export async function PUT(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(req, path)
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(req, path)
}
