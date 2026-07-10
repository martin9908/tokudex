/**
 * Lightweight, dependency-free runtime validation for API/server-action input.
 *
 * TypeScript types are erased at runtime, so request bodies must be checked
 * explicitly before they reach the database. Each validator returns a discriminated
 * result so callers can branch on `ok` and surface a 400 with a useful message.
 */

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export const PROGRESS_STATUSES = [
  "watching",
  "completed",
  "on_hold",
  "plan_to_watch",
] as const;

export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const NOTE_MAX_LENGTH = 5000;
export const PASSWORD_MIN_LENGTH = 12;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// RFC 5322-inspired pattern — rejects obvious non-emails without being overly strict.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value) && value.length <= 254;
}

/**
 * Returns an error string if the password is too weak, or null if it passes.
 * Requirements: at least PASSWORD_MIN_LENGTH chars, at least one uppercase
 * letter, one lowercase letter, and one digit.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

export type ProgressInput = {
  seriesId: string;
  currentEpisode: number;
  status: ProgressStatus;
};

export function validateProgressInput(body: unknown): ValidationResult<ProgressInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be an object" };
  }
  const { seriesId, currentEpisode, status } = body as Record<string, unknown>;

  if (!isUuid(seriesId)) {
    return { ok: false, error: "seriesId must be a valid UUID" };
  }
  if (!isInteger(currentEpisode) || currentEpisode < 0) {
    return { ok: false, error: "currentEpisode must be a non-negative integer" };
  }
  if (!PROGRESS_STATUSES.includes(status as ProgressStatus)) {
    return {
      ok: false,
      error: `status must be one of: ${PROGRESS_STATUSES.join(", ")}`,
    };
  }

  return {
    ok: true,
    value: {
      seriesId,
      currentEpisode,
      status: status as ProgressStatus,
    },
  };
}

export type NoteInput = {
  seriesId: string;
  episodeNumber: number;
  note: string;
};

export function validateNoteInput(body: unknown): ValidationResult<NoteInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be an object" };
  }
  const { seriesId, episodeNumber, note } = body as Record<string, unknown>;

  if (!isUuid(seriesId)) {
    return { ok: false, error: "seriesId must be a valid UUID" };
  }
  if (!isInteger(episodeNumber) || episodeNumber < 1) {
    return { ok: false, error: "episodeNumber must be a positive integer" };
  }
  if (typeof note !== "string" || note.trim().length === 0) {
    return { ok: false, error: "note must be a non-empty string" };
  }
  if (note.length > NOTE_MAX_LENGTH) {
    return { ok: false, error: `note must be ${NOTE_MAX_LENGTH} characters or fewer` };
  }

  return {
    ok: true,
    value: { seriesId, episodeNumber, note },
  };
}
