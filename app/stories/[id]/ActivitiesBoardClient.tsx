"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  WORKFLOW_STATUS_OPTIONS as statusOptions,
  getWorkflowStatusLabel,
  normalizeWorkflowStatus as normalizeActivityStatus,
} from "@/lib/statuses";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "LIDER" | "COLABORADOR";
};

type ActivityProgress = {
  id: string;
  comment: string;
  percentComplete?: number | null;
  hoursSpent?: number | null;
  createdAt: string;
  activityDate?: string | null;
  user?: User | null;
};

type StoryActivity = {
  id: string;
  folio?: string | null;
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
  activities?: ActivityProgress[];
};

type Story = {
  id: string;
  folio?: string | null;
  title: string;
  tasks?: StoryActivity[];
};

type Props = {
  initialStory: Story;
  users: User[];
};

const columns = [
  {
    value: "ANALISIS",
    title: "Análisis",
    description: "Levantamiento y entendimiento",
    dot: "bg-orange-400",
  },
  {
    value: "DISENO",
    title: "Diseño",
    description: "Definición de solución",
    dot: "bg-purple-500",
  },
  {
    value: "DESARROLLO_IMPLEMENTACION",
    title: "Desarrollo / implementación",
    description: "Construcción o configuración",
    dot: "bg-blue-500",
  },
  {
    value: "PRUEBAS",
    title: "Pruebas",
    description: "Validación funcional",
    dot: "bg-amber-500",
  },
  {
    value: "TRANSICION",
    title: "Transición",
    description: "Preparación para entrega",
    dot: "bg-cyan-500",
  },
  {
    value: "PUESTA_EN_MARCHA",
    title: "Puesta en marcha",
    description: "Liberación y cierre",
    dot: "bg-green-500",
  },
  {
    value: "CANCELADO",
    title: "Cancelado",
    description: "Requerimientos cancelados",
    dot: "bg-red-500",
  },
];

const priorityOptions = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

const emptyForm = {
  title: "",
  description: "",
  assignedToId: "",
  priority: "MEDIA",
  status: "ANALISIS",
  startDate: "",
  estimatedEndDate: "",
};

function formatDateForInput(date?: string | null) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function getStatusLabel(status: string) {
  return getWorkflowStatusLabel(status);
}

function getPriorityLabel(priority: string) {
  return (
    priorityOptions.find((option) => option.value === priority)?.label ??
    "Sin prioridad"
  );
}

export default function ActivitiesBoardClient({ initialStory, users }: Props) {
  const [story, setStory] = useState<Story>(initialStory);

  const [currentUserId, setCurrentUserId] = useState(() => {
    const admin = users.find((user) => user.role === "ADMIN");
    return admin?.id ?? users[0]?.id ?? "";
  });

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null
  );

  const [editForm, setEditForm] = useState(emptyForm);

  const currentUser = users.find((user) => user.id === currentUserId);
  const isAdmin = currentUser?.role === "ADMIN";
  const activities = story.tasks ?? [];

  const activitiesByStatus = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      activities: activities.filter(
        (activity) => normalizeActivityStatus(activity.status) === column.value
      ),
    }));
  }, [activities]);

  async function reloadStory() {
    const res = await fetch(`/api/stories/${story.id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      alert("No se pudo recargar la historia.");
      return;
    }

    const data = await res.json();
    setStory(data);
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function createActivity(e: FormEvent) {
    e.preventDefault();

    if (!currentUserId) {
      alert("Selecciona el usuario actual.");
      return;
    }

    if (!form.title.trim()) {
      alert("Escribe el título del requerimiento.");
      return;
    }

    setCreating(true);

    const res = await fetch(`/api/stories/${story.id}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        assignedToId: form.assignedToId || null,
        priority: form.priority,
        status: form.status,
        startDate: form.startDate || null,
        estimatedEndDate: form.estimatedEndDate || null,
        createdById: currentUserId,
      }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "No se pudo crear el requerimiento.");
      return;
    }

    resetForm();
    setShowActivityModal(false);
    await reloadStory();
  }

  function startEditing(activity: StoryActivity) {
    setEditingActivityId(activity.id);

    setEditForm({
      title: activity.title,
      description: activity.description ?? "",
      assignedToId: activity.assignedToId ?? activity.assignedTo?.id ?? "",
      priority: activity.priority,
      status: normalizeActivityStatus(activity.status),
      startDate: formatDateForInput(activity.startDate),
      estimatedEndDate: formatDateForInput(activity.estimatedEndDate),
    });
  }

  function cancelEditing() {
    setEditingActivityId(null);
    setEditForm(emptyForm);
  }

  async function updateActivity(activityId: string) {
    if (!editForm.title.trim()) {
      alert("Escribe el título del requerimiento.");
      return;
    }

    const res = await fetch(`/api/tasks/${activityId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description,
        assignedToId: editForm.assignedToId || null,
        priority: editForm.priority,
        status: editForm.status,
        startDate: editForm.startDate || null,
        estimatedEndDate: editForm.estimatedEndDate || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "No se pudo actualizar el requerimiento.");
      return;
    }

    cancelEditing();
    await reloadStory();
  }

  async function changeActivityStatus(
    activity: StoryActivity,
    newStatus: string
  ) {
    setUpdatingStatusId(activity.id);

    const res = await fetch(`/api/tasks/${activity.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: activity.title,
        description: activity.description ?? "",
        assignedToId: activity.assignedToId ?? activity.assignedTo?.id ?? null,
        priority: activity.priority,
        status: newStatus,
        startDate: formatDateForInput(activity.startDate) || null,
        estimatedEndDate: formatDateForInput(activity.estimatedEndDate) || null,
      }),
    });

    setUpdatingStatusId(null);

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "No se pudo actualizar el estatus.");
      return;
    }

    setStory((prevStory) => ({
      ...prevStory,
      tasks: (prevStory.tasks ?? []).map((item) =>
        item.id === activity.id ? { ...item, status: newStatus } : item
      ),
    }));
  }

  async function deleteActivity(activityId: string) {
    if (!currentUserId) {
      alert("Selecciona el usuario actual.");
      return;
    }

    if (!isAdmin) {
      alert("Solo el administrador puede eliminar requerimientos.");
      return;
    }

    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este requerimiento?"
    );

    if (!confirmed) return;

    const res = await fetch(`/api/tasks/${activityId}?userId=${currentUserId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "No se pudo eliminar el requerimiento.");
      return;
    }

    await reloadStory();
  }

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Tablero de requerimientos funcionales y/o no funcionales
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Seguimiento de requerimientos funcionales y/o no funcionales relacionados con esta historia de
              usuario.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowActivityModal(true)}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              + Nuevo requerimiento
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1740px] grid-cols-7 gap-4">
            {activitiesByStatus.map((column) => (
              <section
                key={column.value}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${column.dot}`} />
                      <h3 className="font-bold text-slate-950">
                        {column.title}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {column.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                    {column.activities.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {column.activities.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">
                      Sin requerimientos
                    </div>
                  ) : (
                    column.activities.map((activity) => (
                      <article
                        key={activity.id}
                        id={`requirement-${activity.id}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {editingActivityId === activity.id ? (
                          <div className="grid gap-3">
                            <input
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  title: e.target.value,
                                })
                              }
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              placeholder="Título"
                            />

                            <textarea
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  description: e.target.value,
                                })
                              }
                              className="min-h-20 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              placeholder="Descripción"
                            />

                            <select
                              value={editForm.assignedToId}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  assignedToId: e.target.value,
                                })
                              }
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="">Sin responsable</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={editForm.priority}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  priority: e.target.value,
                                })
                              }
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              {priorityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <select
                              value={editForm.status}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  status: e.target.value,
                                })
                              }
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                type="date"
                                value={editForm.startDate}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    startDate: e.target.value,
                                  })
                                }
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />

                              <input
                                type="date"
                                value={editForm.estimatedEndDate}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    estimatedEndDate: e.target.value,
                                  })
                                }
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => updateActivity(activity.id)}
                                className="flex-1 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                              >
                                Guardar
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="flex-1 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4">
                              <span className="mb-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                                {activity.folio ?? "Sin folio"}
                              </span>

                              <h4 className="text-sm font-bold leading-5 text-slate-950">
                                {activity.title}
                              </h4>

                              <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-500">
                                {activity.description || "Sin descripción"}
                              </p>
                            </div>

                            <div className="mb-4 rounded-2xl bg-slate-50 p-3">
                              <p className="text-xs font-medium text-slate-500">
                                Responsable
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-950">
                                {activity.assignedTo?.name || "Sin asignar"}
                              </p>

                              <div className="mt-3 grid gap-2 text-xs text-slate-600">
                                <p>
                                  <span className="font-bold">Prioridad:</span>{" "}
                                  {getPriorityLabel(activity.priority)}
                                </p>
                                <p>
                                  <span className="font-bold">Estatus:</span>{" "}
                                  {getStatusLabel(activity.status)}
                                </p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <label className="mb-1 block text-xs font-bold text-slate-500">
                                Modificar estatus
                              </label>

                              <select
                                value={normalizeActivityStatus(activity.status)}
                                disabled={updatingStatusId === activity.id}
                                onChange={(e) =>
                                  changeActivityStatus(
                                    activity,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                              >
                                {statusOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(activity)}
                                className="flex-1 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                              >
                                Editar
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => deleteActivity(activity.id)}
                                  className="flex-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <form
            onSubmit={createActivity}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Nuevo requerimiento
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Captura un requerimiento funcional o no funcional dentro de esta historia de usuario.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowActivityModal(false);
                }}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="grid gap-5">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Título
                </span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Descripción
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  rows={4}
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Responsable
                  </span>
                  <select
                    value={form.assignedToId}
                    onChange={(e) =>
                      setForm({ ...form, assignedToId: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Sin responsable</option>
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
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    Prioridad
                  </span>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    Usuario actual
                  </span>
                  <select
                    value={currentUserId}
                    onChange={(e) => setCurrentUserId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Fecha inicio
                  </span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Fecha fin
                  </span>
                  <input
                    type="date"
                    value={form.estimatedEndDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedEndDate: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70"
                >
                  {creating ? "Guardando..." : "Crear requerimiento"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowActivityModal(false);
                  }}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
