"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProjectStoryCreateButton from "./ProjectStoryCreateButton";
import KpiFilterCard from "@/components/KpiFilterCard";
import type { QuickFilter } from "@/lib/kpiFilters";
import { getProjectResponsibleNames } from "@/lib/projectResponsibles";
import {
  PROJECT_TYPE_OPTIONS,
  type ProjectType,
} from "@/lib/projectTypes";
import {
  WORKFLOW_STATUS_OPTIONS as statusOptions,
  getWorkflowStatusClasses as getStatusClasses,
  getWorkflowStatusLabel as getStatusLabel,
  isClosedStatus,
  isCompletedStatus,
  normalizeWorkflowStatus as normalizeProjectStatus,
} from "@/lib/statuses";

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
  type: ProjectType;
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

function normalizeFolioPrefixInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(date?: string | null) {
  if (!date) return "";

  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getTodayInputDate() {
  return new Date().toISOString().slice(0, 10);
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
  return isClosedStatus(project.status);
}

function isProjectCompleted(project: Project) {
  return (
    Boolean(project.actualEndDate) ||
    isCompletedStatus(project.status) ||
    project.status === "COMPLETADO" ||
    project.status === "COMPLETED" ||
    project.status === "CERRADO" ||
    project.status === "FINALIZADO"
  );
}

function isProjectOpen(project: Project) {
  return !isProjectClosed(project);
}

function isProjectBlocked(project: Project) {
  if (isProjectClosed(project)) return false;

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
  if (quickFilter === "COMPLETADAS") return isProjectCompleted(project);

  return true;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState("");
  const [folioPrefix, setFolioPrefix] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] =
    useState<ProjectType>("ADMINISTRACION_TI");
  const [status, setStatus] = useState("ANALISIS");
  const [responsibleIds, setResponsibleIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [actualEndDate, setActualEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("TOTAL");
  const [activeProjectType, setActiveProjectType] =
    useState<ProjectType>("ADMINISTRACION_TI");

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockProjectId, setBlockProjectId] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockDate, setBlockDate] = useState(getTodayInputDate());
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState("");

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

    setResponsibleIds((currentIds) =>
      currentIds.length > 0 || data.length === 0
        ? currentIds
        : [data[0].id],
    );
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

  function openBlockModal(project?: Project) {
    const selectedProject = project ?? projects[0];

    setBlockProjectId(selectedProject?.id ?? "");
    setBlockReason(selectedProject?.blockedReason ?? "");
    setBlockDate(toInputDate(selectedProject?.blockedAt) || getTodayInputDate());
    setBlockError("");
    setShowBlockModal(true);
  }

  function closeBlockModal() {
    setShowBlockModal(false);
    setBlockProjectId("");
    setBlockReason("");
    setBlockDate(getTodayInputDate());
    setBlockError("");
  }

  async function handleBlockSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!blockProjectId) {
      setBlockError("Selecciona el proyecto que se va a bloquear.");
      return;
    }

    if (!blockReason.trim()) {
      setBlockError("Escribe la observación del bloqueo.");
      return;
    }

    setBlockLoading(true);
    setBlockError("");

    const res = await fetch(`/api/projects/${blockProjectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocked: true,
        blockedReason: blockReason,
        blockedAt: blockDate || null,
      }),
    });

    if (res.ok) {
      closeBlockModal();
      setQuickFilter("BLOQUEADAS");
      setStatusFilter("TODOS");
      await loadProjects();
    } else {
      const data = await res.json().catch(() => null);
      setBlockError(data?.error ?? "No se pudo registrar el bloqueo.");
    }

    setBlockLoading(false);
  }

  async function unblockProject(projectId: string) {
    const confirmed = window.confirm("¿Quieres quitar el bloqueo de este proyecto?");

    if (!confirmed) return;

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocked: false,
      }),
    });

    if (res.ok) {
      await loadProjects();
    } else {
      alert("No se pudo quitar el bloqueo del proyecto");
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
        (project.blockedReason ?? "").toLowerCase().includes(text) ||
        getProjectResponsibleNames(project).toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "TODOS" ||
        normalizeProjectStatus(project.status) === statusFilter;

      const matchesKpiFilter = matchesProjectQuickFilter(project, quickFilter);

      const matchesType = project.type === activeProjectType;

      return matchesSearch && matchesStatus && matchesKpiFilter && matchesType;
    });
  }, [projects, search, statusFilter, quickFilter, activeProjectType]);

  const projectsByType = projects.filter(
    (project) => project.type === activeProjectType,
  );
  const totalProjects = projectsByType.length;
  const openProjects = projectsByType.filter(isProjectOpen).length;
  const overdueProjects = projectsByType.filter(isProjectOverdue).length;
  const blockedProjects = projectsByType.filter(isProjectBlocked).length;
  const completedProjects = projectsByType.filter(isProjectCompleted).length;

  function resetForm() {
    setName("");
    setFolioPrefix("");
    setDescription("");
    setProjectType(activeProjectType);
    setStatus("ANALISIS");
    setResponsibleIds(users[0]?.id ? [users[0].id] : []);
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

    if (responsibleIds.length === 0) {
      alert("Selecciona al menos un responsable del proyecto.");
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
        type: projectType,
        status,
        ownerId: responsibleIds[0],
        responsibleIds,
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

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700"
                onClick={() => openBlockModal()}
              >
                + Registrar bloqueo
              </button>

              <button
                type="button"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                onClick={() => setShowProjectModal(true)}
              >
                + Nuevo proyecto
              </button>
            </div>
          </header>

          <nav
            aria-label="Filtrar proyectos por tipo"
            className="mb-6 grid gap-3 md:grid-cols-2"
          >
            {PROJECT_TYPE_OPTIONS.map((option) => {
              const isActive = activeProjectType === option.value;
              const count = projects.filter(
                (project) => project.type === option.value,
              ).length;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveProjectType(option.value);
                    setProjectType(option.value);
                    setQuickFilter("TOTAL");
                    setStatusFilter("TODOS");
                  }}
                  className={`flex min-h-16 items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    isActive
                      ? "border-blue-700 bg-blue-700 text-white shadow-blue-900/15"
                      : "border-slate-200 bg-white text-slate-950 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`ml-4 inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              title="Atrasadas"
              value={overdueProjects}
              subtitle="Proyectos atrasados"
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

            <KpiFilterCard
              title="Completadas"
              value={completedProjects}
              subtitle="Proyectos completados"
              filter="COMPLETADAS"
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

                {quickFilter === "BLOQUEADAS" ? (
                  <button
                    type="button"
                    className="mt-6 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
                    onClick={() => openBlockModal()}
                  >
                    + Registrar bloqueo
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                    onClick={() => setShowProjectModal(true)}
                  >
                    + Nuevo proyecto
                  </button>
                )}
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

                        {isProjectOverdue(project) ? (
                          <p className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            Atrasado desde {formatDate(project.estimatedEndDate)}
                          </p>
                        ) : null}

                        {isProjectBlocked(project) ? (
                          <div className="mt-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                            <p className="font-bold">
                              Bloqueado el {formatDate(project.blockedAt)}
                            </p>
                            <p className="mt-1 line-clamp-2">
                              {project.blockedReason || "Sin observación registrada"}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <StatusBadge status={project.status} />
                    </div>

                    <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Responsables</span>
                        <strong className="text-right text-slate-950">
                          {getProjectResponsibleNames(project)}
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

                        {isProjectBlocked(project) ? (
                          <button
                            type="button"
                            onClick={() => unblockProject(project.id)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-100"
                          >
                            Quitar bloqueo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBlockModal(project)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Bloquear
                          </button>
                        )}

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


      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <form
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
            onSubmit={handleBlockSubmit}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Registrar bloqueo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Selecciona el proyecto, captura la observación y la fecha del bloqueo.
                </p>
              </div>

              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-200"
                onClick={closeBlockModal}
              >
                ✕
              </button>
            </div>

            {blockError ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {blockError}
              </div>
            ) : null}

            <div className="grid gap-5">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Proyecto
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={blockProjectId}
                  onChange={(e) => {
                    const selectedProject = projects.find(
                      (project) => project.id === e.target.value
                    );

                    setBlockProjectId(e.target.value);
                    setBlockReason(selectedProject?.blockedReason ?? "");
                    setBlockDate(
                      toInputDate(selectedProject?.blockedAt) || getTodayInputDate()
                    );
                  }}
                  required
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.folio ? `${project.folio} - ` : ""}
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Observación del bloqueo
                </span>
                <textarea
                  className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Escribe por qué se bloqueó el proyecto..."
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Fecha de bloqueo
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  required
                />
              </label>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-70"
                  disabled={blockLoading || projects.length === 0}
                >
                  {blockLoading ? "Guardando..." : "Guardar bloqueo"}
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  onClick={closeBlockModal}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

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
                <fieldset>
                  <legend className="mb-2 block text-sm font-bold text-slate-700">
                    Responsables
                  </legend>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-3">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={responsibleIds.includes(user.id)}
                            onChange={(event) =>
                              setResponsibleIds((currentIds) =>
                                event.target.checked
                                  ? [...currentIds, user.id]
                                  : currentIds.filter((id) => id !== user.id),
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-800">
                            {user.name}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="px-2 py-2 text-sm text-slate-500">
                        No hay usuarios disponibles.
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Selecciona uno o varios. El primero será el responsable principal.
                  </p>
                </fieldset>

                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Tipo de proyecto
                    </span>
                    <select
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={projectType}
                      onChange={(e) =>
                        setProjectType(e.target.value as ProjectType)
                      }
                      required
                    >
                      {PROJECT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
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
