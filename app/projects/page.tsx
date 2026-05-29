"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProjectStoryCreateButton from "./ProjectStoryCreateButton";
import KpiFilterCard from "@/components/KpiFilterCard";
import type { QuickFilter } from "@/lib/kpiFilters";

type User = {
  id: string;
  name: string;
  email: string;
  role?: "ADMIN" | "LIDER" | "COLABORADOR";
};

type Project = {
  id: string;
  folioPrefix?: string | null;
  folioNumber?: number | null;
  folio?: string | null;
  name: string;
  description: string;
  status: string;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  blocked?: boolean | null;
  owner?: {
    name: string;
  };
};

const statusOptions = [
  { value: "ANALISIS", label: "Análisis" },
  { value: "DISENO", label: "Diseño" },
  {
    value: "DESARROLLO_IMPLEMENTACION",
    label: "Desarrollo / implementación",
  },
  { value: "PRUEBAS", label: "Pruebas" },
  { value: "TRANSICION", label: "Transición" },
  { value: "PUESTA_EN_MARCHA", label: "Puesta en marcha" },
];

function normalizeProjectStatus(status?: string | null) {
  if (!status) return "ANALISIS";

  if (status === "PENDIENTE") return "ANALISIS";
  if (status === "EN_PROGRESO") return "DESARROLLO_IMPLEMENTACION";
  if (status === "BLOQUEADO") return "TRANSICION";
  if (status === "CANCELADO") return "TRANSICION";
  if (status === "TERMINADO") return "PUESTA_EN_MARCHA";

  return status;
}

function normalizeFolioPrefixInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
}

function getStatusLabel(status: string) {
  const normalizedStatus = normalizeProjectStatus(status);
  return (
    statusOptions.find((option) => option.value === normalizedStatus)?.label ??
    status
  );
}

function getStatusClasses(status: string) {
  const normalizedStatus = normalizeProjectStatus(status);

  if (normalizedStatus === "PUESTA_EN_MARCHA") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (normalizedStatus === "DESARROLLO_IMPLEMENTACION") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalizedStatus === "PRUEBAS") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalizedStatus === "TRANSICION") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalizedStatus === "DISENO") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusClasses(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
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



function isProjectClosed(project: Project) {
  const normalizedStatus = normalizeProjectStatus(project.status);

  return (
    normalizedStatus === "PUESTA_EN_MARCHA" ||
    project.status === "TERMINADO" ||
    project.status === "CANCELADO"
  );
}

function isProjectOpen(project: Project) {
  return !isProjectClosed(project);
}

function isProjectBlocked(project: Project) {
  return project.status === "BLOQUEADO" || project.blocked === true;
}

function isProjectOverdue(project: Project) {
  if (isProjectClosed(project)) return false;
  if (project.actualEndDate) return false;
  if (!project.estimatedEndDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(project.estimatedEndDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function matchesProjectQuickFilter(project: Project, quickFilter: QuickFilter) {
  if (quickFilter === "TOTAL") return true;
  if (quickFilter === "ABIERTAS") return isProjectOpen(project);
  if (quickFilter === "VENCIDAS") return isProjectOverdue(project);
  if (quickFilter === "BLOQUEADAS") return isProjectBlocked(project);

  return true;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState("");
  const [folioPrefix, setFolioPrefix] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ANALISIS");
  const [ownerId, setOwnerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [actualEndDate, setActualEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("TOTAL");

  async function loadProjects() {
    const res = await fetch("/api/projects", {
      cache: "no-store",
    });

    const data = await res.json();
    setProjects(data);
  }

  async function loadUsers() {
    const res = await fetch("/api/users", {
      cache: "no-store",
    });

    const data = await res.json();
    setUsers(data);

    if (data.length > 0 && !ownerId) {
      setOwnerId(data[0].id);
    }
  }

  async function changeProjectStatus(projectId: string, newStatus: string) {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    if (res.ok) {
      await loadProjects();
    } else {
      alert("No se pudo actualizar el estado del proyecto");
    }
  }

  async function deleteProject(projectId: string) {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este proyecto? También se eliminarán sus historias asociadas."
    );

    if (!confirmed) return;

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await loadProjects();
    } else {
      alert("No se pudo eliminar el proyecto");
    }
  }

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const text = search.toLowerCase();

      const matchesSearch =
        project.name.toLowerCase().includes(text) ||
        (project.folio ?? "").toLowerCase().includes(text) ||
        (project.folioPrefix ?? "").toLowerCase().includes(text) ||
        (project.description ?? "").toLowerCase().includes(text) ||
        (project.owner?.name ?? "").toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "TODOS" ||
        normalizeProjectStatus(project.status) === statusFilter;

      const matchesKpiFilter = matchesProjectQuickFilter(project, quickFilter);

      return matchesSearch && matchesStatus && matchesKpiFilter;
    });
  }, [projects, search, statusFilter, quickFilter]);

  const totalProjects = projects.length;
  const openProjects = projects.filter(isProjectOpen).length;
  const overdueProjects = projects.filter(isProjectOverdue).length;
  const blockedProjects = projects.filter(isProjectBlocked).length;

  function resetForm() {
    setName("");
    setFolioPrefix("");
    setDescription("");
    setStatus("ANALISIS");
    setStartDate("");
    setEstimatedEndDate("");
    setActualEndDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (folioPrefix.length !== 3) {
      alert("La clave de folio debe tener exactamente 3 caracteres.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        folioPrefix,
        description,
        status,
        ownerId,
        startDate: startDate || null,
        estimatedEndDate: estimatedEndDate || null,
        actualEndDate: actualEndDate || null,
      }),
    });

    if (res.ok) {
      resetForm();
      setShowProjectModal(false);
      await loadProjects();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo crear el proyecto");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Gestión
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Proyectos
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Administra proyectos, responsables, fechas y estados.
              </p>
            </div>

            <button
              type="button"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
              onClick={() => setShowProjectModal(true)}
            >
              + Nuevo proyecto
            </button>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiFilterCard
              title="Total"
              value={totalProjects}
              subtitle="Proyectos registrados"
              filter="TOTAL"
              activeFilter={quickFilter}
              onClick={(filter) => {
                setQuickFilter(filter);
                setStatusFilter("TODOS");
              }}
            />

            <KpiFilterCard
              title="Abiertas"
              value={openProjects}
              subtitle="Proyectos abiertos"
              filter="ABIERTAS"
              activeFilter={quickFilter}
              onClick={(filter) => {
                setQuickFilter(filter);
                setStatusFilter("TODOS");
              }}
            />

            <KpiFilterCard
              title="Vencidas"
              value={overdueProjects}
              subtitle="Proyectos vencidos"
              filter="VENCIDAS"
              activeFilter={quickFilter}
              onClick={(filter) => {
                setQuickFilter(filter);
                setStatusFilter("TODOS");
              }}
            />

            <KpiFilterCard
              title="Bloqueadas"
              value={blockedProjects}
              subtitle="Proyectos bloqueados"
              filter="BLOQUEADAS"
              activeFilter={quickFilter}
              onClick={(filter) => {
                setQuickFilter(filter);
                setStatusFilter("TODOS");
              }}
            />
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Lista de proyectos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredProjects.length} proyecto(s) encontrados.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-64"
                  placeholder="Buscar proyecto o folio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">
                  No hay proyectos para mostrar
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Crea un nuevo proyecto o ajusta los filtros de búsqueda.
                </p>

                <button
                  type="button"
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  onClick={() => setShowProjectModal(true)}
                >
                  + Nuevo proyecto
                </button>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredProjects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2">
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-blue-700">
                            {project.folio ?? "Sin folio"}
                          </span>
                        </div>

                        <Link
                          href={`/projects/${project.id}`}
                          className="text-lg font-bold text-slate-950 hover:text-blue-600"
                        >
                          {project.name}
                        </Link>

                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {project.description || "Sin descripción"}
                        </p>
                      </div>

                      <StatusBadge status={project.status} />
                    </div>

                    <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Responsable</span>
                        <strong className="text-right text-slate-950">
                          {project.owner?.name || "Sin responsable"}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Inicio</span>
                        <strong className="text-right text-slate-950">
                          {formatDate(project.startDate)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Fin estimado</span>
                        <strong className="text-right text-slate-950">
                          {formatDate(project.estimatedEndDate)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <select
                        value={normalizeProjectStatus(project.status)}
                        onChange={(e) =>
                          changeProjectStatus(project.id, e.target.value)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-wrap gap-2">
                        <ProjectStoryCreateButton
                          project={{
                            id: project.id,
                            name: project.name,
                            folio: project.folio,
                          }}
                          users={users}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-100"
                        />

                        <Link
                          href={`/projects/${project.id}`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Ver detalle
                        </Link>

                        <button
                          type="button"
                          onClick={() => deleteProject(project.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <form
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onSubmit={handleSubmit}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Nuevo proyecto
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Captura la información principal del proyecto.
                </p>
              </div>

              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-200"
                onClick={() => {
                  resetForm();
                  setShowProjectModal(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-[1fr_180px]">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Nombre del proyecto
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Clave de folio
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center font-black uppercase tracking-[0.2em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="text"
                    value={folioPrefix}
                    onChange={(e) =>
                      setFolioPrefix(normalizeFolioPrefixInput(e.target.value))
                    }
                    minLength={3}
                    maxLength={3}
                    placeholder="SKU"
                    required
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Usa 3 letras o números. Ejemplo: SKU, CRM, INV.
                  </p>
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Descripción
                </span>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Responsable
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar responsable</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Estado
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Fecha de inicio
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Fin estimado
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="date"
                    value={estimatedEndDate}
                    onChange={(e) => setEstimatedEndDate(e.target.value)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Fin real
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type="date"
                    value={actualEndDate}
                    onChange={(e) => setActualEndDate(e.target.value)}
                  />
                </label>
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Crear proyecto"}
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  onClick={() => {
                    resetForm();
                    setShowProjectModal(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}