"use client";

import Link from "next/link";
import { useState } from "react";

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

const statusOptions = [
  { value: "ANALISIS", label: "Analisis" },
  { value: "DISENO", label: "diseño" },
  {
    value: "DESARROLLO_IMPLEMENTACION",
    label: "Desarrollo / implementación",
  },
  { value: "PRUEBAS", label: "Pruebas" },
  { value: "TRANSICION", label: "transición" },
  { value: "PUESTA_EN_MARCHA", label: "puesta en marcha" },
];

const columns = [
  {
    value: "ANALISIS",
    title: "Analisis",
    description: "Etapa de analisis",
    dot: "bg-slate-400",
  },
  {
    value: "DISENO",
    title: "diseño",
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
    title: "transición",
    description: "Etapa de transición",
    dot: "bg-amber-500",
  },
  {
    value: "PUESTA_EN_MARCHA",
    title: "puesta en marcha",
    description: "Etapa de puesta en marcha",
    dot: "bg-green-500",
  },
];

function getPriorityLabel(priority?: string | null) {
  if (priority === "CRITICA") return "Crítica";
  if (priority === "ALTA") return "Alta";
  if (priority === "MEDIA") return "Media";
  if (priority === "BAJA") return "Baja";
  return "Sin prioridad";
}

function getPriorityClasses(priority?: string | null) {
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

function PriorityBadge({ priority }: { priority?: string | null }) {
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

export default function BoardClient({ initialStories }: Props) {
  const [stories, setStories] = useState(initialStories);

  async function changeStatus(storyId: string, newStatus: string) {
    const res = await fetch(`/api/stories/${storyId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      alert("No se pudo actualizar el estado");
      return;
    }

    const updatedStory = await res.json();

    setStories((prev) =>
      prev.map((story) =>
        story.id === updatedStory.id ? { ...story, ...updatedStory } : story
      )
    );
  }

  function getStoriesByStatus(status: string) {
    return stories.filter((story) => story.status === status);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1440px] grid-cols-6 gap-4">
        {columns.map((column) => {
          const columnStories = getStoriesByStatus(column.value);

          return (
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
                  {columnStories.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnStories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">
                    Sin historias
                  </div>
                ) : (
                  columnStories.map((story) => {
                    const assignedName =
                      story.assignedTo?.name ||
                      story.owner?.name ||
                      "Sin asignar";

                    return (
                      <article
                        key={story.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-3">
                          <h4 className="text-sm font-bold leading-5 text-slate-950">
                            {story.title}
                          </h4>

                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                            {story.description || "Sin descripción"}
                          </p>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2">
                          <PriorityBadge priority={story.priority} />
                        </div>

                        <div className="mb-4 rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium text-slate-500">
                            Asignado a
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-950">
                            {assignedName}
                          </p>
                        </div>

                        <select
                          value={story.status}
                          onChange={(e) =>
                            changeStatus(story.id, e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <Link
                          href={`/stories/${story.id}`}
                          className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          Ver actividades
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
  );
}
