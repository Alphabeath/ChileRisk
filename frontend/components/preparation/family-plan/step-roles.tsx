"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFamilyPlan } from "@/hooks/use-family-plan"

export function StepRoles() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  const memberOptions = data.members.filter((m) => m.first_name.trim())

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/55">
            <th className="px-2 py-2 text-left">Tarea</th>
            <th className="px-2 py-2 text-left">Responsable</th>
          </tr>
        </thead>
        <tbody>
          {data.roles.map((role) => (
            <tr key={role.task} className="border-b border-white/10">
              <td className="px-2 py-3 text-white/85">{role.task}</td>
              <td className="px-2 py-3">
                <Select
                  value={role.member_id ?? "none"}
                  onValueChange={(value) =>
                    updateData((prev) => ({
                      ...prev,
                      roles: prev.roles.map((r) =>
                        r.task === role.task
                          ? { ...r, member_id: value === "none" ? null : value }
                          : r,
                      ),
                    }))
                  }
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Seleccionar integrante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {memberOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {memberOptions.length === 0 ? (
        <p className="mt-3 text-[12px] text-amber-200/80">
          Agrega integrantes en el paso 1 para asignar responsabilidades.
        </p>
      ) : null}
    </div>
  )
}