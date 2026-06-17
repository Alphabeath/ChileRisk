import type { SVGAttributes } from "react"

/** Escuela / establecimiento educativo — simulacro sector educación. */
export function EducationIcon(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="512"
      height="512"
      viewBox="0 0 512 512"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      {...props}
    >
      <path d="M256 40 40 200v24l216 124 216-124v-24L256 40zm0 88 168 96.8V432H88V224.8L256 128z" />
      <path d="M168 296h48v136h-48V296zm64 0h80v136h-80V296zm96 0h48v136h-48V296z" />
    </svg>
  )
}