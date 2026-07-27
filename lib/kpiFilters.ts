export type QuickFilter =
  | "TOTAL"
  | "ABIERTAS"
  | "VENCIDAS"
  | "BLOQUEADAS"
  | "COMPLETADAS";

export const KPI_COLORS = {
  TOTAL: "#00AAFF",
  ABIERTAS: "#36FF7D",
  VENCIDAS: "#FFC100",
  BLOQUEADAS: "#FF0027",
  COMPLETADAS: "#16A34A",
};

export type FilterableItem = {
  status?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  blocked?: boolean | null;
};

export function normalizeStatus(status?: string | null) {
  return (status ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/\//g, "_")
    .replace(/-/g, "_");
}

export function isClosedItem(item: FilterableItem) {
  const status = normalizeStatus(item.status);

  return (
    status === "TERMINADO" ||
    status === "COMPLETADO" ||
    status === "COMPLETED" ||
    status === "CANCELADO" ||
    status === "CERRADO" ||
    status === "FINALIZADO" ||
    status === "PUESTA_EN_MARCHA"
  );
}

export function isCompletedItem(item: FilterableItem) {
  const status = normalizeStatus(item.status);

  return (
    Boolean(item.actualEndDate) ||
    Boolean(item.completedAt) ||
    status === "TERMINADO" ||
    status === "COMPLETADO" ||
    status === "COMPLETED" ||
    status === "CERRADO" ||
    status === "FINALIZADO" ||
    status === "PUESTA_EN_MARCHA"
  );
}

export function isOpenItem(item: FilterableItem) {
  return !isClosedItem(item);
}

export function isBlockedItem(item: FilterableItem) {
  if (isClosedItem(item)) return false;

  return normalizeStatus(item.status) === "BLOQUEADO" || item.blocked === true;
}

export function isOverdueItem(item: FilterableItem) {
  if (isClosedItem(item)) return false;
  if (item.actualEndDate || item.completedAt) return false;

  const dueValue = item.estimatedEndDate ?? item.dueDate;

  if (!dueValue) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueValue);
  dueDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(dueDate.getTime())) return false;

  return dueDate < today;
}

export function matchesQuickFilter(
  item: FilterableItem,
  quickFilter: QuickFilter
) {
  if (quickFilter === "TOTAL") return true;
  if (quickFilter === "ABIERTAS") return isOpenItem(item);
  if (quickFilter === "VENCIDAS") return isOverdueItem(item);
  if (quickFilter === "BLOQUEADAS") return isBlockedItem(item);
  if (quickFilter === "COMPLETADAS") return isCompletedItem(item);

  return true;
}
