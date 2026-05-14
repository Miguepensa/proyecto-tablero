import Link from "next/link";

type Project = {
  id: string;
  name?: string | null;
  description?: string | null;
  status: string;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  owner?: {
    name: string;
  } | null;
};

type Story = {
  id: string;
  title?: string | null;
  description?: string | null;
  status: string;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
};

type ProjectByUser = {
  name: string;
  total: number;
  pending: number;
  inProgress: number;
  finished: number;
  blocked: number;
};

async function getProjects(): Promise<Project[]> {
  const res = await  fetch("https://proyecto-tablero.vercel.app/api/projects", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar los proyectos");
  }

  return res.json();
}

async function getStories(): Promise<Story[]> {
  const res = await fetch("https://proyecto-tablero.vercel.app/api/stories", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las historias");
  }

  return res.json();
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
          className="block rounded-2xl bg-white px-4 py-3 text-slate-950"
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
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
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

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "green" | "orange" | "red" | "purple" | "gray";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    gray: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className={`h-12 w-12 rounded-2xl ${accent}`} />
      </div>

      <p className="mt-4 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Avance general</span>
        <span className="font-semibold text-slate-950">{percent}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const projects = await getProjects();
  const stories = await getStories();

  const totalProjects = projects.length;
  const pendingProjects = projects.filter(
    (project) => project.status === "PENDIENTE"
  ).length;
  const inProgressProjects = projects.filter(
    (project) => project.status === "EN_PROGRESO"
  ).length;
  const finishedProjects = projects.filter(
    (project) => project.status === "TERMINADO"
  ).length;
  const blockedProjects = projects.filter(
    (project) => project.status === "BLOQUEADO"
  ).length;

  const totalStories = stories.length;
  const backlogStories = stories.filter(
    (story) => story.status === "BACKLOG"
  ).length;
  const pendingStories = stories.filter(
    (story) => story.status === "PENDIENTE"
  ).length;
  const inProgressStories = stories.filter(
    (story) => story.status === "EN_PROGRESO"
  ).length;
  const reviewStories = stories.filter(
    (story) => story.status === "REVISION"
  ).length;
  const finishedStories = stories.filter(
    (story) => story.status === "TERMINADO"
  ).length;

  const today = new Date();

  const overdueProjects = projects.filter((project) => {
    if (!project.estimatedEndDate) return false;
    if (project.actualEndDate) return false;
    return new Date(project.estimatedEndDate) < today;
  }).length;

  const overdueStories = stories.filter((story) => {
    if (!story.estimatedEndDate) return false;
    if (story.actualEndDate) return false;
    return new Date(story.estimatedEndDate) < today;
  }).length;

  const recentProjects = projects.slice(0, 5);

  const projectsByUser = projects
    .reduce<ProjectByUser[]>((acc, project) => {
      const ownerName = project.owner?.name || "Sin responsable";
      const existingUser = acc.find((item) => item.name === ownerName);

      if (existingUser) {
        existingUser.total += 1;

        if (project.status === "PENDIENTE") {
          existingUser.pending += 1;
        }

        if (project.status === "EN_PROGRESO") {
          existingUser.inProgress += 1;
        }

        if (project.status === "TERMINADO") {
          existingUser.finished += 1;
        }

        if (project.status === "BLOQUEADO") {
          existingUser.blocked += 1;
        }

        return acc;
      }

      acc.push({
        name: ownerName,
        total: 1,
        pending: project.status === "PENDIENTE" ? 1 : 0,
        inProgress: project.status === "EN_PROGRESO" ? 1 : 0,
        finished: project.status === "TERMINADO" ? 1 : 0,
        blocked: project.status === "BLOQUEADO" ? 1 : 0,
      });

      return acc;
    }, [])
    .sort((a, b) => b.total - a.total);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Resumen gerencial
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Vista general de proyectos, historias, avance y alertas.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
              <div className="h-10 w-10 rounded-full bg-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Admin</p>
                <p className="text-xs text-slate-500">admin@admin.com</p>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Proyectos"
              value={totalProjects}
              subtitle={`${inProgressProjects} en progreso`}
              accent="bg-blue-100"
            />

            <MetricCard
              title="Historias"
              value={totalStories}
              subtitle={`${finishedStories} terminadas`}
              accent="bg-purple-100"
            />

            <MetricCard
              title="Terminados"
              value={finishedProjects}
              subtitle="Proyectos completados"
              accent="bg-green-100"
            />

            <MetricCard
              title="Alertas"
              value={overdueProjects + overdueStories}
              subtitle="Elementos vencidos"
              accent="bg-red-100"
            />
          </div>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Proyectos por usuario
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cantidad de proyectos asignados a cada responsable.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                {projectsByUser.length} responsable(s)
              </span>
            </div>

            {projectsByUser.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-bold text-slate-950">
                  No hay proyectos asignados
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Cuando existan proyectos con responsable, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projectsByUser.map((user) => {
                  const percentage =
                    totalProjects === 0
                      ? 0
                      : Math.round((user.total / totalProjects) * 100);

                  return (
                    <article
                      key={user.name}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500">
                            Responsable
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-slate-950">
                            {user.name}
                          </h3>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg font-black text-blue-700">
                          {user.name.slice(0, 1).toUpperCase()}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div className="rounded-2xl bg-white p-3 text-center">
                          <p className="text-xs font-medium text-slate-500">
                            Total
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">
                            {user.total}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 text-center">
                          <p className="text-xs font-medium text-slate-500">
                            Pend.
                          </p>
                          <p className="mt-2 text-2xl font-bold text-orange-700">
                            {user.pending}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 text-center">
                          <p className="text-xs font-medium text-slate-500">
                            Act.
                          </p>
                          <p className="mt-2 text-2xl font-bold text-blue-700">
                            {user.inProgress}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 text-center">
                          <p className="text-xs font-medium text-slate-500">
                            Cerr.
                          </p>
                          <p className="mt-2 text-2xl font-bold text-green-700">
                            {user.finished}
                          </p>
                        </div>
                      </div>

                      {user.blocked > 0 && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                          {user.blocked} proyecto(s) bloqueado(s)
                        </div>
                      )}

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {percentage}% del total de proyectos
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Estado de proyectos
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Distribución actual por estatus.
                  </p>
                </div>

                <StatusPill label="Actualizado" tone="blue" />
              </div>

              <div className="space-y-5">
                <ProgressBar value={finishedProjects} total={totalProjects} />

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Pendientes</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {pendingProjects}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">En progreso</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {inProgressProjects}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Terminados</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {finishedProjects}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Bloqueados</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {blockedProjects}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-950">
                  Historias de usuario
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Flujo de trabajo actual.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <StatusPill label="Backlog" tone="gray" />
                  <span className="text-lg font-bold text-slate-950">
                    {backlogStories}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <StatusPill label="Pendiente" tone="orange" />
                  <span className="text-lg font-bold text-slate-950">
                    {pendingStories}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <StatusPill label="En progreso" tone="blue" />
                  <span className="text-lg font-bold text-slate-950">
                    {inProgressStories}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <StatusPill label="Revisión" tone="purple" />
                  <span className="text-lg font-bold text-slate-950">
                    {reviewStories}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <StatusPill label="Terminado" tone="green" />
                  <span className="text-lg font-bold text-slate-950">
                    {finishedStories}
                  </span>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Proyectos recientes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Últimos proyectos registrados en el sistema.
                </p>
              </div>

              <Link
                href="/projects"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Ver todos
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Proyecto</th>
                    <th className="px-5 py-4">Responsable</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Inicio</th>
                    <th className="px-5 py-4">Fin estimado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {recentProjects.map((project) => {
                    const statusTone =
                      project.status === "TERMINADO"
                        ? "green"
                        : project.status === "EN_PROGRESO"
                          ? "blue"
                          : project.status === "BLOQUEADO"
                            ? "red"
                            : "orange";

                    return (
                      <tr key={project.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-950">
                            {project.name ?? "Sin nombre"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {project.description ?? "Sin descripción"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {project.owner?.name || "Sin responsable"}
                        </td>

                        <td className="px-5 py-4">
                          <StatusPill
                            label={project.status}
                            tone={statusTone}
                          />
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {project.startDate
                            ? new Date(project.startDate).toLocaleDateString(
                                "es-MX"
                              )
                            : "Sin fecha"}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {project.estimatedEndDate
                            ? new Date(
                                project.estimatedEndDate
                              ).toLocaleDateString("es-MX")
                            : "Sin fecha"}
                        </td>
                      </tr>
                    );
                  })}

                  {recentProjects.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        Todavía no hay proyectos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
