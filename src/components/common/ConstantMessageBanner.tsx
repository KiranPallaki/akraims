"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

export type BannerType = "info" | "error" | "success" | "warning" | "loading";

export interface ConstantMessageBannerProps {
  message?: string | null;
  type?: BannerType;
  className?: string;
  onClose?: () => void;
  children?: React.ReactNode;
}

const TYPE_STYLES: Record<
  BannerType,
  {
    container: string;
    iconClass: string;
    IconComponent: React.ComponentType<{ className?: string; size?: number }>;
  }
> = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-900",
    iconClass: "text-blue-600",
    IconComponent: Info,
  },
  error: {
    container: "bg-rose-50 border-rose-200 text-rose-700",
    iconClass: "text-rose-500",
    IconComponent: AlertCircle,
  },
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-800",
    iconClass: "text-emerald-600",
    IconComponent: CheckCircle2,
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    iconClass: "text-amber-600",
    IconComponent: AlertTriangle,
  },
  loading: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    iconClass: "text-blue-600 animate-spin",
    IconComponent: Loader2,
  },
};

export default function ConstantMessageBanner({
  message,
  type = "info",
  className = "",
  onClose,
  children,
}: ConstantMessageBannerProps) {
  const content = message || children;
  if (!content) return null;

  const style = TYPE_STYLES[type] || TYPE_STYLES.info;
  const { IconComponent, iconClass } = style;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-lg border p-2.5 text-xs sm:text-[12px] font-medium flex items-start gap-2.5 transition-colors duration-150 shadow-2xs ${style.container} ${className}`}
    >
      <IconComponent size={16} className={`shrink-0 mt-0.5 ${iconClass}`} />
      <div className="flex-1 min-w-0 leading-relaxed whitespace-pre-line">
        {content}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
