import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { Providers } from "@/app/providers"
import { MicaLightProvider } from "@/components/mica-light-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <Providers>
            <MicaLightProvider />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
