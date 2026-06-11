import { FamilyPlanProvider } from "@/hooks/use-family-plan"

export default function FamilyPlanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FamilyPlanProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </FamilyPlanProvider>
  )
}