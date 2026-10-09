"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

export type TextMatchMode = "contains" | "startsWith" | "endsWith" | "equals";

export interface TextFilterValue {
  value: string;
  mode: TextMatchMode;
}

interface TextFilterPopoverProps {
  columnTitle: string;
  initialFilter: TextFilterValue | null;
  onApply: (filter: TextFilterValue | null) => void;
  onClose: () => void;
}

export default function TextFilterPopover({
  columnTitle,
  initialFilter,
  onApply,
  onClose,
}: TextFilterPopoverProps) {
  const [text, setText] = useState<string>(initialFilter?.value ?? "");
  const [mode, setMode] = useState<TextMatchMode>(
    initialFilter?.mode ?? "contains"
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleApply = () => {
    if (!text.trim()) {
      onApply(null);
    } else {
      onApply({ value: text.trim(), mode });
    }
    onClose();
  };

  const handleClear = () => {
    setText("");
    onApply(null);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl text-slate-800 text-[12px] font-normal animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <span className="font-normal text-slate-900 text-[12px]">
          Filter {columnTitle}
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Match Mode Options */}
        <div>
          <label className="block text-[12px] font-normal text-slate-600 mb-1.5 uppercase tracking-wider">
            Match Condition
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "contains", label: "Contains" },
              { id: "startsWith", label: "Starts with" },
              { id: "endsWith", label: "Ends with" },
              { id: "equals", label: "Equals" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id as TextMatchMode)}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-normal border text-left transition-colors flex items-center justify-between ${
                  mode === opt.id
                    ? "bg-[#051a36]/10 border-[#051a36] text-[#051a36]"
                    : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{opt.label}</span>
                {mode === opt.id && <Check className="h-3 w-3 text-[#051a36]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-[12px] font-normal text-slate-600 mb-1 uppercase tracking-wider">
            Search Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder={`Search ${columnTitle.toLowerCase()}...`}
            autoFocus
            className="w-full text-[12px] px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#051a36]/20 font-normal"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-normal text-[12px] transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-3.5 py-1.5 rounded-lg bg-[#051a36] text-white hover:bg-[#092b57] font-normal text-[12px] transition-colors shadow-xs"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
