"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  ownerId?: string | null;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  actualEndDate?: string | null;
  owner?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
};

function toInputDate(date?: string | null) {
  if (!date) return "";

  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getUserLabel(user: User) {
  const name = user.name?.trim();
  const email = user.email?.trim();

  if (name && email) return `${name} - ${email}`;
  if (name) return name;
  if (email) return email;

  return "Usuario sin nombre";
}

export default function ProjectEditForm({
  project,
  users,
}: {
  project: Project;
  users: User[];
}) {
  const router = useRouter();

  const ownerOptions = useMemo(() => {
    const map = new Map<string, User>();

    users.forEach((user) => {
      if (user.id) {
        map.set(user.id, user);
      }
    });

    if (project.owner?.id && !map.has(project.owner.id)) {
      map.set(project.owner.id, {
        id: project.owner.id,
        name: project.owner.name,
        email: project.owner.email,
      });
    }

    return Array.from(map.values());
  }, [users, project.owner]);

  const [name, setName] = useState(project.name || "");
  const [description, setDescription] = useState(project.description || "");
  const [status, setStatus] = useState(project.status || "PENDIENTE");

  const [ownerId, setOwnerId] = useState(
    project.ownerId || project.owner?.id || ""
  );

  const [startDate, setStartDate] = useState(toInputDate(project.startDate));

  const [estimatedEndDate, setEstimatedEndDate] = useState(
    toInputDate(project.estimatedEndDate)
  );

  const [actualEndDate, setActualEndDate] = useState(
    toInputDate(project.actualEndDate)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          status,
          ownerId: ownerId || null,
          startDate: startDate || null,
          estimatedEndDate: estimatedEndDate || null,
          actualEndDate: actualEndDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "No se pudo actualizar el proyecto.");
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar el proyecto."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Nombre del proyecto
          </label>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Nombre del proyecto"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Descripción
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-32 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Descripción del proyecto"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Estado
            </label>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="PENDIENTE">Planeado</option>
              <option value="EN_PROGRESO">En progreso</option>
              <option value="BLOQUEADO">Retrasado / Bloqueado</option>
              <option value="TERMINADO">Completado</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Responsable
            </label>

            <select
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Sin responsable</option>

              {ownerOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserLabel(user)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Fecha de inicio
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Fin estimado
            </label>

            <input
              type="date"
              value={estimatedEndDate}
              onChange={(event) => setEstimatedEndDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Fin real
            </label>

            <input
              type="date"
              value={actualEndDate}
              onChange={(event) => setActualEndDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/projects/${project.id}`}
          className="rounded-2xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}