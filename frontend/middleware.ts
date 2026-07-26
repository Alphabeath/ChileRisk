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

const authPages = ["/login", "/register"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = Boolean(req.auth)

  if (authPages.some((p) => pathname === p) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/login",
    "/register",
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
