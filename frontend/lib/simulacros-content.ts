export {
  simulacrosClosing as SIMULACROS_CLOSING,
  simulacrosImportance as SIMULACROS_IMPORTANCE,
  simulacrosIntro as SIMULACROS_INTRO,
  simulacroTipos,
} from "@/data/simulacros"

import { simulacroTipos } from "@/data/simulacros"

/** @deprecated Use simulacroTipos from @/data/simulacros */
export const SIMULACRO_TYPE_GUIDES = simulacroTipos.map(
  ({ drillType, title, description }) => ({ drillType, title, description }),
)