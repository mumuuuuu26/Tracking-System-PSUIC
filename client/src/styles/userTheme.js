/**
 * userTheme.js
 *
 * Centralized theme constants for all user-facing pages, supporting both Light and Dark modes.
 * Import from here instead of writing literal color strings in JSX.
 *
 * Palette (Dark):
 *  bg        — Page background        #0d1b2a
 *  surface   — Cards, inputs          #1a2f4e
 *  surfaceAlt— Dropdown panels        #152540
 *  primary   — PSU Deep Blue buttons  #193C6C
 */

export const theme = {
    // ── Backgrounds ──────────────────────────────────────────────
    /** Main page background */
    pageBg: "bg-gray-50 dark:bg-[#0d1b2a]",
    /** Hero gradient (top of page) */
    heroBg: "bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0a2a4a]",
    /** Card / input / surface */
    surface: "bg-white dark:bg-[#1a2f4e]",
    /** Darker surface used for dropdown panels */
    surfaceAlt: "bg-gray-100 dark:bg-[#152540]",
    /** Primary button */
    primary: "bg-blue-600 dark:bg-[#193C6C]",

    // ── Borders ───────────────────────────────────────────────────
    border: "border border-gray-200 dark:border-blue-800/30",
    borderActive: "border border-blue-500 dark:border-blue-500/60",
    borderInput: "border border-gray-300 dark:border-blue-700/50",

    // ── Text ──────────────────────────────────────────────────────
    textPrimary: "text-gray-900 dark:text-white",
    textSecondary: "text-gray-600 dark:text-blue-300",
    textMuted: "text-gray-500 dark:text-blue-400/60",
    textPlaceholder: "placeholder-gray-400 dark:placeholder-blue-400/40",

    // ── Composites (common full class strings) ────────────────────
    /** Standard card */
    card: "bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 shadow-sm dark:shadow-none",
    /** Text input field */
    input: "bg-white dark:bg-[#1a2f4e] border border-gray-300 dark:border-blue-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-blue-400/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 outline-none rounded-xl px-4 py-3 text-sm w-full",
    /** Primary action button */
    btnPrimary: "bg-blue-600 dark:bg-[#193C6C] text-white rounded-2xl font-bold hover:bg-blue-700 dark:hover:bg-[#15325A] transition-colors shadow-lg",
    /** Ghost / secondary button */
    btnSecondary: "bg-white dark:bg-[#1a2f4e] text-blue-600 dark:text-blue-300 border border-gray-300 dark:border-blue-700/50 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-[#1e3558] transition-colors",
    /** Category / label pill */
    pill: "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-xs font-bold px-2.5 py-0.5 rounded-lg",
};

// Raw color values (for use in inline styles or conditional rendering logic)
export const colors = {
    // These are specific to dark mode, used in charts or logic
    dark: {
        pageBg: "#0d1b2a",
        surface: "#1a2f4e",
        surfaceAlt: "#152540",
        primary: "#193C6C",
        border: "rgba(29, 78, 216, 0.3)",
        textMuted: "rgba(96, 165, 250, 0.6)",
    },
    // Light mode logic colors
    light: {
        pageBg: "#f9fafb",
        surface: "#ffffff",
        surfaceAlt: "#f3f4f6",
        primary: "#2563eb",
        border: "#e5e7eb",
        textMuted: "#6b7280",
    }
};
