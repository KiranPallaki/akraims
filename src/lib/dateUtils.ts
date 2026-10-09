/**
 * Global Date Utility Module for AKRA IMS
 * Standardizes all date displays across all screens to MM/DD/YYYY (mm/dd/yyyy).
 */

/**
 * Formats any Date object, ISO string (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss),
 * timestamp, or string into MM/DD/YYYY format.
 *
 * @example
 * formatDate("2026-10-09") => "10/09/2026"
 * formatDate("2026-10-09T00:00:00") => "10/09/2026"
 * formatDate(new Date(2026, 9, 9)) => "10/09/2026"
 */
export function formatDate(
  dateInput: string | Date | number | null | undefined
): string {
  if (!dateInput) return "";
  try {
    if (typeof dateInput === "string") {
      const cleanStr = dateInput.trim().split("T")[0];
      const parts = cleanStr.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        // Handle YYYY-MM-DD
        const [year, month, day] = parts;
        return `${month.padStart(2, "0")}/${day.padStart(2, "0")}/${year}`;
      }
      if (cleanStr.includes("/")) {
        const slashParts = cleanStr.split("/");
        if (slashParts.length === 3) {
          const [m, d, y] = slashParts;
          if (y.length === 4) {
            return `${m.padStart(2, "0")}/${d.padStart(2, "0")}/${y}`;
          }
        }
      }
    }

    const d = typeof dateInput === "number" ? new Date(dateInput) : new Date(String(dateInput));
    if (isNaN(d.getTime())) return String(dateInput);

    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Returns today's date formatted as MM/DD/YYYY.
 */
export function getTodayFormatted(): string {
  return formatDate(new Date());
}

/**
 * Safely parses an MM/DD/YYYY or YYYY-MM-DD string into a JavaScript Date object.
 */
export function parseDate(dateStr: string): Date | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;
  const clean = dateStr.trim();

  // Try MM/DD/YYYY
  if (clean.includes("/")) {
    const parts = clean.split("/");
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10) - 1;
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }

  // Try YYYY-MM-DD
  if (clean.includes("-")) {
    const parts = clean.split("T")[0].split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }

  const dt = new Date(clean);
  return isNaN(dt.getTime()) ? undefined : dt;
}
