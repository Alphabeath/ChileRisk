import { CitizenNavbar } from "@/components/layout/citizen-navbar"
import { GlobePageBackground } from "@/components/globe/globe-page-background"
import { MicaLightProvider } from "@/components/mica-light-provider"

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MicaLightProvider />
      <GlobePageBackground />
      <CitizenNavbar />
      <main className="relative z-10 flex-1">{children}</main>
    </div>
  )
}
