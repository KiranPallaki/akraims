/**
 * Centralized Application Brand & Theme Colors
 * Modify color hex values here or in src/app/globals.css for single-point updates.
 */

export const BRAND_COLORS = {
  /** Primary Navy Brand Color (#051a39) */
  primaryNavy: "#051a39",
  primaryNavyHover: "#092b57",

  /** Portal Brand Accents */
  portalPrimary: "#90191b",
  portalSecondary: "#7a1517",
  portalAccent: "#051a39",
  portalLight: "#0a2a4a",

  /** Status Colors */
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

export type BrandColorKey = keyof typeof BRAND_COLORS;
