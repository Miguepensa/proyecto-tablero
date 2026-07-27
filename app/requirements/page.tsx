"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import KpiFilterCard from "@/components/KpiFilterCard";
import type { QuickFilter } from "@/lib/kpiFilters";
import {
  WORKFLOW_STATUS_OPTIONS as statusOptions,
  getWorkflowStatusClasses as getStatusClasses,
  getWorkflowStatusLabel as getStatusLabel,
  isClosedStatus,
  isCompletedStatus,
  normalizeWorkflowStatus as normalizeStatus,
} from "@/lib/statuses";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "LIDER" | "COLABORADOR";
};

type Project = {
  id: string;
  name: string;
  folio?: string | null;
};

type Story = {
  id: string;
  folio?: string | null;
  title: string;
  projectId: string;
  project?: Project | null;
};

type Requirement = {
  id: string;
  folio?: string | null;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  blocked?: boolean | null;
  userStoryId?: string | null;
  assignedToId?: string | null;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  userStory?: Story | null;
  story?: Story | null;
  assignedTo?: User | null;
  createdBy?: User | null;
};

const priorityOptions = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

const boardStyles: Record<
  string,
  {
    description: string;
    dot: string;
  }
> = {
  ANALISIS: {
    description: "Etapa de análisis",
    dot: "bg-blue-500",
  },
  DISENO: {
    description: "Etapa de diseño",
    dot: "bg-cyan-500",
  },
  DESARROLLO_IMPLEMENTACION: {
    description: "Etapa de desarrollo e implementación",
    dot: "bg-blue-600",
  },
  PRUEBAS: {
    description: "Etapa de pruebas",
    dot: "bg-purple-500",
  },
  TRANSICION: {
    description: "Etapa de transición",
    dot: "bg-amber-500",
  },
  PUESTA_EN_MARCHA: {
    description: "Etapa final o liberación",
    dot: "bg-green-500",
  },
  CANCELADO: {
    description: "Requerimiento cancelado",
    dot: "bg-red-500",
  },
};

function getPriorityLabel(priority: string) {
  return (
    priorityOptions.find((option) => option.value === priority)?.label ??
    priority
  );
}

function getPriorityClasses(priority: string) {
  if (priority === "CRITICA") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "ALTA") return "border-orange-200 bg-orange-50 text-orange-700";
  if (priority === "MEDIA") return "border-blue-200 bg-blue-50 text-blue-700";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

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

function formatDateForInput(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function getStoryFromRequirement(requirement: Requirement) {
  return requirement.userStory ?? requirement.story ?? null;
}

function isClosedRequirement(requirement: Requirement) {
  return isClosedStatus(requirement.status);
}

function isCompletedRequirement(requirement: Requirement) {
  return (
    Boolean(requirement.actualEndDate) ||
    isCompletedStatus(requirement.status) ||
    requirement.status === "COMPLETADO" ||
    requirement.status === "COMPLETED" ||
    requirement.status === "CERRADO" ||
    requirement.status === "FINALIZADO"
  );
}

function isOpenRequirement(requirement: Requirement) {
  return !isClosedRequirement(requirement);
}

function isBlockedRequirement(requirement: Requirement) {
  const rawStatus = (requirement.status ?? "").toUpperCase();

  return rawStatus === "BLOQUEADO" || requirement.blocked === true;
}

function isOverdueRequirement(requirement: Requirement) {
  if (isClosedRequirement(requirement)) return false;
  if (requirement.actualEndDate) return false;
  if (!requirement.estimatedEndDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(requirement.estimatedEndDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function matchesRequirementQuickFilter(
  requirement: Requirement,
  quickFilter: QuickFilter,
) {
  if (quickFilter === "TOTAL") return true;
  if (quickFilter === "ABIERTAS") return isOpenRequirement(requirement);
  if (quickFilter === "VENCIDAS") return isOverdueRequirement(requirement);
  if (quickFilter === "BLOQUEADAS") return isBlockedRequirement(requirement);
  if (quickFilter === "COMPLETADAS") return isCompletedRequirement(requirement);

  return true;
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
          className="block rounded-2xl bg-white px-4 py-3 text-slate-950"
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${getStatusClasses(
        status,
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${getPriorityClasses(
        priority,
      )}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [storyFilter, setStoryFilter] = useState("TODOS");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("TOTAL");

  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [status, setStatus] = useState("ANALISIS");
  const [storyId, setStoryId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");

  const currentUser = users.find((user) => user.id === currentUserId);
  const isAdmin = currentUser?.role === "ADMIN";

  async function loadRequirements() {
    const res = await fetch("/api/tasks", {
      cache: "no-store",
    });

    if (!res.ok) {
      alert("No se pudieron cargar los requerimientos.");
      return;
    }

    const data = await res.json();
    setRequirements(Array.isArray(data) ? data : []);
  }

  async function loadStories() {
    const res = await fetch("/api/stories", {
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    const items: Story[] = Array.isArray(data) ? data : [];
    setStories(items);

    if (items.length > 0 && !storyId) {
      setStoryId(items[0].id);
    }
  }

  async function loadUsers() {
    const res = await fetch("/api/users", {
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    const items: User[] = Array.isArray(data) ? data : [];
    setUsers(items);

    if (items.length > 0) {
      const adminUser = items.find((user: User) => user.role === "ADMIN") ?? items[0];

      if (!currentUserId) {
        setCurrentUserId(adminUser.id);
      }

      if (!assignedToId) {
        setAssignedToId(items[0].id);
      }
    }
  }

  useEffect(() => {
    loadRequirements();
    loadStories();
    loadUsers();
  }, []);

  const baseFilteredRequirements = useMemo(() => {
    return requirements.filter((requirement) => {
      const story = getStoryFromRequirement(requirement);
      const project = story?.project;
      const text = search.toLowerCase();

      const matchesSearch =
        requirement.title.toLowerCase().includes(text) ||
        (requirement.folio ?? "").toLowerCase().includes(text) ||
        (requirement.description ?? "").toLowerCase().includes(text) ||
        (story?.title ?? "").toLowerCase().includes(text) ||
        (story?.folio ?? "").toLowerCase().includes(text) ||
        (project?.name ?? "").toLowerCase().includes(text) ||
        (requirement.assignedTo?.name ?? "").toLowerCase().includes(text);

      const matchesStory =
        storyFilter === "TODOS" || story?.id === storyFilter || requirement.userStoryId === storyFilter;

      const matchesQuickFilter = matchesRequirementQuickFilter(requirement, quickFilter);

      return matchesSearch && matchesStory && matchesQuickFilter;
    });
  }, [requirements, search, storyFilter, quickFilter]);

  const filteredRequirements = useMemo(() => {
    return baseFilteredRequirements.filter((requirement) => {
      return statusFilter === "TODOS" || normalizeStatus(requirement.status) === statusFilter;
    });
  }, [baseFilteredRequirements, statusFilter]);

  const totalRequirements = requirements.length;
  const openRequirements = requirements.filter(isOpenRequirement).length;
  const overdueRequirements = requirements.filter(isOverdueRequirement).length;
  const blockedRequirements = requirements.filter(isBlockedRequirement).length;
  const completedRequirements = requirements.filter(isCompletedRequirement).length;

  function handleQuickFilterClick(filter: QuickFilter) {
    setQuickFilter(filter);
    setStatusFilter("TODOS");
  }

  function getBoardRequirementsByStatus(statusValue: string) {
    return baseFilteredRequirements.filter(
      (requirement) => normalizeStatus(requirement.status) === statusValue,
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("MEDIA");
    setStatus("ANALISIS");
    setStoryId(stories[0]?.id ?? "");
    setAssignedToId(users[0]?.id ?? "");
    setStartDate("");
    setEstimatedEndDate("");
  }

  function openCreateRequirementModal(preselectedStoryId?: string) {
    resetForm();
    setEditingRequirementId(null);
    setStoryId(preselectedStoryId ?? stories[0]?.id ?? "");
    setShowRequirementModal(true);
  }

  function startEditingRequirement(requirement: Requirement) {
    const story = getStoryFromRequirement(requirement);

    setEditingRequirementId(requirement.id);
    setTitle(requirement.title);
    setDescription(requirement.description ?? "");
    setPriority(requirement.priority ?? "MEDIA");
    setStatus(normalizeStatus(requirement.status));
    setStoryId(story?.id ?? requirement.userStoryId ?? "");
    setAssignedToId(requirement.assignedToId ?? requirement.assignedTo?.id ?? "");
    setStartDate(formatDateForInput(requirement.startDate));
    setEstimatedEndDate(formatDateForInput(requirement.estimatedEndDate));
    setShowRequirementModal(true);
  }

  function closeRequirementModal() {
    resetForm();
    setEditingRequirementId(null);
    setShowRequirementModal(false);
  }

  async function handleRequirementSubmit(e: FormEvent) {
    e.preventDefault();

    if (!currentUserId) {
      alert("Selecciona un usuario actual.");
      return;
    }

    if (!editingRequirementId && !storyId) {
      alert("Selecciona la historia de usuario.");
      return;
    }

    if (!title.trim()) {
      alert("Escribe el título del requerimiento.");
      return;
    }

    setLoading(true);

    const payload = {
      title,
      description,
      assignedToId: assignedToId || null,
      priority,
      status,
      startDate: startDate || null,
      estimatedEndDate: estimatedEndDate || null,
    };

    const res = await fetch(
      editingRequirementId
        ? `/api/tasks/${editingRequirementId}`
        : `/api/stories/${storyId}/tasks`,
      {
        method: editingRequirementId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingRequirementId
            ? payload
            : {
                ...payload,
                createdById: currentUserId,
              },
        ),
      },
    );

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(
        data?.error ??
          (editingRequirementId
            ? "No se pudo actualizar el requerimiento."
            : "No se pudo crear el requerimiento."),
      );
      return;
    }

    closeRequirementModal();
    await loadRequirements();
  }

  async function changeRequirementStatus(requirement: Requirement, newStatus: string) {
    const res = await fetch(`/api/tasks/${requirement.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: requirement.title,
        description: requirement.description ?? "",
        assignedToId: requirement.assignedToId ?? requirement.assignedTo?.id ?? null,
        priority: requirement.priority,
        status: newStatus,
        startDate: formatDateForInput(requirement.startDate) || null,
        estimatedEndDate: formatDateForInput(requirement.estimatedEndDate) || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo actualizar el estado.");
      return;
    }

    setRequirements((prevRequirements) =>
      prevRequirements.map((item) =>
        item.id === requirement.id ? { ...item, status: newStatus } : item,
      ),
    );
  }

  async function deleteRequirement(requirementId: string) {
    if (!currentUserId) {
      alert("Selecciona un usuario actual.");
      return;
    }

    if (!isAdmin) {
      alert("Solo el administrador puede eliminar requerimientos.");
      return;
    }

    const confirmed = window.confirm("¿Seguro que deseas eliminar este requerimiento?");

    if (!confirmed) return;

    const res = await fetch(`/api/tasks/${requirementId}?userId=${currentUserId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar el requerimiento.");
      return;
    }

    await loadRequirements();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-5 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Gestión
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                Requerimientos
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Consulta y crea requerimientos de todas las historias de usuario en un solo lugar.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              onClick={() => openCreateRequirementModal()}
            >
              + Nuevo requerimiento
            </button>
          </header>

          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <KpiFilterCard
              title="Total"
              value={totalRequirements}
              subtitle="Requerimientos registrados"
              filter="TOTAL"
              activeFilter={quickFilter}
              onClick={handleQuickFilterClick}
            />

            <KpiFilterCard
              title="Abiertas"
              value={openRequirements}
              subtitle="Pendientes o en proceso"
              filter="ABIERTAS"
              activeFilter={quickFilter}
              onClick={handleQuickFilterClick}
            />

            <KpiFilterCard
              title="Vencidas"
              value={overdueRequirements}
              subtitle="Requerimientos vencidos"
              filter="VENCIDAS"
              activeFilter={quickFilter}
              onClick={handleQuickFilterClick}
            />

            <KpiFilterCard
              title="Bloqueadas"
              value={blockedRequirements}
              subtitle="Requerimientos bloqueados"
              filter="BLOQUEADAS"
              activeFilter={quickFilter}
              onClick={handleQuickFilterClick}
            />

            <KpiFilterCard
              title="Completadas"
              value={completedRequirements}
              subtitle="Requerimientos completados"
              filter="COMPLETADAS"
              activeFilter={quickFilter}
              onClick={handleQuickFilterClick}
            />
          </div>

          <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Tablero de requerimientos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Selecciona una columna para filtrar la lista. Las columnas tienen scroll propio.
                </p>
              </div>

              {statusFilter !== "TODOS" && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("TODOS")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-white"
                >
                  Limpiar estado
                </button>
              )}
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[1160px] grid-cols-7 gap-3">
                {statusOptions.map((option) => {
                  const columnRequirements = getBoardRequirementsByStatus(option.value);
                  const meta = boardStyles[option.value];
                  const activeColumn = statusFilter === option.value;

                  return (
                    <section
                      key={option.value}
                      className={`max-h-[560px] rounded-2xl border bg-slate-50 p-3 transition ${
                        activeColumn ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setStatusFilter(option.value)}
                        className="mb-3 flex w-full items-start justify-between gap-3 rounded-xl p-1 text-left transition hover:bg-white"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
                            <h3 className="text-sm font-black leading-5 text-slate-950">
                              {option.label}
                            </h3>
                          </div>

                          <p className="mt-1 text-[11px] leading-4 text-slate-500">
                            {meta.description}
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                          {columnRequirements.length}
                        </span>
                      </button>

                      {columnRequirements.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-xs text-slate-400">
                          Sin requerimientos
                        </div>
                      ) : (
                        <div className="max-h-[455px] space-y-2 overflow-y-auto pr-1">
                          {columnRequirements.map((requirement) => {
                            const story = getStoryFromRequirement(requirement);

                            return (
                              <article
                                key={requirement.id}
                                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                              >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h4 className="line-clamp-2 text-xs font-black leading-5 text-slate-950">
                                      {requirement.title}
                                    </h4>
                                  </div>

                                  <PriorityBadge priority={requirement.priority} />
                                </div>

                                <p className="line-clamp-3 text-[11px] leading-4 text-slate-500">
                                  {requirement.description || "Sin descripción"}
                                </p>

                                <p className="mt-2 truncate text-[11px] text-slate-500">
                                  HU: {story?.title || "Sin historia"}
                                </p>

                                <div className="mt-3 grid gap-2">
                                  <select
                                    value={normalizeStatus(requirement.status)}
                                    onChange={(e) => changeRequirementStatus(requirement, e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  >
                                    {statusOptions.map((statusOption) => (
                                      <option key={statusOption.value} value={statusOption.value}>
                                        {statusOption.label}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => startEditingRequirement(requirement)}
                                    className="rounded-xl bg-blue-600 px-3 py-2 text-center text-[11px] font-black text-white hover:bg-blue-700"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Lista de requerimientos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredRequirements.length} requerimiento(s) encontrados.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-64"
                  placeholder="Buscar requerimiento, historia o proyecto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="TODOS">Todos los estados</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  value={storyFilter}
                  onChange={(e) => setStoryFilter(e.target.value)}
                >
                  <option value="TODOS">Todas las historias</option>
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.folio ? `${story.folio} - ` : ""}
                      {story.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRequirements.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-lg font-bold text-slate-950">No hay requerimientos para mostrar</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Crea un requerimiento nuevo o ajusta los filtros de búsqueda.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  onClick={() => openCreateRequirementModal()}
                >
                  + Nuevo requerimiento
                </button>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredRequirements.map((requirement) => {
                  const story = getStoryFromRequirement(requirement);
                  const project = story?.project;

                  return (
                    <article
                      key={requirement.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
                            {requirement.folio ?? "Sin folio"}
                          </span>

                          <h3 className="mt-2 truncate text-base font-black text-slate-950">
                            {requirement.title}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {requirement.description || "Sin descripción"}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <PriorityBadge priority={requirement.priority} />
                          <StatusBadge status={requirement.status} />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs sm:grid-cols-3">
                        <div className="min-w-0">
                          <span className="text-slate-500">Proyecto</span>
                          <strong className="mt-1 block truncate text-slate-950">
                            {project?.name || "Sin proyecto"}
                          </strong>
                        </div>

                        <div className="min-w-0">
                          <span className="text-slate-500">Historia</span>
                          <strong className="mt-1 block truncate text-slate-950">
                            {story?.title || "Sin historia"}
                          </strong>
                        </div>

                        <div className="min-w-0">
                          <span className="text-slate-500">Asignado</span>
                          <strong className="mt-1 block truncate text-slate-950">
                            {requirement.assignedTo?.name || "Sin asignar"}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <select
                          value={normalizeStatus(requirement.status)}
                          onChange={(e) => changeRequirementStatus(requirement, e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex flex-wrap justify-end gap-2">
                          {story?.id && (
                            <Link
                              href={`/stories/${story.id}`}
                              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-100"
                            >
                              Ver tablero
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => startEditingRequirement(requirement)}
                            className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700 hover:bg-amber-100"
                          >
                            Editar
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => deleteRequirement(requirement.id)}
                              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-100"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Fin estimado: {formatDate(requirement.estimatedEndDate)}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>

      {showRequirementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <form
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onSubmit={handleRequirementSubmit}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  {editingRequirementId ? "Editar requerimiento" : "Nuevo requerimiento"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingRequirementId
                    ? "Modifica la información principal del requerimiento."
                    : "Captura un requerimiento y asígnalo a una historia de usuario."}
                </p>
              </div>

              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-200"
                onClick={closeRequirementModal}
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Usuario actual</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar usuario actual</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Historia de usuario</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                  value={storyId}
                  onChange={(e) => setStoryId(e.target.value)}
                  required
                  disabled={Boolean(editingRequirementId)}
                >
                  <option value="">Seleccionar historia</option>
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.folio ? `${story.folio} - ` : ""}
                      {story.title}
                    </option>
                  ))}
                </select>
                {editingRequirementId && (
                  <p className="mt-2 text-xs text-slate-500">
                    Para moverlo a otra historia, crea un nuevo requerimiento en la historia correcta.
                  </p>
                )}
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Título</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Descripción</span>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Responsable</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                  >
                    <option value="">Sin responsable</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Estado</span>
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

              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Prioridad</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">Inicio</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">Fin estimado</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      type="date"
                      value={estimatedEndDate}
                      onChange={(e) => setEstimatedEndDate(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading
                    ? "Guardando..."
                    : editingRequirementId
                      ? "Guardar cambios"
                      : "Crear requerimiento"}
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  onClick={closeRequirementModal}
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
