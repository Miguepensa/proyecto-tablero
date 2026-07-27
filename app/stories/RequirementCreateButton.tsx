"use client";

import { useEffect, useState, type FormEvent } from "react";
import { WORKFLOW_STATUS_OPTIONS as statusOptions } from "@/lib/statuses";

type User = {
  id: string;
  name: string;
  email: string;
  role?: "ADMIN" | "LIDER" | "COLABORADOR";
};

type StoryOption = {
  id: string;
  title: string;
  folio?: string | null;
};

type Props = {
  story: StoryOption;
  users: User[];
  className?: string;
  onCreated?: () => void | Promise<void>;
};

const priorityOptions = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

export default function RequirementCreateButton({ story, users, className, onCreated }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [status, setStatus] = useState("ANALISIS");
  const [assignedToId, setAssignedToId] = useState(users[0]?.id ?? "");
  const [currentUserId, setCurrentUserId] = useState(() => {
    const adminUser = users.find((user) => user.role === "ADMIN");
    return adminUser?.id ?? users[0]?.id ?? "";
  });
  const [startDate, setStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");

  useEffect(() => {
    if (users.length === 0) return;

    const adminUser = users.find((user) => user.role === "ADMIN") ?? users[0];

    if (!currentUserId) {
      setCurrentUserId(adminUser.id);
    }

    if (!assignedToId) {
      setAssignedToId(users[0].id);
    }
  }, [users, currentUserId, assignedToId]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("MEDIA");
    setStatus("ANALISIS");
    setAssignedToId(users[0]?.id ?? "");
    setStartDate("");
    setEstimatedEndDate("");
  }

  function closeModal() {
    resetForm();
    setShowModal(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!currentUserId) {
      alert("Selecciona un usuario actual.");
      return;
    }

    if (!title.trim()) {
      alert("Escribe el título del requerimiento.");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/stories/${story.id}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        assignedToId: assignedToId || null,
        priority,
        status,
        startDate: startDate || null,
        estimatedEndDate: estimatedEndDate || null,
        createdById: currentUserId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo crear el requerimiento.");
      return;
    }

    closeModal();
    await onCreated?.();
  }

  return (
    <>
      <button
        type="button"
        className={
          className ??
          "rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-100"
        }
        onClick={() => setShowModal(true)}
      >
        Nuevo req.
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <form
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onSubmit={handleSubmit}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Nuevo requerimiento</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Se creará dentro de la historia {story.folio ? `${story.folio} - ` : ""}{story.title}.
                </p>
              </div>

              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-200"
                onClick={closeModal}
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
                      {user.name} {user.role ? `- ${user.role}` : ""}
                    </option>
                  ))}
                </select>
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
                  {loading ? "Guardando..." : "Crear requerimiento"}
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  onClick={closeModal}
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
