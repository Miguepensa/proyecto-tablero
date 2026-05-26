export function normalizeFolioPrefix(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
}

export function isValidFolioPrefix(value: string) {
  return /^[A-Z0-9]{3}$/.test(value);
}

export function formatFolioNumber(value: number) {
  return String(value).padStart(4, "0");
}

export function buildProjectFolio(prefix: string, number: number) {
  return `PRY-${prefix}-${formatFolioNumber(number)}`;
}

export function buildStoryFolio(projectFolio: string, number: number) {
  return `${projectFolio}-HU-${formatFolioNumber(number)}`;
}

export function buildRequirementFolio(storyFolio: string, number: number) {
  return `${storyFolio}-REQ-${formatFolioNumber(number)}`;
}

export function getFallbackPrefixFromName(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return normalized.padEnd(3, "X").slice(0, 3);
}
