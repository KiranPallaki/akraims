"use client";

import React from "react";

export interface FormRowProps {
  label: string;
  required?: boolean;
  error?: string | null;
  colon?: boolean;
  children: React.ReactNode;
  className?: string;
  labelWidth?: string; // e.g. "w-28", "w-32", "w-36", "w-40"
  layout?: "horizontal" | "vertical";
  helpText?: string;
}

export default function FormRow({
  label,
  required = false,
  error,
  colon = true,
  children,
  className = "",
  labelWidth = "w-32",
  layout = "horizontal",
  helpText,
}: FormRowProps) {
  if (layout === "vertical") {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div>{children}</div>
        {helpText && <p className="text-[11px] text-slate-400">{helpText}</p>}
        {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0 ${className}`}
    >
      <div className={`${labelWidth} shrink-0 flex items-center justify-between pr-2`}>
        <label className="text-xs font-semibold text-slate-700 truncate" title={label}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {colon && <span className="text-xs font-bold text-slate-500">:</span>}
      </div>

      <div className="flex-1 min-w-0 w-full">
        {children}
        {helpText && <p className="text-[11px] text-slate-400 mt-1">{helpText}</p>}
        {error && <p className="text-[11px] text-rose-600 font-medium mt-1">{error}</p>}
      </div>
    </div>
  );
}
