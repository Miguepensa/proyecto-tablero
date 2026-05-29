import type { QuickFilter } from "@/lib/kpiFilters";
import { KPI_COLORS } from "@/lib/kpiFilters";

type Props = {
  title: string;
  value: number;
  subtitle: string;
  filter: QuickFilter;
  activeFilter: QuickFilter;
  onClick: (filter: QuickFilter) => void;
};

export default function KpiFilterCard({
  title,
  value,
  subtitle,
  filter,
  activeFilter,
  onClick,
}: Props) {
  const color = KPI_COLORS[filter];
  const active = activeFilter === filter;

  return (
    <button
      type="button"
      onClick={() => onClick(filter)}
      className={`rounded-3xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "ring-2" : "border-slate-200"
      }`}
      style={{
        borderColor: active ? color : undefined,
        ["--tw-ring-color" as string]: active ? color : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>

        <span
          className="h-9 w-9 rounded-full"
          style={{ backgroundColor: `${color}33` }}
        />
      </div>

      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </button>
  );
}