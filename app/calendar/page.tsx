import Link from "next/link";

async function getProjects() {
  const res = await fetch("https://proyecto-tablero.vercel.app/api/projects", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar los proyectos");
  }

  return res.json();
}

async function getStories() {
  const res = await fetch("https://proyecto-tablero.vercel.app/api/stories", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las historias");
  }

  return res.json();
}

type CalendarItem = {
  type: "Proyecto" | "Historia";
  event: "Inicio" | "Fin estimado" | "Fin real";
  name: string;
  date: string;
  status: string;
  person: string;
  link: string;
};

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
          className="block rounded-2xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
          href="/stories"
        >
          Historias
        </Link>

        <Link
          className="block rounded-2xl bg-white px-4 py-3 text-slate-950"
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

function parseDate(date: string) {
  const cleanDate = date.slice(0, 10);
  const [year, month, day] = cleanDate.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(date);
  }

  return new Date(year, month - 1, day);
}

function formatDate(date: string) {
  return parseDate(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: string) {
  if (status === "BACKLOG") return "Backlog";
  if (status === "PENDIENTE") return "Pendiente";
  if (status === "EN_PROGRESO") return "En progreso";
  if (status === "REVISION") return "Revisión";
  if (status === "TERMINADO") return "Terminado";
  if (status === "BLOQUEADO") return "Bloqueado";
  return status;
}

function getStatusClasses(status: string) {
  if (status === "TERMINADO") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "EN_PROGRESO") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "REVISION") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (status === "BLOQUEADO") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "PENDIENTE") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getTypeClasses(type: CalendarItem["type"]) {
  if (type === "Proyecto") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-purple-200 bg-purple-50 text-purple-700";
}

function getEventClasses(event: CalendarItem["event"]) {
  if (event === "Inicio") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (event === "Fin real") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function SummaryCard({
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

export default async function CalendarPage() {
  const projects = await getProjects();
  const stories = await getStories();

  const items: CalendarItem[] = [];

  projects.forEach((project: any) => {
    if (project.startDate) {
      items.push({
        type: "Proyecto",
        event: "Inicio",
        name: project.name,
        date: project.startDate,
        status: project.status,
        person: project.owner?.name ?? "Sin responsable",
        link: `/projects/${project.id}`,
      });
    }

    if (project.estimatedEndDate) {
      items.push({
        type: "Proyecto",
        event: "Fin estimado",
        name: project.name,
        date: project.estimatedEndDate,
        status: project.status,
        person: project.owner?.name ?? "Sin responsable",
        link: `/projects/${project.id}`,
      });
    }

    if (project.actualEndDate) {
      items.push({
        type: "Proyecto",
        event: "Fin real",
        name: project.name,
        date: project.actualEndDate,
        status: project.status,
        person: project.owner?.name ?? "Sin responsable",
        link: `/projects/${project.id}`,
      });
    }
  });

  stories.forEach((story: any) => {
    if (story.startDate) {
      items.push({
        type: "Historia",
        event: "Inicio",
        name: story.title,
        date: story.startDate,
        status: story.status,
        person: story.assignedTo?.name ?? "Sin asignar",
        link: `/projects/${story.projectId}`,
      });
    }

    if (story.estimatedEndDate) {
      items.push({
        type: "Historia",
        event: "Fin estimado",
        name: story.title,
        date: story.estimatedEndDate,
        status: story.status,
        person: story.assignedTo?.name ?? "Sin asignar",
        link: `/projects/${story.projectId}`,
      });
    }

    if (story.actualEndDate) {
      items.push({
        type: "Historia",
        event: "Fin real",
        name: story.title,
        date: story.actualEndDate,
        status: story.status,
        person: story.assignedTo?.name ?? "Sin asignar",
        link: `/projects/${story.projectId}`,
      });
    }
  });

  items.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projectItems = items.filter((item) => item.type === "Proyecto").length;
  const storyItems = items.filter((item) => item.type === "Historia").length;
  const upcomingItems = items.filter(
    (item) => parseDate(item.date).getTime() >= today.getTime()
  ).length;
  const overdueItems = items.filter((item) => {
    const itemDate = parseDate(item.date);
    itemDate.setHours(0, 0, 0, 0);

    return itemDate.getTime() < today.getTime() && item.status !== "TERMINADO";
  }).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Planeación
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Calendario
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Consulta fechas importantes de proyectos e historias de usuario.
              </p>
            </div>

            <Link
              href="/projects"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Ver proyectos
            </Link>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Eventos"
              value={items.length}
              subtitle="Fechas registradas"
            />

            <SummaryCard
              title="Proyectos"
              value={projectItems}
              subtitle="Eventos de proyectos"
            />

            <SummaryCard
              title="Historias"
              value={storyItems}
              subtitle="Eventos de historias"
            />

            <SummaryCard
              title="Pendientes"
              value={upcomingItems}
              subtitle="Fechas próximas o actuales"
            />
          </div>

          {overdueItems > 0 && (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
              <p className="font-bold">Hay {overdueItems} fecha(s) vencidas.</p>
              <p className="mt-1 text-sm">
                Revisa los elementos que no están terminados y cuya fecha ya pasó.
              </p>
            </div>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-950">
                Línea de tiempo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {items.length} evento(s) ordenados por fecha.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">
                  No hay fechas registradas
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Agrega fechas de inicio, fin estimado o fin real en proyectos e historias.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const itemDate = parseDate(item.date);
                  itemDate.setHours(0, 0, 0, 0);

                  const isOverdue =
                    itemDate.getTime() < today.getTime() &&
                    item.status !== "TERMINADO";

                  return (
                    <article
                      key={`${item.type}-${item.name}-${item.event}-${index}`}
                      className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        isOverdue
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                        <div className="min-w-0">
                          <div className="mb-3 flex flex-wrap gap-2">
                            <Badge className={getTypeClasses(item.type)}>
                              {item.type}
                            </Badge>

                            <Badge className={getEventClasses(item.event)}>
                              {item.event}
                            </Badge>

                            <Badge className={getStatusClasses(item.status)}>
                              {getStatusLabel(item.status)}
                            </Badge>

                            {isOverdue && (
                              <Badge className="border-red-200 bg-red-100 text-red-700">
                                Vencido
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-slate-950">
                            {item.name}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Responsable:{" "}
                            <span className="font-bold text-slate-700">
                              {item.person}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-800">
                            {formatDate(item.date)}
                          </div>

                          <Link
                            href={item.link}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Abrir proyecto
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
