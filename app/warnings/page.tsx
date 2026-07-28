import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import {
  getWorkflowStatusClasses,
  getWorkflowStatusLabel,
} from "@/lib/statuses";
import {
  getDaysRemaining,
  getWarningDateRange,
  getWarningToday,
  PROJECT_WARNING_DAYS,
  REQUIREMENT_WARNING_DAYS,
  STORY_WARNING_DAYS,
  WARNING_TIME_ZONE,
} from "@/lib/warnings";

type WarningTab = "projects" | "stories" | "requirements";

const CLOSED_STATUSES = [
  "TERMINADO",
  "PUESTA_EN_MARCHA",
  "CANCELADO",
] as const;

function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:block">
      <div className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black">
          T
        </div>
        <h2 className="mt-4 text-xl font-bold">Tablero</h2>
        <p className="mt-1 text-sm text-slate-400">Gestión de proyectos</p>
      </div>

      <nav className="space-y-2 text-sm font-medium">
        <Link className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white" href="/dashboard">
          Dashboard
        </Link>
        <Link className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white" href="/projects">
          Proyectos
        </Link>
        <Link className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white" href="/stories">
          Historias
        </Link>
        <Link className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white" href="/requirements">
          Requerimientos
        </Link>
        <Link className="block rounded-2xl bg-white px-4 py-3 font-bold text-slate-950" href="/warnings">
          <span aria-hidden="true">⚠</span> Advertencias
        </Link>
        <Link className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white" href="/calendar">
          Calendario
        </Link>
        <Link className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white" href="/users">
          Usuarios
        </Link>
        <Link className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white" href="/audit-logs">
          Auditoría
        </Link>
        <Link className="mt-6 block rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 hover:bg-red-500 hover:text-white" href="/">
          Cerrar sesión
        </Link>
      </nav>
    </aside>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getUrgencyClasses(daysRemaining: number) {
  if (daysRemaining <= 5) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (daysRemaining <= 10) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-yellow-200 bg-yellow-50 text-yellow-800";
}

function DaysBadge({ daysRemaining }: { daysRemaining: number }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getUrgencyClasses(daysRemaining)}`}>
      {daysRemaining === 0
        ? "Vence hoy"
        : `${daysRemaining} día${daysRemaining === 1 ? "" : "s"} restantes`}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getWorkflowStatusClasses(status)}`}>
      {getWorkflowStatusLabel(status)}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-700">{children}</div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-xl text-green-700">✓</div>
      <p className="mt-4 font-bold text-slate-950">{children}</p>
      <p className="mt-1 text-sm text-slate-500">No se requiere atención dentro del periodo configurado.</p>
    </div>
  );
}

export default async function WarningsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab: WarningTab =
    params?.tab === "stories" || params?.tab === "requirements"
      ? params.tab
      : "projects";

  const now = new Date();
  const projectRange = getWarningDateRange(PROJECT_WARNING_DAYS, now);
  const shortRange = getWarningDateRange(STORY_WARNING_DAYS, now);

  const [projects, stories, requirements] = await Promise.all([
    prisma.project.findMany({
      where: {
        estimatedEndDate: { gte: projectRange.start, lt: projectRange.endExclusive },
        status: { notIn: [...CLOSED_STATUSES] },
      },
      include: { owner: true },
      orderBy: { estimatedEndDate: "asc" },
    }),
    prisma.userStory.findMany({
      where: {
        estimatedEndDate: { gte: shortRange.start, lt: shortRange.endExclusive },
        status: { notIn: [...CLOSED_STATUSES] },
      },
      include: { project: true, assignedTo: true },
      orderBy: { estimatedEndDate: "asc" },
    }),
    prisma.storyTask.findMany({
      where: {
        estimatedEndDate: { gte: shortRange.start, lt: shortRange.endExclusive },
        status: { notIn: [...CLOSED_STATUSES] },
      },
      include: {
        assignedTo: true,
        userStory: { include: { project: true } },
      },
      orderBy: { estimatedEndDate: "asc" },
    }),
  ]);

  const tabs: Array<{ value: WarningTab; label: string; count: number }> = [
    { value: "projects", label: "Proyectos", count: projects.length },
    { value: "stories", label: "Historias de usuario", count: stories.length },
    { value: "requirements", label: "Requerimientos", count: requirements.length },
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Seguimiento de fechas</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  <span aria-hidden="true">⚠</span> Advertencias
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Registros activos próximos a su fecha límite, calculados con la zona horaria de Ciudad de México.
                </p>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                <span className="font-bold">Fecha de referencia:</span>{" "}
                {formatDate(getWarningToday(now))}
                <span className="block text-xs text-orange-600">{WARNING_TIME_ZONE}</span>
              </div>
            </div>
          </header>

          <nav aria-label="Tipos de advertencias" className="mb-6 grid gap-3 sm:grid-cols-3">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={`/warnings?tab=${tab.value}`}
                  className={`rounded-2xl border px-4 py-4 text-sm font-bold shadow-sm transition ${
                    isActive
                      ? "border-orange-300 bg-orange-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 rounded-full px-2.5 py-1 text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}>
                    {tab.count}
                  </span>
                </Link>
              );
            })}
          </nav>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {activeTab === "projects" ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-950">Proyectos próximos a vencer</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Proyectos activos con fecha límite entre hoy y los próximos {PROJECT_WARNING_DAYS} días.
                  </p>
                </div>
                {projects.length === 0 ? (
                  <EmptyState>No hay proyectos próximos a vencer.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => {
                      const daysRemaining = getDaysRemaining(project.estimatedEndDate!, now)!;
                      return (
                        <article key={project.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-orange-200 hover:shadow-md">
                          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">{project.folio || "Sin folio"}</span>
                                <DaysBadge daysRemaining={daysRemaining} />
                              </div>
                              <h3 className="mt-3 text-lg font-bold text-slate-950">{project.name}</h3>
                            </div>
                            <div className="grid flex-1 gap-4 sm:grid-cols-3 xl:max-w-2xl">
                              <Detail label="Responsable">{project.owner?.name || "Sin responsable"}</Detail>
                              <Detail label="Estado"><StatusBadge status={project.status} /></Detail>
                              <Detail label="Fecha límite">{formatDate(project.estimatedEndDate!)}</Detail>
                            </div>
                            <Link href={`/projects/${project.id}`} className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                              Ver proyecto
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "stories" ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-950">Historias de usuario próximas a vencer</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Historias activas con fecha límite entre hoy y los próximos {STORY_WARNING_DAYS} días.
                  </p>
                </div>
                {stories.length === 0 ? (
                  <EmptyState>No hay historias de usuario próximas a vencer.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {stories.map((story) => {
                      const daysRemaining = getDaysRemaining(story.estimatedEndDate!, now)!;
                      return (
                        <article key={story.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-red-200 hover:shadow-md">
                          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                            <div className="min-w-0 xl:w-64">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">{story.folio || "Sin folio"}</span>
                                <DaysBadge daysRemaining={daysRemaining} />
                              </div>
                              <h3 className="mt-3 text-lg font-bold text-slate-950">{story.title}</h3>
                            </div>
                            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <Detail label="Proyecto">{story.project?.folio ? `${story.project.folio} · ${story.project.name}` : story.project?.name || "Sin proyecto"}</Detail>
                              <Detail label="Responsable">{story.assignedTo?.name || "Sin responsable"}</Detail>
                              <Detail label="Estado"><StatusBadge status={story.status} /></Detail>
                              <Detail label="Fecha límite">{formatDate(story.estimatedEndDate!)}</Detail>
                            </div>
                            <Link href={`/stories/${story.id}`} className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                              Ver historia
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "requirements" ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-950">Requerimientos próximos a vencer</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Requerimientos activos con fecha límite entre hoy y los próximos {REQUIREMENT_WARNING_DAYS} días.
                  </p>
                </div>
                {requirements.length === 0 ? (
                  <EmptyState>No hay requerimientos próximos a vencer.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {requirements.map((requirement) => {
                      const daysRemaining = getDaysRemaining(requirement.estimatedEndDate!, now)!;
                      return (
                        <article key={requirement.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-red-200 hover:shadow-md">
                          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                            <div className="min-w-0 xl:w-64">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">{requirement.folio || "Sin folio"}</span>
                                <DaysBadge daysRemaining={daysRemaining} />
                              </div>
                              <h3 className="mt-3 text-lg font-bold text-slate-950">{requirement.title}</h3>
                            </div>
                            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                              <Detail label="Historia">{requirement.userStory.folio ? `${requirement.userStory.folio} · ${requirement.userStory.title}` : requirement.userStory.title}</Detail>
                              <Detail label="Proyecto">{requirement.userStory.project.folio ? `${requirement.userStory.project.folio} · ${requirement.userStory.project.name}` : requirement.userStory.project.name}</Detail>
                              <Detail label="Responsable">{requirement.assignedTo?.name || "Sin responsable"}</Detail>
                              <Detail label="Estado"><StatusBadge status={requirement.status} /></Detail>
                              <Detail label="Fecha límite">{formatDate(requirement.estimatedEndDate!)}</Detail>
                            </div>
                            <Link href={`/stories/${requirement.userStoryId}#requirement-${requirement.id}`} className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                              Ver requerimiento
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
