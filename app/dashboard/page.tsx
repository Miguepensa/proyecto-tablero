import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  active?: boolean | null;
};

type Project = {
  id: string;
  folio?: string | null;
  name?: string | null;
  description?: string | null;
  status?: string | null;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  owner?: {
    name?: string | null;
  } | null;
};

type Story = {
  id: string;
  folio?: string | null;
  title?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  project?: {
    name?: string | null;
  } | null;
  assignedTo?: {
    name?: string | null;
  } | null;
};

type Requisition = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  estimatedEndDate?: string | null;
  dueDate?: string | null;
  actualEndDate?: string | null;
  completedAt?: string | null;
  userStory?: {
    title?: string | null;
    folio?: string | null;
    project?: {
      name?: string | null;
    } | null;
  } | null;
  story?: {
    title?: string | null;
    folio?: string | null;
    project?: {
      name?: string | null;
    } | null;
  } | null;
  assignedTo?: {
    name?: string | null;
  } | null;
};

type Tone = "blue" | "green" | "orange" | "red" | "purple" | "gray" | "sky";

type StatusCount = {
  status: string;
  total: number;
};

const FALLBACK_API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

async function getApiBaseUrl() {
  try {
    const headersList = await headers();
    const host =
      headersList.get("x-forwarded-host") ||
      headersList.get("host");

    if (!host) {
      return FALLBACK_API_BASE_URL;
    }

    const protocol =
      headersList.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.includes("127.0.0.1")
        ? "http"
        : "https");

    return `${protocol}://${host}`;
  } catch (error) {
    console.error("No se pudo obtener el host actual:", error);
    return FALLBACK_API_BASE_URL;
  }
}

function collectionFromResponse<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}

async function fetchCollection<T>(
  baseUrl: string,
  path: string,
  label: string,
  keys: string[]
): Promise<T[]> {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`No se pudo cargar ${label}:`, res.status);
      return [];
    }

    const data = await res.json();
    return collectionFromResponse<T>(data, keys);
  } catch (error) {
    console.error(`Error al cargar ${label}:`, error);
    return [];
  }
}

function normalizeStatus(status?: string | null) {
  return String(status ?? "SIN_ESTADO").trim().toUpperCase();
}

function statusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);

  const labels: Record<string, string> = {
    ANALISIS: "Análisis",
    ANALYSIS: "Análisis",
    DISENO: "Diseño",
    DISEÑO: "Diseño",
    DESARROLLO: "Desarrollo",
    DEVELOPMENT: "Desarrollo",
    PRUEBAS: "Pruebas",
    TESTING: "Pruebas",
    BACKLOG: "Backlog",
    PENDIENTE: "Pendiente",
    EN_PROGRESO: "En progreso",
    REVISION: "Revisión",
    REVIEW: "Revisión",
    TERMINADO: "Terminado",
    COMPLETADO: "Completado",
    COMPLETED: "Completado",
    BLOQUEADO: "Bloqueado",
    BLOCKED: "Bloqueado",
    CANCELADO: "Cancelado",
    SIN_ESTADO: "Sin estado",
  };

  return labels[normalized] ?? normalized.replace(/_/g, " ").toLowerCase();
}

function statusTone(status?: string | null): Tone {
  const normalized = normalizeStatus(status);

  if (["TERMINADO", "COMPLETADO", "COMPLETED"].includes(normalized)) {
    return "green";
  }

  if (["EN_PROGRESO", "DESARROLLO", "PRUEBAS", "TESTING"].includes(normalized)) {
    return "blue";
  }

  if (["ANALISIS", "ANALYSIS", "DISENO", "DISEÑO", "REVISION", "REVIEW"].includes(normalized)) {
    return "purple";
  }

  if (["BLOQUEADO", "BLOCKED", "CANCELADO"].includes(normalized)) {
    return "red";
  }

  if (["PENDIENTE", "BACKLOG"].includes(normalized)) {
    return "orange";
  }

  return "gray";
}

function isDone(status?: string | null) {
  return ["TERMINADO", "COMPLETADO", "COMPLETED"].includes(normalizeStatus(status));
}

function isBlocked(status?: string | null) {
  return ["BLOQUEADO", "BLOCKED"].includes(normalizeStatus(status));
}

function isOverdue(item: {
  estimatedEndDate?: string | null;
  dueDate?: string | null;
  actualEndDate?: string | null;
  completedAt?: string | null;
  status?: string | null;
}) {
  const dateValue = item.estimatedEndDate ?? item.dueDate;

  if (!dateValue || item.actualEndDate || item.completedAt || isDone(item.status)) {
    return false;
  }

  const dueDate = new Date(dateValue);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate < new Date();
}

function countByStatus(items: Array<{ status?: string | null }>): StatusCount[] {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const status = normalizeStatus(item.status);
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([status, total]) => ({ status, total }))
    .sort((a, b) => b.total - a.total);
}

function countByValue<T>(items: T[], getValue: (item: T) => string) {
  return items
    .reduce<Array<{ label: string; total: number }>>((acc, item) => {
      const label = getValue(item);
      const existing = acc.find((row) => row.label === label);

      if (existing) {
        existing.total += 1;
      } else {
        acc.push({ label, total: 1 });
      }

      return acc;
    }, [])
    .sort((a, b) => b.total - a.total);
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Sin fecha";
  }

  return value.toLocaleDateString("es-MX");
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 rounded-3xl bg-slate-950 p-5 text-white shadow-xl lg:block">
      <div className="mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black">
          T
        </div>
        <h2 className="mt-4 text-lg font-bold">Tablero</h2>
        <p className="mt-1 text-xs text-slate-400">Gestión de proyectos</p>
      </div>

      <nav className="space-y-2 text-sm font-medium">
        <Link className="block rounded-2xl bg-white px-4 py-2.5 text-slate-950" href="/dashboard">
          Dashboard
        </Link>
        <Link className="block rounded-2xl px-4 py-2.5 text-slate-300 hover:bg-slate-900 hover:text-white" href="/projects">
          Proyectos
        </Link>
        <Link className="block rounded-2xl px-4 py-2.5 text-slate-300 hover:bg-slate-900 hover:text-white" href="/stories">
          Historias
        </Link>
        <Link className="block rounded-2xl px-4 py-2.5 text-slate-300 hover:bg-slate-900 hover:text-white" href="/calendar">
          Calendario
        </Link>
        <Link className="block rounded-2xl px-4 py-2.5 text-slate-300 hover:bg-slate-900 hover:text-white" href="/users">
          Usuarios
        </Link>
        <Link className="block rounded-2xl px-4 py-2.5 text-slate-300 hover:bg-slate-900 hover:text-white" href="/audit-logs">
          Auditoría
        </Link>
        <Link className="mt-5 block rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-200 hover:bg-red-500 hover:text-white" href="/">
          Cerrar sesión
        </Link>
      </nav>
    </aside>
  );
}

function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const tones: Record<Tone, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    gray: "border-slate-200 bg-slate-50 text-slate-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>
      {label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-2xl ${accent}`} />
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function BoardPanel({
  title,
  subtitle,
  href,
  actionLabel,
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <Link href={href} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
          {actionLabel}
        </Link>
      </div>

      <div className="mt-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {children}
      </div>
    </section>
  );
}

function StatusRows({ rows }: { rows: StatusCount[] }) {
  if (rows.length === 0) {
    return <EmptyState message="No hay información registrada." />;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.status} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
          <StatusPill label={statusLabel(row.status)} tone={statusTone(row.status)} />
          <span className="text-base font-black text-slate-950">{row.total}</span>
        </div>
      ))}
    </div>
  );
}

function ValueRows({ rows }: { rows: Array<{ label: string; total: number }> }) {
  if (rows.length === 0) {
    return <EmptyState message="Sin datos para mostrar." />;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
          <span className="truncate text-sm font-semibold text-slate-700">{row.label}</span>
          <span className="text-base font-black text-slate-950">{row.total}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-600">Avance</span>
        <span className="font-black text-slate-950">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function RecentProjectRows({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return <EmptyState message="Todavía no hay proyectos." />;
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{project.name ?? "Sin nombre"}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{project.owner?.name || "Sin responsable"}</p>
            </div>
            <StatusPill label={statusLabel(project.status)} tone={statusTone(project.status)} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Fin: {formatDate(project.estimatedEndDate)}</p>
        </article>
      ))}
    </div>
  );
}

function RecentStoryRows({ stories }: { stories: Story[] }) {
  if (stories.length === 0) {
    return <EmptyState message="Todavía no hay historias." />;
  }

  return (
    <div className="space-y-2">
      {stories.map((story) => (
        <article key={story.id} className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{story.folio ? `${story.folio} - ` : ""}{story.title ?? "Sin título"}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{story.project?.name || "Sin proyecto"}</p>
            </div>
            <StatusPill label={statusLabel(story.status)} tone={statusTone(story.status)} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Asignado: {story.assignedTo?.name || "Sin asignar"}</p>
        </article>
      ))}
    </div>
  );
}

function RecentRequisitionRows({ requisitions }: { requisitions: Requisition[] }) {
  if (requisitions.length === 0) {
    return <EmptyState message="No hay requisiciones o actividades registradas." />;
  }

  return (
    <div className="space-y-2">
      {requisitions.map((item) => {
        const story = item.userStory ?? item.story;

        return (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{item.title ?? item.name ?? "Sin nombre"}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{story?.folio ? `${story.folio} - ` : ""}{story?.title || "Sin historia"}</p>
              </div>
              <StatusPill label={statusLabel(item.status)} tone={statusTone(item.status)} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Fin: {formatDate(item.estimatedEndDate ?? item.dueDate)}</p>
          </article>
        );
      })}
    </div>
  );
}

export default async function DashboardPage() {
  const apiBaseUrl = await getApiBaseUrl();

  const [users, projects, stories, requisitions] = await Promise.all([
    fetchCollection<User>(apiBaseUrl, "/api/users", "usuarios", ["users"]),
    fetchCollection<Project>(apiBaseUrl, "/api/projects", "proyectos", ["projects"]),
    fetchCollection<Story>(apiBaseUrl, "/api/stories", "historias", ["stories", "userStories"]),
    fetchCollection<Requisition>(apiBaseUrl, "/api/tasks", "requisiciones", ["tasks", "requisitions", "requirements"]),
  ]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active !== false).length;
  const inactiveUsers = users.filter((user) => user.active === false).length;
  const adminUsers = users.filter((user) => normalizeStatus(user.role) === "ADMIN").length;
  const userRoles = countByValue(users, (user) => user.role || "Sin rol");

  const totalProjects = projects.length;
  const finishedProjects = projects.filter((project) => isDone(project.status)).length;
  const blockedProjects = projects.filter((project) => isBlocked(project.status)).length;
  const activeProjects = projects.filter((project) => !isDone(project.status)).length;
  const overdueProjects = projects.filter(isOverdue).length;
  const projectStatuses = countByStatus(projects);
  const recentProjects = projects.slice(0, 6);

  const totalStories = stories.length;
  const finishedStories = stories.filter((story) => isDone(story.status)).length;
  const blockedStories = stories.filter((story) => isBlocked(story.status)).length;
  const activeStories = stories.filter((story) => !isDone(story.status)).length;
  const overdueStories = stories.filter(isOverdue).length;
  const storyStatuses = countByStatus(stories);
  const storiesByProject = countByValue(stories, (story) => story.project?.name || "Sin proyecto").slice(0, 6);
  const recentStories = stories.slice(0, 6);

  const totalRequisitions = requisitions.length;
  const finishedRequisitions = requisitions.filter((item) => isDone(item.status)).length;
  const blockedRequisitions = requisitions.filter((item) => isBlocked(item.status)).length;
  const activeRequisitions = requisitions.filter((item) => !isDone(item.status)).length;
  const overdueRequisitions = requisitions.filter(isOverdue).length;
  const requisitionStatuses = countByStatus(requisitions);
  const recentRequisitions = requisitions.slice(0, 6);

  const totalAlerts = overdueProjects + overdueStories + overdueRequisitions + blockedProjects + blockedStories + blockedRequisitions;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-[1500px] gap-5 px-4 py-5 sm:px-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Resumen general</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Dashboard PMO</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500">
                  Tableros compactos con información de usuarios, proyectos, historias de usuario y requisiciones.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
                <MiniStat label="Usuarios" value={totalUsers} />
                <MiniStat label="Proyectos" value={totalProjects} />
                <MiniStat label="Historias" value={totalStories} />
                <MiniStat label="Req." value={totalRequisitions} />
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Usuarios activos" value={activeUsers} subtitle={`${inactiveUsers} inactivo(s)`} accent="bg-sky-100" />
            <MetricCard title="Proyectos abiertos" value={activeProjects} subtitle={`${finishedProjects} terminado(s)`} accent="bg-blue-100" />
            <MetricCard title="Historias abiertas" value={activeStories} subtitle={`${finishedStories} terminada(s)`} accent="bg-purple-100" />
            <MetricCard title="Alertas" value={totalAlerts} subtitle="Vencidos o bloqueados" accent="bg-red-100" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <BoardPanel title="Usuarios" subtitle="Estado de usuarios y roles registrados." href="/users" actionLabel="Ver usuarios">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Total" value={totalUsers} />
                <MiniStat label="Activos" value={activeUsers} />
                <MiniStat label="Admin" value={adminUsers} />
                <MiniStat label="Inactivos" value={inactiveUsers} />
              </div>

              <div className="mt-4">
                <h3 className="mb-2 text-sm font-black text-slate-950">Roles</h3>
                <ValueRows rows={userRoles} />
              </div>
            </BoardPanel>

            <BoardPanel title="Proyectos" subtitle="Avance general, estados y proyectos recientes." href="/projects" actionLabel="Ver proyectos">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Total" value={totalProjects} />
                <MiniStat label="Abiertos" value={activeProjects} />
                <MiniStat label="Vencidos" value={overdueProjects} />
                <MiniStat label="Bloq." value={blockedProjects} />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <ProgressBar value={finishedProjects} total={totalProjects} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-black text-slate-950">Por estado</h3>
                  <StatusRows rows={projectStatuses} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-black text-slate-950">Recientes</h3>
                  <RecentProjectRows projects={recentProjects} />
                </div>
              </div>
            </BoardPanel>

            <BoardPanel title="Historias de usuario" subtitle="Flujo por fase, asignación y últimos registros." href="/stories" actionLabel="Ver historias">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Total" value={totalStories} />
                <MiniStat label="Abiertas" value={activeStories} />
                <MiniStat label="Vencidas" value={overdueStories} />
                <MiniStat label="Bloq." value={blockedStories} />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <ProgressBar value={finishedStories} total={totalStories} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-black text-slate-950">Por estado</h3>
                  <StatusRows rows={storyStatuses} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-black text-slate-950">Por proyecto</h3>
                  <ValueRows rows={storiesByProject} />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="mb-2 text-sm font-black text-slate-950">Recientes</h3>
                <RecentStoryRows stories={recentStories} />
              </div>
            </BoardPanel>

            <BoardPanel title="Requisiciones" subtitle="Resumen tomado de actividades/tareas registradas." href="/stories" actionLabel="Ver origen">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Total" value={totalRequisitions} />
                <MiniStat label="Abiertas" value={activeRequisitions} />
                <MiniStat label="Vencidas" value={overdueRequisitions} />
                <MiniStat label="Bloq." value={blockedRequisitions} />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <ProgressBar value={finishedRequisitions} total={totalRequisitions} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-black text-slate-950">Por estado</h3>
                  <StatusRows rows={requisitionStatuses} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-black text-slate-950">Recientes</h3>
                  <RecentRequisitionRows requisitions={recentRequisitions} />
                </div>
              </div>
            </BoardPanel>
          </div>
        </section>
      </div>
    </main>
  );
}
