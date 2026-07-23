"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Backpack,
  Check,
  Droplets,
  Flame,
  HeartHandshake,
  type LucideIcon,
  MessageCircle,
  PawPrint,
  PhoneCall,
  Wrench,
  Zap,
} from "lucide-react"

import {
  FamilyPlanCategoryShell,
  FamilyPlanEmptyState,
  FamilyPlanItemCard,
  FamilyPlanStatusBanner,
  FamilyPlanStatusChip,
  FamilyPlanStepRoot,
} from "@/components/preparation/family-plan/family-plan-layout"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFamilyPlan } from "@/hooks/use-family-plan"
import type { FamilyMember, RoleAssignment } from "@/lib/types"
import { cn } from "@/lib/utils"

type CategoryId = "utilities" | "during" | "after"

const CATEGORY_META: Record<
  CategoryId,
  {
    title: string
    description: string
    icon: LucideIcon
    accent: string
  }
> = {
  utilities: {
    title: "Servicios básicos",
    description: "Cortar suministros antes de evacuar.",
    icon: Wrench,
    accent: "border-l-amber-500/60",
  },
  during: {
    title: "Durante la emergencia",
    description: "Acciones inmediatas al momento del evento.",
    icon: AlertTriangle,
    accent: "border-l-rose-500/60",
  },
  after: {
    title: "Comunicación y cuidado",
    description: "Coordinación con la familia y mascotas.",
    icon: MessageCircle,
    accent: "border-l-cyan-500/60",
  },
}

const TASK_CATEGORY: Record<string, CategoryId> = {
  "Cortar electricidad": "utilities",
  "Cerrar gas": "utilities",
  "Cerrar agua": "utilities",
  "Llevar kit emergencia": "during",
  "Asistir personas vulnerables": "during",
  "Llamar emergencias": "during",
  "Contactar familiares": "after",
  "Cuidar mascotas": "after",
}

const TASK_VISUAL: Record<
  string,
  { icon: LucideIcon; chip: string }
> = {
  "Cortar electricidad": {
    icon: Zap,
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  "Cerrar gas": {
    icon: Flame,
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  },
  "Cerrar agua": {
    icon: Droplets,
    chip: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  },
  "Llevar kit emergencia": {
    icon: Backpack,
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  },
  "Asistir personas vulnerables": {
    icon: HeartHandshake,
    chip: "border-pink-500/30 bg-pink-500/10 text-pink-200",
  },
  "Llamar emergencias": {
    icon: PhoneCall,
    chip: "border-red-500/30 bg-red-500/10 text-red-200",
  },
  "Contactar familiares": {
    icon: MessageCircle,
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  },
  "Cuidar mascotas": {
    icon: PawPrint,
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
}

const DEFAULT_TASK_VISUAL: { icon: LucideIcon; chip: string } = {
  icon: Wrench,
  chip: "border-white/20 bg-white/10 text-white/85",
}

function getTaskVisual(task: string) {
  return TASK_VISUAL[task] ?? DEFAULT_TASK_VISUAL
}

const MEMBER_PALETTE: Array<{ bg: string; text: string; border: string }> = [
  { bg: "bg-blue-500/15", text: "text-blue-200", border: "border-blue-400/30" },
  { bg: "bg-emerald-500/15", text: "text-emerald-200", border: "border-emerald-400/30" },
  {
    bg: "bg-violet-500/15",
    text: "text-violet-200",
    border: "border-violet-400/30",
  },
  { bg: "bg-amber-500/15", text: "text-amber-200", border: "border-amber-400/30" },
  { bg: "bg-rose-500/15", text: "text-rose-200", border: "border-rose-400/30" },
  { bg: "bg-cyan-500/15", text: "text-cyan-200", border: "border-cyan-400/30" },
  { bg: "bg-pink-500/15", text: "text-pink-200", border: "border-pink-400/30" },
  {
    bg: "bg-orange-500/15",
    text: "text-orange-200",
    border: "border-orange-400/30",
  },
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getMemberPalette(memberId: string) {
  return MEMBER_PALETTE[hashId(memberId) % MEMBER_PALETTE.length]
}

function memberFullName(member: FamilyMember) {
  return `${member.first_name} ${member.last_name}`.trim() || "Sin nombre"
}

function memberInitial(member: FamilyMember) {
  const source = member.first_name.trim() || member.last_name.trim()
  return source.charAt(0).toUpperCase() || "?"
}

function MemberAvatar({
  member,
  size = "sm",
}: {
  member: FamilyMember
  size?: "xs" | "sm"
}) {
  const palette = getMemberPalette(member.id)
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border font-mono font-semibold uppercase",
        size === "xs" ? "size-5 text-[10px]" : "size-6 text-[11px]",
        palette.bg,
        palette.text,
        palette.border,
      )}
      aria-hidden
    >
      {memberInitial(member)}
    </span>
  )
}

function TaskRow({
  role,
  members,
  onAssign,
}: {
  role: RoleAssignment
  members: FamilyMember[]
  onAssign: (memberId: string | null) => void
}) {
  const visual = getTaskVisual(role.task)
  const Icon = visual.icon
  const assigned = members.find((m) => m.id === role.member_id)
  return (
    <div
      className={cn(
        "flex min-h-11 flex-col gap-3 border-t border-white/10 px-3 py-3 transition-colors first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        assigned && "bg-white/[0.015]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center border",
            visual.chip,
          )}
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        <span className="text-[12.5px] text-white/90">{role.task}</span>
      </div>
      <div className="flex w-full items-center gap-2 sm:max-w-xs sm:flex-1">
        {assigned ? (
          <MemberAvatar member={assigned} />
        ) : null}
        <Select
          value={role.member_id ?? "none"}
          onValueChange={(value) =>
            onAssign(value === "none" ? null : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar integrante" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin asignar</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {memberFullName(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function CategoryCard({
  categoryId,
  roles,
  members,
  onAssign,
}: {
  categoryId: CategoryId
  roles: RoleAssignment[]
  members: FamilyMember[]
  onAssign: (task: string, memberId: string | null) => void
}) {
  const meta = CATEGORY_META[categoryId]
  const Icon = meta.icon
  const assignedCount = roles.filter((r) => r.member_id).length
  const total = roles.length
  const tone =
    assignedCount === total
      ? "complete"
      : assignedCount === 0
        ? "empty"
        : "pending"

  return (
    <FamilyPlanCategoryShell
      accentClassName={meta.accent}
      header={
        <>
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex size-7 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-white/90"
              aria-hidden
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-[1.4px] text-white/85">
                {meta.title}
              </h3>
              <p className="mt-0.5 truncate text-[11.5px] text-white/45">
                {meta.description}
              </p>
            </div>
          </div>
          <FamilyPlanStatusChip tone={tone}>
            {assignedCount}/{total}
          </FamilyPlanStatusChip>
        </>
      }
    >
      {roles.map((role) => (
        <TaskRow
          key={role.task}
          role={role}
          members={members}
          onAssign={(memberId) => onAssign(role.task, memberId)}
        />
      ))}
    </FamilyPlanCategoryShell>
  )
}

function ProgressBanner({
  assigned,
  total,
}: {
  assigned: number
  total: number
}) {
  const pct = total === 0 ? 0 : Math.round((assigned / total) * 100)
  const unassigned = total - assigned

  return (
    <FamilyPlanStatusBanner>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border font-mono text-[13px] font-semibold tabular-nums",
            pct === 100
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
              : "border-white/20 bg-white/10 text-white",
          )}
        >
          {pct === 100 ? <Check className="size-4" /> : `${pct}%`}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
            Progreso de asignación
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            {assigned} de {total} tareas con responsable
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem] sm:items-end">
        <div className="relative h-1.5 w-full border border-white/10 bg-white/5 sm:max-w-xs">
          <span
            className={cn(
              "block h-full transition-all duration-300",
              pct === 100 ? "bg-emerald-400/80" : "bg-white/40",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {unassigned > 0 ? (
              <FamilyPlanStatusChip tone="pending">
                {unassigned} sin asignar
              </FamilyPlanStatusChip>
            ) : (
              <FamilyPlanStatusChip tone="complete">
                Todo asignado
              </FamilyPlanStatusChip>
            )}
          </div>
        ) : null}
      </div>
    </FamilyPlanStatusBanner>
  )
}

function ResumenCard({
  members,
  roles,
}: {
  members: FamilyMember[]
  roles: RoleAssignment[]
}) {
  const counts = new Map<string, number>()
  for (const r of roles) {
    if (!r.member_id) continue
    counts.set(r.member_id, (counts.get(r.member_id) ?? 0) + 1)
  }
  const ranked = members
    .map((m) => ({ member: m, count: counts.get(m.id) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)

  if (ranked.length === 0) return null

  return (
    <FamilyPlanItemCard>
      <header className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[1.4px] text-white/85">
          Resumen por integrante
        </span>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ranked.map(({ member, count }) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-2 border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <MemberAvatar member={member} />
              <span className="truncate text-[12px] text-white/85">
                {memberFullName(member)}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/55">
              {count} {count === 1 ? "tarea" : "tareas"}
            </span>
          </li>
        ))}
      </ul>
    </FamilyPlanItemCard>
  )
}

function NoMembersEmpty() {
  return (
    <FamilyPlanEmptyState className="items-start gap-3 border-amber-400/30 bg-amber-500/[0.04] p-4 text-left sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-200"
          aria-hidden
        >
          <AlertTriangle className="size-4" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-amber-200/90">
            Sin integrantes
          </p>
          <p className="mt-1 text-[12px] leading-snug text-white/65">
            Agrega integrantes en el paso 1 para poder asignarles tareas.
          </p>
        </div>
      </div>
      <Link
        href="/preparation/family-plan/step/1"
        className={cn(
          "inline-flex shrink-0 items-center gap-2 self-start border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-amber-100/95 transition-colors sm:self-center",
          "hover:border-amber-400/50 hover:bg-amber-500/20",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30",
        )}
      >
        Ir al paso 1
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </FamilyPlanEmptyState>
  )
}

export function StepRoles() {
  const { data, updateData } = useFamilyPlan()
  if (!data) return null

  const memberOptions = data.members.filter((m) => m.first_name.trim())
  const totalAssigned = data.roles.filter((r) => r.member_id).length

  function updateAssignment(task: string, memberId: string | null) {
    updateData((prev) => ({
      ...prev,
      roles: prev.roles.map((r) =>
        r.task === task ? { ...r, member_id: memberId } : r,
      ),
    }))
  }

  const groupedRoles: Record<CategoryId, RoleAssignment[]> = {
    utilities: [],
    during: [],
    after: [],
  }
  for (const role of data.roles) {
    const category = TASK_CATEGORY[role.task] ?? "after"
    groupedRoles[category].push(role)
  }

  return (
    <FamilyPlanStepRoot>
      <ProgressBanner assigned={totalAssigned} total={data.roles.length} />

      {memberOptions.length === 0 ? (
        <NoMembersEmpty />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {(Object.keys(groupedRoles) as CategoryId[]).map((categoryId) => (
              <CategoryCard
                key={categoryId}
                categoryId={categoryId}
                roles={groupedRoles[categoryId]}
                members={memberOptions}
                onAssign={updateAssignment}
              />
            ))}
          </div>
          <ResumenCard members={memberOptions} roles={data.roles} />
        </>
      )}
    </FamilyPlanStepRoot>
  )
}
