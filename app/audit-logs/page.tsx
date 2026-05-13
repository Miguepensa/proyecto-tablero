import Link from "next/link";
import type { ReactNode } from "react";

async function getLogs() {
  const res = await fetch("http://localhost:3000/api/audit-logs", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo cargar la bitácora");
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
          className="block rounded-2xl bg-white px-4 py-3 text-slate-950"
          href="/audit-logs"
        >
          Auditoría
        </Link>
      </nav>
    </aside>
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

function Badge({
  children,
  className,
}: {
  children: ReactNode;
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

function getActionLabel(action?: string) {
  if (action === "CREATE") return "Creación";
  if (action === "UPDATE") return "Actualización";
  if (action === "DELETE") return "Eliminación";
  return action || "Sin acción";
}

function getActionClasses(action?: string) {
  if (action === "CREATE") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (action === "UPDATE") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (action === "DELETE") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getEntityLabel(entityType?: string) {
  if (entityType === "PROJECT") return "Proyecto";
  if (entityType === "STORY") return "Historia";
  if (entityType === "USER") return "Usuario";
  return entityType || "Sin entidad";
}

function getEntityClasses(entityType?: string) {
  if (entityType === "PROJECT") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (entityType === "STORY") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (entityType === "USER") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusLabel(status?: string) {
  if (!status) return "Sin estado";
  if (status === "BACKLOG") return "Backlog";
  if (status === "PENDIENTE") return "Pendiente";
  if (status === "EN_PROGRESO") return "En progreso";
  if (status === "REVISION") return "Revisión";
  if (status === "TERMINADO") return "Terminado";
  if (status === "BLOQUEADO") return "Bloqueado";
  return status;
}

function formatDate(date?: string) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditLogsPage() {
  const logs = await getLogs();

  const totalLogs = logs.length;
  const createLogs = logs.filter((log: any) => log.action === "CREATE").length;
  const updateLogs = logs.filter((log: any) => log.action === "UPDATE").length;
  const deleteLogs = logs.filter((log: any) => log.action === "DELETE").length;

  const recentLogs = [...logs].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Control
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Bitácora de cambios
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Consulta los movimientos realizados en proyectos, historias y usuarios.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Volver al dashboard
            </Link>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Movimientos"
              value={totalLogs}
              subtitle="Registros totales"
            />

            <SummaryCard
              title="Creaciones"
              value={createLogs}
              subtitle="Altas registradas"
            />

            <SummaryCard
              title="Actualizaciones"
              value={updateLogs}
              subtitle="Cambios aplicados"
            />

            <SummaryCard
              title="Eliminaciones"
              value={deleteLogs}
              subtitle="Bajas registradas"
            />
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-950">
                Actividad reciente
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {recentLogs.length} registro(s) encontrados.
              </p>
            </div>

            {recentLogs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">
                  No hay movimientos registrados
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Cuando se realicen cambios en el sistema, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Usuario</th>
                      <th className="px-5 py-4">Entidad</th>
                      <th className="px-5 py-4">Acción</th>
                      <th className="px-5 py-4">Cambio</th>
                      <th className="px-5 py-4">Fecha</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {recentLogs.map((log: any) => {
                      const oldStatus = log.oldValues?.status;
                      const newStatus = log.newValues?.status;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700">
                                {(log.user?.name || "S").slice(0, 1).toUpperCase()}
                              </div>

                              <div>
                                <p className="font-bold text-slate-950">
                                  {log.user?.name || "Sistema"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Usuario responsable
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <Badge className={getEntityClasses(log.entityType)}>
                              {getEntityLabel(log.entityType)}
                            </Badge>
                          </td>

                          <td className="px-5 py-4">
                            <Badge className={getActionClasses(log.action)}>
                              {getActionLabel(log.action)}
                            </Badge>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-medium text-slate-500">
                                  Estado anterior
                                </p>
                                <p className="mt-1 font-bold text-slate-950">
                                  {getStatusLabel(oldStatus)}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-medium text-slate-500">
                                  Estado nuevo
                                </p>
                                <p className="mt-1 font-bold text-slate-950">
                                  {getStatusLabel(newStatus)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-600">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}