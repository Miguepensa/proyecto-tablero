export const WORKFLOW_STATUS_OPTIONS = [
  { value: "ANALISIS", label: "Análisis" },
  { value: "DISENO", label: "Diseño" },
  {
    value: "DESARROLLO_IMPLEMENTACION",
    label: "Desarrollo / implementación",
  },
  { value: "PRUEBAS", label: "Pruebas" },
  { value: "TRANSICION", label: "Transición" },
  { value: "PUESTA_EN_MARCHA", label: "Puesta en marcha" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUS_OPTIONS)[number]["value"];

const LEGACY_STATUS_MAP: Record<string, WorkflowStatus> = {
  ANALYSIS: "ANALISIS",
  BACKLOG: "ANALISIS",
  PENDIENTE: "ANALISIS",
  "DISEÑO": "DISENO",
  EN_PROGRESO: "DESARROLLO_IMPLEMENTACION",
  DESARROLLO: "DESARROLLO_IMPLEMENTACION",
  DEVELOPMENT: "DESARROLLO_IMPLEMENTACION",
  BLOQUEADO: "TRANSICION",
  BLOCKED: "TRANSICION",
  REVISION: "PRUEBAS",
  REVIEW: "PRUEBAS",
  TESTING: "PRUEBAS",
  TERMINADO: "PUESTA_EN_MARCHA",
  COMPLETADO: "PUESTA_EN_MARCHA",
  COMPLETED: "PUESTA_EN_MARCHA",
  CERRADO: "PUESTA_EN_MARCHA",
  FINALIZADO: "PUESTA_EN_MARCHA",
};

const WORKFLOW_STATUS_VALUES = new Set<string>(
  WORKFLOW_STATUS_OPTIONS.map((option) => option.value),
);

export function normalizeWorkflowStatus(
  status?: string | null,
): WorkflowStatus {
  if (!status) return "ANALISIS";

  const normalized = status.trim().toUpperCase();
  const legacyStatus = LEGACY_STATUS_MAP[normalized];

  if (legacyStatus) return legacyStatus;
  if (WORKFLOW_STATUS_VALUES.has(normalized)) {
    return normalized as WorkflowStatus;
  }

  return "ANALISIS";
}

export function isWorkflowStatus(status: unknown): status is WorkflowStatus {
  return typeof status === "string" && WORKFLOW_STATUS_VALUES.has(status);
}

export function parseWorkflowStatus(status: unknown): WorkflowStatus | null {
  if (typeof status !== "string") return null;

  const normalized = status.trim().toUpperCase();
  return WORKFLOW_STATUS_VALUES.has(normalized)
    ? (normalized as WorkflowStatus)
    : null;
}

export function getWorkflowStatusLabel(status?: string | null) {
  const normalized = normalizeWorkflowStatus(status);

  return (
    WORKFLOW_STATUS_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? normalized
  );
}

export function isCancelledStatus(status?: string | null) {
  return normalizeWorkflowStatus(status) === "CANCELADO";
}

export function isCompletedStatus(status?: string | null) {
  return normalizeWorkflowStatus(status) === "PUESTA_EN_MARCHA";
}

export function isClosedStatus(status?: string | null) {
  return isCompletedStatus(status) || isCancelledStatus(status);
}

export function getWorkflowStatusClasses(status?: string | null) {
  const normalized = normalizeWorkflowStatus(status);

  if (normalized === "CANCELADO") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalized === "PUESTA_EN_MARCHA") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (normalized === "DESARROLLO_IMPLEMENTACION") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "PRUEBAS") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalized === "TRANSICION") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalized === "DISENO") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}
