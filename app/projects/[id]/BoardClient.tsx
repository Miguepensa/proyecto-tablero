"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  WORKFLOW_STATUS_OPTIONS as statusOptions,
  normalizeWorkflowStatus,
} from "@/lib/statuses";

type User = {
  id: string;
  name: string;
  email?: string | null;
  role: string;
};

type Story = {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  status: string;
  assignedTo?: {
    name: string;
  } | null;
  owner?: {
    name: string;
  } | null;
};

type Props = {
  initialStories: Story[];
};

const columns = [
  {
    value: "ANALISIS",
    title: "Análisis",
    description: "Etapa de análisis",
    dot: "bg-slate-400",
  },
  {
    value: "DISENO",
    title: "Diseño",
    description: "Etapa de diseño",
    dot: "bg-orange-400",
  },
  {
    value: "DESARROLLO_IMPLEMENTACION",
    title: "Desarrollo / implementación",
    description: "Etapa de desarrollo e implementación",
    dot: "bg-blue-500",
  },
  {
    value: "PRUEBAS",
    title: "Pruebas",
    description: "Etapa de pruebas",
    dot: "bg-purple-500",
  },
  {
    value: "TRANSICION",
    title: "Transición",
    description: "Etapa de transición",
    dot: "bg-amber-500",
  },
  {
    value: "PUESTA_EN_MARCHA",
    title: "Puesta en marcha",
    description: "Etapa de puesta en marcha",
    dot: "bg-green-500",
  },
  {
    value: "CANCELADO",
    title: "Cancelado",
    description: "Historias canceladas",
    dot: "bg-red-500",
  },
];

async function getResponseError(res: Response) {
  try {
    const data = await res.json();
    return (
      data?.error ??
      data?.message ??
      `No se pudo actualizar el estado. Código ${res.status}.`
    );
  } catch {
    return `No se pudo actualizar el estado. Código ${res.status}.`;
  }
}

export default function BoardClient({ initialStories }: Props) {
  const [stories, setStories] = useState(initialStories);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [savingStoryIds, setSavingStoryIds] = useState<string[]>([]);

  const currentUser = users.find((user) => user.id === currentUserId);
  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          return;
        }

        setUsers(data);

        setCurrentUserId((selectedUserId) => {
          if (selectedUserId) return selectedUserId;

          const adminUser = data.find((user: User) => user.role === "ADMIN");
          return adminUser?.id ?? data[0]?.id ?? "";
        });
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
    }

    loadUsers();
  }, []);

  async function changeStatus(storyId: string, newStatus: string) {
    if (!currentUserId) {
      alert("Selecciona el usuario actual antes de cambiar el estado.");
      return;
    }

    const previousStory = stories.find((story) => story.id === storyId);

    if (!previousStory || previousStory.status === newStatus) {
      return;
    }

    setSavingStoryIds((prev) => [...prev, storyId]);

    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId ? { ...story, status: newStatus } : story
      )
    );

    try {
      const userQuery = `?userId=${encodeURIComponent(currentUserId)}`;

      const res = await fetch(`/api/stories/${storyId}${userQuery}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorMessage = await getResponseError(res);

        setStories((prev) =>
          prev.map((story) =>
            story.id === storyId
              ? { ...story, status: previousStory.status }
              : story
          )
        );

        alert(errorMessage);
        return;
      }

      const updatedStory = await res.json();

      setStories((prev) =>
        prev.map((story) =>
          story.id === updatedStory.id ? { ...story, ...updatedStory } : story
        )
      );
    } catch (error) {
      console.error("Error al actualizar estado:", error);

      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId ? { ...story, status: previousStory.status } : story
        )
      );

      alert("No se pudo actualizar el estado. Revisa la consola del servidor.");
    } finally {
      setSavingStoryIds((prev) => prev.filter((id) => id !== storyId));
    }
  }

  function getStoriesByStatus(status: string) {
    return stories.filter(
      (story) => normalizeWorkflowStatus(story.status) === status,
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Usuario actual
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Se usa para validar permisos al cambiar estados.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            {users.length === 0 ? (
              <option value="">Sin usuarios disponibles</option>
            ) : (
              users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role}
                </option>
              ))
            )}
          </select>

          <span
            className={`rounded-full border px-4 py-2 text-xs font-black ${
              isAdmin
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {isAdmin ? "ADMIN" : currentUser?.role ?? "Sin usuario"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden pb-2">
        <div className="grid min-w-[1380px] grid-cols-7 gap-3">
          {columns.map((column) => {
            const columnStories = getStoriesByStatus(column.value);

            return (
              <section
                key={column.value}
                className="flex max-h-[68vh] min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${column.dot}`} />
                      <h3 className="text-sm font-bold leading-4 text-slate-950">
                        {column.title}
                      </h3>
                    </div>

                    <p className="mt-1 text-[11px] leading-4 text-slate-500">
                      {column.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm">
                    {columnStories.length}
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {columnStories.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center text-xs text-slate-400">
                      Sin historias
                    </div>
                  ) : (
                    columnStories.map((story) => {
                      const isSaving = savingStoryIds.includes(story.id);

                      return (
                        <article
                          key={story.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                        >
                          <h4 className="line-clamp-2 text-xs font-extrabold leading-4 text-slate-950">
                            {story.title}
                          </h4>

                          <select
                            value={story.status}
                            disabled={isSaving || !currentUserId}
                            onChange={(e) =>
                              changeStatus(story.id, e.target.value)
                            }
                            className="mt-3 h-8 w-full rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          {isSaving && (
                            <p className="mt-1 text-center text-[11px] font-bold text-blue-600">
                              Guardando...
                            </p>
                          )}

                          <Link
                            href={`/stories/${story.id}`}
                            className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-xl bg-blue-600 px-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            Ver requerimientos
                          </Link>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
