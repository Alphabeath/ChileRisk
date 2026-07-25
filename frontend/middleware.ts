import { NextResponse } from "next/server"

import { auth } from "@/auth"

const protectedPrefixes = [
  "/monitor",
  "/dashboard",
  "/preparation",
  "/evacuation",
  "/disasters",
  "/account",
  "/assistant",
  "/drills",
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/monitor/:path*",
    "/dashboard/:path*",
    "/preparation/:path*",
    "/evacuation/:path*",
    "/disasters/:path*",
    "/account/:path*",
    "/assistant/:path*",
    "/drills/:path*",
  ],
}