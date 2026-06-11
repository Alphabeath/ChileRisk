import type { FamilyPlanData, RoleAssignment, SafeZone, Threat } from "@/lib/types"

export const FAMILY_MEMBER_FLAGS = [
  { id: "reduced_mobility", label: "Movilidad reducida" },
  { id: "disability", label: "Discapacidad" },
  { id: "chronic_illness", label: "Enfermedad crónica" },
  { id: "medical_dependency", label: "Dependencia médica" },
  { id: "pregnancy", label: "Embarazo" },
  { id: "lactation", label: "Lactancia" },
] as const

export const INTERNAL_THREATS = [
  "Enchufes defectuosos",
  "Instalaciones eléctricas dañadas",
  "Fugas de gas",
  "Material inflamable",
  "Muebles sin fijación",
  "Pasillos obstruidos",
  "Escaleras inseguras",
] as const

export const EXTERNAL_THREATS = [
  "Sismo",
  "Tsunami",
  "Inundación",
  "Incendio forestal",
  "Aluvión",
  "Remoción en masa",
  "Erupción volcánica",
  "Accidente industrial",
  "Accidente de tránsito",
] as const

export const EMERGENCY_TYPES = [
  "Sismo",
  "Incendio",
  "Tsunami",
  "Inundación",
  "Fuga de gas",
] as const

export const ROLE_TASKS = [
  "Cortar electricidad",
  "Cerrar gas",
  "Cerrar agua",
  "Llevar kit emergencia",
  "Asistir personas vulnerables",
  "Llamar emergencias",
  "Contactar familiares",
  "Cuidar mascotas",
] as const

export const NATIONAL_EMERGENCY_NUMBERS = [
  { service: "Ambulancia", phone: "131" },
  { service: "Bomberos", phone: "132" },
  { service: "Carabineros", phone: "133" },
  { service: "PDI", phone: "134" },
  { service: "CONAF", phone: "130" },
  { service: "SERNAMEG", phone: "1455" },
] as const

export const ROOM_TYPES = [
  { id: "bedroom", label: "Dormitorio" },
  { id: "kitchen", label: "Cocina" },
  { id: "bathroom", label: "Baño" },
  { id: "dining", label: "Comedor" },
  { id: "living", label: "Living" },
  { id: "patio", label: "Patio" },
  { id: "stairs", label: "Escaleras" },
  { id: "parking", label: "Estacionamiento" },
] as const

export const EMERGENCY_MARKER_TYPES = [
  { id: "electrical_panel", label: "Tablero eléctrico" },
  { id: "water_valve", label: "Llave de agua" },
  { id: "gas_valve", label: "Llave de gas" },
  { id: "extinguisher", label: "Extintor" },
  { id: "first_aid", label: "Botiquín" },
  { id: "emergency_kit", label: "Kit de emergencia" },
  { id: "radio", label: "Radio" },
  { id: "flashlight", label: "Linterna" },
] as const

export const KIT_ITEMS_BASE = [
  "Agua (2 L/persona/día)",
  "Barras energéticas",
  "Conservas",
  "Alimentos deshidratados",
  "Tetrapack",
  "Linterna",
  "Radio portátil",
  "Pilas",
  "Dinero efectivo",
  "Abrelatas",
  "Alcohol gel",
  "Papel higiénico",
  "Toallas absorbentes",
  "Bolsas de basura",
  "Mascarillas",
  "Identificaciones",
  "Escrituras",
  "Contratos",
  "Certificados",
  "Medicamentos",
  "Botiquín",
  "Recetas médicas",
  "Copia del plan",
  "Llaves de la vivienda",
] as const

export const KIT_ITEMS_INFANT = [
  "Pañales",
  "Fórmula",
  "Mamaderas",
  "Toallas húmedas",
  "Ropa adicional",
] as const

export const KIT_ITEMS_PREGNANT = [
  "Controles médicos",
  "Exámenes",
  "Vitaminas",
  "Contactos médicos",
] as const

export const KIT_ITEMS_TEA = [
  "Credencial",
  "Información de contacto",
  "Objetos reguladores",
  "Elementos de calma",
] as const

export const KIT_ITEMS_PETS = [
  "Carnet veterinario",
  "Registro nacional",
  "Prescripciones",
  "Agua para mascotas",
  "Alimento",
  "Correa",
  "Arnés",
  "Jaula",
  "Canil",
  "Frazada",
  "Gasas",
  "Suero",
  "Medicamentos veterinarios",
] as const

export const WIZARD_STEPS = [
  { step: 1, slug: "family-group", title: "Grupo familiar" },
  { step: 2, slug: "threats", title: "Amenazas" },
  { step: 3, slug: "safe-zones", title: "Zonas seguras" },
  { step: 4, slug: "floor-map", title: "Mapa de vivienda" },
  { step: 5, slug: "roles", title: "Roles" },
  { step: 6, slug: "contacts", title: "Contactos" },
  { step: 7, slug: "emergency-kit", title: "Kit de emergencia" },
  { step: 8, slug: "drills", title: "Simulación" },
] as const

function makeThreats(): Threat[] {
  const internal = INTERNAL_THREATS.map((risk, i) => ({
    id: `internal-${i}`,
    risk,
    category: "internal" as const,
    probability: 1,
    impact: 1,
    corrective_action: "",
    selected: false,
  }))
  const external = EXTERNAL_THREATS.map((risk, i) => ({
    id: `external-${i}`,
    risk,
    category: "external" as const,
    probability: 1,
    impact: 1,
    corrective_action: "",
    selected: false,
  }))
  return [...internal, ...external]
}

function makeSafeZones(): SafeZone[] {
  return EMERGENCY_TYPES.map((emergency) => ({
    emergency,
    safe_place: "",
    evacuation_route: "",
    safe_zone: "",
    meeting_point: "",
  }))
}

function makeRoles(): RoleAssignment[] {
  return ROLE_TASKS.map((task) => ({ task, member_id: null }))
}

function kitSection(items: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(items.map((item) => [item, false]))
}

export function createDefaultFamilyPlanData(): FamilyPlanData {
  return {
    members: [],
    pets: [],
    threats: makeThreats(),
    safe_zones: makeSafeZones(),
    floor_map: {
      rooms: [],
      markers: [],
      routes: [],
      zones: [],
      active_layer: "safe",
      saved_at: null,
    },
    roles: makeRoles(),
    contacts: [],
    emergency_kit: {
      base: kitSection(KIT_ITEMS_BASE),
      infant: kitSection(KIT_ITEMS_INFANT),
      pregnant: kitSection(KIT_ITEMS_PREGNANT),
      tea: kitSection(KIT_ITEMS_TEA),
      pets: kitSection(KIT_ITEMS_PETS),
    },
    drills: [],
  }
}

export function riskLevel(score: number): "bajo" | "medio" | "alto" {
  if (score <= 5) return "bajo"
  if (score <= 15) return "medio"
  return "alto"
}

export function riskScore(probability: number, impact: number): number {
  return probability * impact
}