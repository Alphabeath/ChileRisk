import { CitizenNavbar } from "@/components/layout/citizen-navbar"

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative h-dvh overflow-hidden">
      <CitizenNavbar />
      {children}
    </div>
  )
}
