export type ProjectResponsibleUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

export type ProjectWithResponsibles = {
  owner?: ProjectResponsibleUser | null;
  responsibles?: Array<{
    user?: ProjectResponsibleUser | null;
  }> | null;
};

export function normalizeResponsibleIds(
  value: unknown,
  fallbackOwnerId?: unknown,
) {
  const rawIds = Array.isArray(value)
    ? value
    : fallbackOwnerId
      ? [fallbackOwnerId]
      : [];

  return Array.from(
    new Set(
      rawIds
        .map((id) => String(id ?? "").trim())
        .filter(Boolean),
    ),
  );
}

export function getProjectResponsibleUsers(
  project: ProjectWithResponsibles,
) {
  const users = [
    ...(project.responsibles ?? [])
      .map((responsible) => responsible.user)
      .filter((user): user is ProjectResponsibleUser => Boolean(user)),
    project.owner ?? null,
  ];

  const uniqueUsers = new Map<string, ProjectResponsibleUser>();

  users.forEach((user) => {
    if (!user) return;

    const key =
      user.id?.trim() ||
      user.email?.trim().toLowerCase() ||
      user.name?.trim().toLowerCase();

    if (key && !uniqueUsers.has(key)) {
      uniqueUsers.set(key, user);
    }
  });

  return Array.from(uniqueUsers.values());
}

export function getProjectResponsibleNames(
  project: ProjectWithResponsibles,
) {
  const names = getProjectResponsibleUsers(project)
    .map((user) => user.name?.trim() || user.email?.trim())
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(", ") : "Sin responsable";
}
