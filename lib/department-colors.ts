import { DEPARTMENT_COLORS, type DepartmentColorValue } from "@/lib/schemas/org-chart";

export { DEPARTMENT_COLORS };
export type { DepartmentColorValue };

type Swatch = {
  label: string;
  dot: string;
  border: string;
  ring: string;
  bg: string;
  text: string;
};

export const DEPARTMENT_COLOR_SWATCHES: Record<DepartmentColorValue, Swatch> = {
  BLUE: {
    label: "Bleu",
    dot: "bg-sky-500",
    border: "border-sky-400",
    ring: "ring-sky-400",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
  GREEN: {
    label: "Vert",
    dot: "bg-emerald-500",
    border: "border-emerald-400",
    ring: "ring-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  YELLOW: {
    label: "Jaune",
    dot: "bg-amber-400",
    border: "border-amber-400",
    ring: "ring-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  PURPLE: {
    label: "Violet",
    dot: "bg-violet-500",
    border: "border-violet-400",
    ring: "ring-violet-400",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
  ORANGE: {
    label: "Orange",
    dot: "bg-orange-500",
    border: "border-orange-400",
    ring: "ring-orange-400",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  PINK: {
    label: "Rose",
    dot: "bg-pink-500",
    border: "border-pink-400",
    ring: "ring-pink-400",
    bg: "bg-pink-50",
    text: "text-pink-700",
  },
  TEAL: {
    label: "Turquoise",
    dot: "bg-teal-500",
    border: "border-teal-400",
    ring: "ring-teal-400",
    bg: "bg-teal-50",
    text: "text-teal-700",
  },
  GRAY: {
    label: "Gris",
    dot: "bg-gray-400",
    border: "border-gray-300",
    ring: "ring-gray-300",
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
  RED: {
    label: "Rouge",
    dot: "bg-red-500",
    border: "border-red-400",
    ring: "ring-red-400",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  INDIGO: {
    label: "Indigo",
    dot: "bg-indigo-500",
    border: "border-indigo-400",
    ring: "ring-indigo-400",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  CYAN: {
    label: "Cyan",
    dot: "bg-cyan-500",
    border: "border-cyan-400",
    ring: "ring-cyan-400",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
  LIME: {
    label: "Citron vert",
    dot: "bg-lime-500",
    border: "border-lime-400",
    ring: "ring-lime-400",
    bg: "bg-lime-50",
    text: "text-lime-700",
  },
};

const DEFAULT_SWATCH: Swatch = {
  label: "Sans couleur",
  dot: "bg-gray300",
  border: "border-gray200",
  ring: "ring-gray200",
  bg: "bg-facamWhite",
  text: "text-gray500",
};

export function getDepartmentSwatch(color: DepartmentColorValue | null | undefined): Swatch {
  if (!color) return DEFAULT_SWATCH;
  return DEPARTMENT_COLOR_SWATCHES[color] ?? DEFAULT_SWATCH;
}
