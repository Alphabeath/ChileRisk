import { CitizenNavbar } from "@/components/layout/citizen-navbar"
import { MicaLightProvider } from "@/components/mica-light-provider"

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MicaLightProvider />
      <CitizenNavbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
