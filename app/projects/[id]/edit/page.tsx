import Link from "next/link";
import { headers } from "next/headers";
import ProjectEditForm from "./ProjectEditForm";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  type: "ADMINISTRACION_TI" | "FABRICA_SOFTWARE";
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
  responsibles?: Array<{
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }>;
};

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");

  const protocol = isLocalhost ? "http" : "https";

  return `${protocol}://${host}`;
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  const baseUrl = await getBaseUrl();

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Error al cargar ${path}: ${res.status} ${res.statusText}`);
      return fallback;
    }

    return res.json();
  } catch (error) {
    console.error(`Error al conectar con ${path}:`, error);
    return fallback;
  }
}

async function getProject(id: string): Promise<Project | null> {
  return fetchJson<Project | null>(`/api/projects/${id}`, null);
}

async function getUsers(): Promise<User[]> {
  return fetchJson<User[]>("/api/users", []);
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
      </nav>
    </aside>
  );
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, users] = await Promise.all([getProject(id), getUsers()]);

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
          <Sidebar />

          <section className="min-w-0 flex-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <Link
                href="/projects"
                className="text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                ← Volver a proyectos
              </Link>

              <h1 className="mt-6 text-3xl font-bold text-slate-950">
                Proyecto no encontrado
              </h1>

              <p className="mt-2 text-slate-500">
                No se encontró información para editar este proyecto.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-6">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Link
              href={`/projects/${project.id}`}
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              ← Volver al detalle
            </Link>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Editar proyecto
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Modifica la información principal del proyecto.
            </p>
          </div>

          <ProjectEditForm project={project} users={users} />
        </section>
      </div>
    </main>
  );
}
