import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ActivitiesBoardClient from "./ActivitiesBoardClient";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "LIDER" | "COLABORADOR";
};

type Story = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  assignedTo?: User | null;
  createdBy?: User | null;
  tasks?: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    startDate?: string | null;
    estimatedEndDate?: string | null;
    actualEndDate?: string | null;
    assignedToId?: string | null;
    assignedTo?: User | null;
    createdBy?: User | null;
    activities?: {
      id: string;
      comment: string;
      percentComplete?: number | null;
      hoursSpent?: number | null;
      createdAt: string;
      activityDate?: string | null;
      user?: User | null;
    }[];
  }[];
};

const storyStatusLabels: Record<string, string> = {
  BACKLOG: "Backlog",
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  REVISION: "Revisión",
  TERMINADO: "Terminado",
};

const priorityLabels: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Sin fecha";
  }

  return parsedDate.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPriorityClasses(priority?: string | null) {
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

function getStatusClasses(status?: string | null) {
  if (status === "TERMINADO") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "EN_PROGRESO") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "REVISION") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (status === "PENDIENTE") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
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
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/projects"
        >
          Proyectos
        </Link>

        <Link
          className="block rounded-2xl bg-white px-4 py-3 text-slate-950"
          href="/stories"
        >
          Historias
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

        <Link
          className="mt-6 block rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 hover:bg-red-500 hover:text-white"
          href="/"
        >
          Cerrar sesión
        </Link>
      </nav>
    </aside>
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

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
        status
      )}`}
    >
      {storyStatusLabels[status ?? ""] ?? status ?? "Sin estado"}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClasses(
        priority
      )}`}
    >
      {priorityLabels[priority ?? ""] ?? priority ?? "Sin prioridad"}
    </span>
  );
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rawStory, rawUsers] = await Promise.all([
    prisma.userStory.findUnique({
      where: { id },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
        tasks: {
          include: {
            assignedTo: true,
            createdBy: true,
            activities: {
              include: {
                user: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const story = JSON.parse(JSON.stringify(rawStory)) as Story | null;
  const users = JSON.parse(JSON.stringify(rawUsers)) as User[];

  if (!story) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
          <Sidebar />

          <section className="min-w-0 flex-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <Link
                href="/stories"
                className="text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                ← Volver a historias
              </Link>

              <h1 className="mt-6 text-3xl font-bold text-slate-950">
                Historia no encontrada
              </h1>
              <p className="mt-2 text-slate-500">
                No se encontró información para esta historia de usuario.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const activities = story.tasks ?? [];

  const pendingActivities = activities.filter(
    (activity) => activity.status === "PENDIENTE"
  ).length;

  const inProgressActivities = activities.filter(
    (activity) =>
      activity.status === "EN_PROGRESO" || activity.status === "BLOQUEADO"
  ).length;

  const finishedActivities = activities.filter(
    (activity) => activity.status === "TERMINADO"
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
                  href="/stories"
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  ← Volver a historias
                </Link>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                    {story.title}
                  </h1>

                  <StatusBadge status={story.status} />
                  <PriorityBadge priority={story.priority} />
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  {story.description || "Sin descripción registrada."}
                </p>
              </div>

              {story.project?.id && (
                <Link
                  href={`/projects/${story.project.id}`}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  Ver proyecto
                </Link>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryBox
                label="Proyecto"
                value={story.project?.name || "Sin proyecto"}
              />

              <SummaryBox
                label="Responsable"
                value={story.assignedTo?.name || "Sin responsable"}
              />

              <SummaryBox
                label="Periodo estimado"
                value={`${formatDate(story.startDate)} - ${formatDate(
                  story.estimatedEndDate
                )}`}
              />
            </div>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total actividades"
              value={activities.length}
              subtitle="Actividades registradas"
            />

            <MetricCard
              title="Pendientes"
              value={pendingActivities}
              subtitle="Por iniciar"
            />

            <MetricCard
              title="En proceso"
              value={inProgressActivities}
              subtitle="Activas o bloqueadas"
            />

            <MetricCard
              title="Terminadas"
              value={finishedActivities}
              subtitle="Actividades cerradas"
            />
          </div>

          <ActivitiesBoardClient initialStory={story} users={users} />
        </section>
      </div>
    </main>
  );
}