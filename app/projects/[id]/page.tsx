import Link from "next/link";
import { headers } from "next/headers";
import BoardClient from "./BoardClient";
import ProjectStoryCreateButton from "../ProjectStoryCreateButton";
import {
  getWorkflowStatusClasses,
  getWorkflowStatusLabel,
  normalizeWorkflowStatus,
} from "@/lib/statuses";
import { getProjectResponsibleNames } from "@/lib/projectResponsibles";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  blocked?: boolean | null;
  blockedReason?: string | null;
  blockedAt?: string | null;
  owner?: {
    id?: string;
    name: string;
  };
  responsibles?: Array<{
    user: {
      id: string;
      name: string;
      email?: string | null;
    };
  }>;
};

type User = {
  id: string;
  name: string;
  email: string;
  role?: "ADMIN" | "LIDER" | "COLABORADOR";
};

type Story = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  owner?: {
    name: string;
  };
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");

  const protocol = isLocalhost ? "http" : "https";

  return `${protocol}://${host}`;
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  const baseUrl = await getBaseUrl();

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Error al cargar ${path}: ${res.status} ${res.statusText}`);
      return fallback;
    }

    return res.json();
  } catch (error) {
    console.error(`Error al conectar con ${path}:`, error);
    return fallback;
  }
}

async function getProjects(): Promise<Project[]> {
  return fetchJson<Project[]>("/api/projects", []);
}

async function getStories(): Promise<Story[]> {
  return fetchJson<Story[]>("/api/stories", []);
}

async function getUsers(): Promise<User[]> {
  return fetchJson<User[]>("/api/users", []);
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStoryStatus(status?: string) {
  return normalizeWorkflowStatus(status);
}

function getProjectStatusLabel(status?: string) {
  return getWorkflowStatusLabel(status);
}

function getProjectStatusClasses(status?: string) {
  return getWorkflowStatusClasses(status);
}

function getStoryStatusLabel(status?: string) {
  return getWorkflowStatusLabel(status);
}

function getStoryStatusClasses(status?: string) {
  return getWorkflowStatusClasses(status);
}

function getPriorityClasses(priority?: string) {
  if (priority === "CRITICA") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "ALTA") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (priority === "MEDIA") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getPriorityLabel(priority?: string) {
  if (priority === "CRITICA") return "Crítica";
  if (priority === "ALTA") return "Alta";
  if (priority === "MEDIA") return "Media";
  if (priority === "BAJA") return "Baja";
  return priority || "Sin prioridad";
}

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
        <Link
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/dashboard"
        >
          Dashboard
        </Link>

        <Link
          className="block rounded-2xl bg-white px-4 py-3 text-slate-950"
          href="/projects"
        >
          Proyectos
        </Link>

        <Link
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/stories"
        >
          Historias
        </Link>

        <Link
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/requirements"
        >
          Requerimientos
        </Link>

        <Link
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/warnings"
        >
          <span aria-hidden="true">⚠</span> Advertencias
        </Link>

        <Link
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/calendar"
        >
          Calendario
        </Link>

        <Link
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/users"
        >
          Usuarios
        </Link>

        <Link
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/audit-logs"
        >
          Auditoría
        </Link>
      </nav>
    </aside>
  );
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getProjectStatusClasses(
        status
      )}`}
    >
      {getProjectStatusLabel(status)}
    </span>
  );
}

function StoryStatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStoryStatusClasses(
        status
      )}`}
    >
      {getStoryStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClasses(
        priority
      )}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [projects, stories, users] = await Promise.all([
    getProjects(),
    getStories(),
    getUsers(),
  ]);

  const project: Project | undefined = projects.find(
    (item: Project) => item.id === id
  );

  const projectStories: Story[] = stories.filter(
    (story: Story) => story.projectId === id
  );

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
          <Sidebar />

          <section className="min-w-0 flex-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <Link
                href="/projects"
                className="text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                ← Volver a proyectos
              </Link>

              <h1 className="mt-6 text-3xl font-bold text-slate-950">
                Proyecto no encontrado
              </h1>
              <p className="mt-2 text-slate-500">
                No se encontró información para este proyecto.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const analysisStories = projectStories.filter(
    (story) => normalizeStoryStatus(story.status) === "ANALISIS"
  ).length;

  const activeStories = projectStories.filter((story) =>
    [
      "DISENO",
      "DESARROLLO_IMPLEMENTACION",
      "PRUEBAS",
      "TRANSICION",
    ].includes(normalizeStoryStatus(story.status))
  ).length;

  const finishedStories = projectStories.filter(
    (story) => normalizeStoryStatus(story.status) === "PUESTA_EN_MARCHA"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <Link
                  href="/projects"
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  ← Volver a proyectos
                </Link>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                    {project.name}
                  </h1>

                  <StatusBadge status={project.status} />
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  {project.description || "Sin descripción registrada."}
                </p>

                {project.blocked ? (
                  <div className="mt-4 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-bold">
                      Proyecto bloqueado el {formatDate(project.blockedAt)}
                    </p>
                    <p className="mt-1">
                      {project.blockedReason || "Sin observación registrada."}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  Editar proyecto
                </Link>

                <ProjectStoryCreateButton
                  project={{ id: project.id, name: project.name }}
                  users={users}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryBox
                label="Responsables"
                value={getProjectResponsibleNames(project)}
              />

              <SummaryBox
                label="Periodo estimado"
                value={`${formatDate(project.startDate)} - ${formatDate(
                  project.estimatedEndDate
                )}`}
              />

              <SummaryBox
                label="Cierre real"
                value={formatDate(project.actualEndDate)}
              />
            </div>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total historias"
              value={projectStories.length}
              subtitle="Historias asociadas"
            />

            <MetricCard
              title="Analisis"
              value={analysisStories}
              subtitle="Etapa de analisis"
            />

            <MetricCard
              title="En proceso"
              value={activeStories}
              subtitle="Diseño, desarrollo, pruebas o transición"
            />

            <MetricCard
              title="Puesta en marcha"
              value={finishedStories}
              subtitle="Historias en etapa final"
            />
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Tablero de historias
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seguimiento del flujo de trabajo de este proyecto.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {projectStories.length} historias
                </span>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  {finishedStories} en puesta en marcha
                </span>
              </div>
            </div>

            <BoardClient initialStories={projectStories} />
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-950">
                Historias del proyecto
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vista rápida de las historias relacionadas.
              </p>
            </div>

            {projectStories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">
                  No hay historias registradas
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Crea historias desde la sección de historias para asociarlas a
                  este proyecto.
                </p>

                <ProjectStoryCreateButton
                  project={{ id: project.id, name: project.name }}
                  users={users}
                  className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                />
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {projectStories.map((story) => (
                  <article
                    key={story.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">
                          {story.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {story.description || "Sin descripción"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <PriorityBadge priority={story.priority} />
                        <StoryStatusBadge status={story.status} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Inicio</span>
                        <strong className="text-right text-slate-950">
                          {formatDate(story.startDate)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Fin estimado</span>
                        <strong className="text-right text-slate-950">
                          {formatDate(story.estimatedEndDate)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Fin real</span>
                        <strong className="text-right text-slate-950">
                          {formatDate(story.actualEndDate)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/stories/${story.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                      >
                        Ver requerimientos
                      </Link>

                      <Link
                        href="/stories"
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                      >
                        Modificar historia
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
