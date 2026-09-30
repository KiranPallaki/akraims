export type TableDensity = "compact" | "comfortable" | "spacious";

export interface TableConfigSettings {
  /** Global density preset */
  density: TableDensity;
  /** Global row padding (Tailwind class string) */
  rowPadding: string;
  /** Global body font size (Tailwind class string) */
  fontSize: string;
  /** Global header font size (Tailwind class string) */
  headerFontSize: string;
  /** Global header background and text style */
  headerBg: string;
  /** Global table container border and background style */
  containerClass: string;
  /** Global hover effect class */
  hoverBg: string;
  /** Global selected row class */
  selectedBg: string;
  /** Default empty state message */
  emptyMessage: string;
}

/**
 * DEFAULT GLOBAL TABLE CONFIGURATION
 * Changing values here updates ALL tables using ReusableTable across the entire application.
 */
export const GLOBAL_TABLE_CONFIG: TableConfigSettings = {
  density: "comfortable",
  rowPadding: "py-2.5 px-4",
  fontSize: "text-xs sm:text-[13px]",
  headerFontSize: "text-xs font-semibold tracking-wide",
  headerBg: "bg-slate-50 text-slate-800 font-semibold border-b border-slate-200",
  containerClass: "bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden",
  hoverBg: "hover:bg-slate-50/80 transition-colors",
  selectedBg: "bg-sky-50/80 border-sky-200 font-medium",
  emptyMessage: "No records found.",
};

/**
 * Density map helper for quick padding presets
 */
export const DENSITY_PADDING_MAP: Record<TableDensity, string> = {
  compact: "py-1.5 px-3",
  comfortable: "py-2.5 px-4",
  spacious: "py-3.5 px-5",
};

/**
 * Merge global configuration with component-level overrides
 */
export function getMergedTableConfig(overrides?: Partial<TableConfigSettings>): TableConfigSettings {
  if (!overrides) return GLOBAL_TABLE_CONFIG;
  
  const mergedDensity = overrides.density || GLOBAL_TABLE_CONFIG.density;
  const computedPadding = overrides.rowPadding || DENSITY_PADDING_MAP[mergedDensity] || GLOBAL_TABLE_CONFIG.rowPadding;

  return {
    ...GLOBAL_TABLE_CONFIG,
    ...overrides,
    density: mergedDensity,
    rowPadding: computedPadding,
  };
}
