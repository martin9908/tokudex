/**
 * Theme preference — Slate (dark, the default) or Paper (light). Stored in a
 * plain cookie so the server can stamp `data-theme` on <html> and the first
 * paint is already in the right palette. "system" clears the cookie, which
 * falls back to Slate.
 */
export const THEME_COOKIE = "tdx-theme";

export type Theme = "dark" | "light";
export type ThemeChoice = Theme | "system";

export function parseTheme(value: string | undefined | null): Theme | null {
    return value === "dark" || value === "light" ? value : null;
}
