import { CitizenNavbar } from "@/components/layout/citizen-navbar"

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <CitizenNavbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
