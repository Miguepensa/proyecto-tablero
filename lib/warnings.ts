import { isClosedStatus } from "@/lib/statuses";

export const WARNING_TIME_ZONE = "America/Mexico_City";
export const PROJECT_WARNING_DAYS = 15;
export const STORY_WARNING_DAYS = 5;
export const REQUIREMENT_WARNING_DAYS = 5;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return Number(parts.find((part) => part.type === type)?.value);
}

export function getWarningToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WARNING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  return new Date(
    Date.UTC(
      getDatePart(parts, "year"),
      getDatePart(parts, "month") - 1,
      getDatePart(parts, "day"),
    ),
  );
}

function toUtcDateOnly(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function getWarningDateRange(maxDays: number, now = new Date()) {
  const start = getWarningToday(now);
  const endExclusive = new Date(
    start.getTime() + (maxDays + 1) * MILLISECONDS_PER_DAY,
  );

  return { start, endExclusive };
}

export function getDaysRemaining(
  deadline: Date | string,
  now = new Date(),
) {
  const deadlineDate = toUtcDateOnly(deadline);

  if (!deadlineDate) return null;

  const today = getWarningToday(now);
  return Math.round(
    (deadlineDate.getTime() - today.getTime()) / MILLISECONDS_PER_DAY,
  );
}

export function isWarningCandidate(
  deadline: Date | string | null | undefined,
  status: string | null | undefined,
  maxDays: number,
  now = new Date(),
) {
  if (!deadline || isClosedStatus(status)) return false;

  const daysRemaining = getDaysRemaining(deadline, now);
  return (
    daysRemaining !== null &&
    daysRemaining >= 0 &&
    daysRemaining <= maxDays
  );
}
