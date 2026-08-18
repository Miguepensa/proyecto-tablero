export const PROJECT_TYPE_OPTIONS = [
  {
    value: "ADMINISTRACION_TI",
    label: "Administración de sistemas de TI",
  },
  {
    value: "FABRICA_SOFTWARE",
    label: "Fábrica de software",
  },
] as const;

export type ProjectType = (typeof PROJECT_TYPE_OPTIONS)[number]["value"];

export function parseProjectType(value: unknown): ProjectType | null {
  const normalized = String(value ?? "").trim().toUpperCase();

  return PROJECT_TYPE_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as ProjectType)
    : null;
}

export function getProjectTypeLabel(value: unknown) {
  return (
    PROJECT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    "Administración de sistemas de TI"
  );
}
