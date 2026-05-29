export type QuickFilter = "TOTAL" | "ABIERTAS" | "VENCIDAS" | "BLOQUEADAS";

export const KPI_COLORS = {
  TOTAL: "#00AAFF",
  ABIERTAS: "#36FF7D",
  VENCIDAS: "#FFC100",
  BLOQUEADAS: "#FF0027",
};

export type FilterableItem = {
  status?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
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
    status === "CANCELADO" ||
    status === "CERRADO"
  );
}

export function isOpenItem(item: FilterableItem) {
  return !isClosedItem(item);
}

export function isBlockedItem(item: FilterableItem) {
  return normalizeStatus(item.status) === "BLOQUEADO" || item.blocked === true;
}

export function isOverdueItem(item: FilterableItem) {
  if (isClosedItem(item)) return false;
  if (item.actualEndDate) return false;
  if (!item.estimatedEndDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(item.estimatedEndDate);
  dueDate.setHours(0, 0, 0, 0);

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

  return true;
}