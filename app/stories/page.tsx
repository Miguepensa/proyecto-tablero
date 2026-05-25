"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "LIDER" | "COLABORADOR";
};

type Project = {
  id: string;
  name: string;
};

type Story = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  projectId: string;
  assignedToId?: string | null;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  project?: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
};

const priorityOptions = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

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

function normalizeStoryStatus(status?: string | null) {
  if (!status) return "ANALISIS";

  if (status === "BACKLOG") return "ANALISIS";
  if (status === "PENDIENTE") return "ANALISIS";
  if (status === "EN_PROGRESO") return "DESARROLLO_IMPLEMENTACION";
  if (status === "REVISION") return "PRUEBAS";
  if (status === "BLOQUEADO") return "TRANSICION";
  if (status === "CANCELADO") return "TRANSICION";
  if (status === "TERMINADO") return "PUESTA_EN_MARCHA";

  return status;
}

function getStatusLabel(status: string) {
  const normalizedStatus = normalizeStoryStatus(status);

  return (
    statusOptions.find((option) => option.value === normalizedStatus)?.label ??
    normalizedStatus
  );
}

function getPriorityLabel(priority: string) {
  return (
    priorityOptions.find((option) => option.value === priority)?.label ??
    priority
  );
}

function getStatusClasses(status: string) {
  const normalizedStatus = normalizeStoryStatus(status);

  if (normalizedStatus === "PUESTA_EN_MARCHA") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (normalizedStatus === "DESARROLLO_IMPLEMENTACION") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalizedStatus === "DISENO") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalizedStatus === "PRUEBAS") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "TRANSICION") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (normalizedStatus === "ANALISIS") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getPriorityClasses(priority: string) {
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
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

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [status, setStatus] = useState("ANALISIS");
  const [projectId, setProjectId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [actualEndDate, setActualEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [priorityFilter, setPriorityFilter] = useState("TODOS");

  const currentUser = users.find((user) => user.id === currentUserId);
  const isAdmin = currentUser?.role === "ADMIN";

  async function loadStories() {
    const res = await fetch("/api/stories", {
      cache: "no-store",
    });

    const data = await res.json();
    setStories(data);
  }

  async function loadUsers() {
    const res = await fetch("/api/users", {
      cache: "no-store",
    });

    const data = await res.json();
    setUsers(data);

    if (data.length > 0) {
      if (!assignedToId) {
        setAssignedToId(data[0].id);
      }

      if (!currentUserId) {
        const adminUser =
          data.find((user: User) => user.role === "ADMIN") ?? data[0];

        setCurrentUserId(adminUser.id);
      }
    }
  }

  async function loadProjects() {
    const res = await fetch("/api/projects", {
      cache: "no-store",
    });

    const data = await res.json();
    setProjects(data);

    if (data.length > 0 && !projectId) {
      setProjectId(data[0].id);
    }
  }

  async function deleteStory(storyId: string) {
    if (!currentUserId) {
      alert("Selecciona un usuario actual.");
      return;
    }

    if (!isAdmin) {
      alert("Solo el administrador puede eliminar historias.");
      return;
    }

    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar esta historia de usuario?"
    );

    if (!confirmed) return;

    const res = await fetch(`/api/stories/${storyId}?userId=${currentUserId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await loadStories();
    } else {
      const data = await res.json();
      alert(data.error ?? "No se pudo eliminar la historia");
    }
  }

  useEffect(() => {
    loadStories();
    loadUsers();
    loadProjects();
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const text = search.toLowerCase();

      const matchesSearch =
        story.title.toLowerCase().includes(text) ||
        (story.description ?? "").toLowerCase().includes(text) ||
        (story.project?.name ?? "").toLowerCase().includes(text) ||
        (story.assignedTo?.name ?? "").toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "TODOS" || normalizeStoryStatus(story.status) === statusFilter;

      const matchesPriority =
        priorityFilter === "TODOS" || story.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [stories, search, statusFilter, priorityFilter]);

  const totalStories = stories.length;
  const analysisStories = stories.filter(
    (story) => normalizeStoryStatus(story.status) === "ANALISIS"
  ).length;
  const designStories = stories.filter(
    (story) => normalizeStoryStatus(story.status) === "DISENO"
  ).length;
  const developmentStories = stories.filter(
    (story) =>
      normalizeStoryStatus(story.status) === "DESARROLLO_IMPLEMENTACION"
  ).length;
  const testingStories = stories.filter(
    (story) => normalizeStoryStatus(story.status) === "PRUEBAS"
  ).length;
  const transitionStories = stories.filter(
    (story) => normalizeStoryStatus(story.status) === "TRANSICION"
  ).length;
  const goLiveStories = stories.filter(
    (story) => normalizeStoryStatus(story.status) === "PUESTA_EN_MARCHA"
  ).length;

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("MEDIA");
    setStatus("ANALISIS");
    setStartDate("");
    setEstimatedEndDate("");
    setActualEndDate("");
  }

  function closeStoryModal() {
    resetForm();
    setEditingStoryId(null);
    setShowStoryModal(false);
  }

  function openCreateStoryModal() {
    resetForm();
    setEditingStoryId(null);
    setShowStoryModal(true);
  }

  function startEditingStory(story: Story) {
    setEditingStoryId(story.id);
    setTitle(story.title);
    setDescription(story.description ?? "");
    setPriority(story.priority);
    setStatus(normalizeStoryStatus(story.status));
    setProjectId(story.projectId);
    setAssignedToId(story.assignedToId ?? "");
    setStartDate(formatDateForInput(story.startDate));
    setEstimatedEndDate(formatDateForInput(story.estimatedEndDate));
    setActualEndDate(formatDateForInput(story.actualEndDate));
    setShowStoryModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUserId) {
      alert("Selecciona un usuario actual.");
      return;
    }

    if (editingStoryId && !isAdmin) {
      alert("Solo el administrador puede modificar historias.");
      return;
    }

    setLoading(true);

    const isEditing = Boolean(editingStoryId);

    const payload = {
      title,
      description,
      priority,
      status,
      projectId,
      assignedToId: assignedToId || null,
      startDate: startDate || null,
      estimatedEndDate: estimatedEndDate || null,
      actualEndDate: actualEndDate || null,
    };

    const res = await fetch(
      isEditing
        ? `/api/stories/${editingStoryId}?userId=${currentUserId}`
        : "/api/stories",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? payload
            : {
                ...payload,
                createdById: currentUserId || assignedToId,
              }
        ),
      }
    );

    setLoading(false);

    if (res.ok) {
      closeStoryModal();
      await loadStories();
      return;
    }

    const data = await res.json().catch(() => null);
    alert(
      data?.error ??
        (isEditing
          ? "No se pudo actualizar la historia"
          : "No se pudo crear la historia")
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Desarrollo
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Historias de usuario
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Administra historias, responsables, prioridades, estados y fechas.
              </p>
            </div>

            <button
              type="button"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
              onClick={openCreateStoryModal}
            >
              + Nueva historia
            </button>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total"
              value={totalStories}
              subtitle="Historias registradas"
            />

            <SummaryCard
              title="Análisis"
              value={analysisStories}
              subtitle="Historias en análisis"
            />

            <SummaryCard
              title="Diseño"
              value={designStories}
              subtitle="Historias en diseño"
            />

            <SummaryCard
              title="Desarrollo / implementación"
              value={developmentStories}
              subtitle="Historias en desarrollo"
            />

            <SummaryCard
              title="Pruebas"
              value={testingStories}
              subtitle="Historias en validación"
            />

            <SummaryCard
              title="Transición"
              value={transitionStories}
              subtitle="Historias en transición"
            />

            <SummaryCard
              title="Puesta en marcha"
              value={goLiveStories}
              subtitle="Historias listas o liberadas"
            />
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Lista de historias
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredStories.length} historia(s) encontradas.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-72"
                  placeholder="Buscar historia..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="TODOS">Todas las prioridades</option>
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredStories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">
                  No hay historias para mostrar
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Crea una nueva historia o ajusta los filtros de búsqueda.
                </p>

                <button
                  type="button"
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  onClick={openCreateStoryModal}
                >
                  + Nueva historia
                </button>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredStories.map((story) => (
                  <article
                    key={story.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-950">
                          {story.title}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {story.description || "Sin descripción"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <PriorityBadge priority={story.priority} />
                        <StatusBadge status={story.status} />
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Proyecto</span>
                        <strong className="text-right text-slate-950">
                          {story.project?.name || "Sin proyecto"}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Asignado a</span>
                        <strong className="text-right text-slate-950">
                          {story.assignedTo?.name || "Sin asignar"}
                        </strong>
                      </div>

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

                    <div className="mt-5 flex flex-col justify-end gap-3 sm:flex-row">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => startEditingStory(story)}
                          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-700 hover:bg-amber-100"
                        >
                          Editar
                        </button>
                      )}

                      <Link
                        href={`/projects/${story.projectId}`}
                        className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Ver proyecto
                      </Link>

                      <Link
                        href={`/stories/${story.id}`}
                        className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-center text-sm font-bold text-blue-700 hover:bg-blue-100"
                      >
                        Ver actividades
                      </Link>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => deleteStory(story.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-center text-sm font-bold text-red-700 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <form
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onSubmit={handleSubmit}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  {editingStoryId ? "Editar historia" : "Nueva historia"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingStoryId
                    ? "Modifica la información principal de la historia de usuario."
                    : "Captura la información principal de la historia de usuario."}
                </p>
              </div>

              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-200"
                onClick={closeStoryModal}
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Usuario actual
                </span>
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
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Título
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

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
                    Prioridad
                  </span>
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

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Estado
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={normalizeStoryStatus(status)}
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
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Proyecto
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Asignado a
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.email}
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
                  {loading
                    ? "Guardando..."
                    : editingStoryId
                    ? "Guardar cambios"
                    : "Crear historia"}
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  onClick={closeStoryModal}
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