"use client";

import React, { useState, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PopoverSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface PopoverSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: PopoverSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PopoverSelect({
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Select option...",
  disabled = false,
  className,
}: PopoverSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)),
    );
  }, [options, search]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch("");
    if (onBlur) onBlur();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-xs sm:text-[12px] text-slate-800 shadow-2xs transition-colors hover:bg-slate-50/80 focus:border-portal-navy focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className="truncate text-left flex-1 min-w-0">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 border-slate-200 bg-white shadow-lg rounded-lg">
        {/* Search input if options count > 4 */}
        {options.length > 4 && (
          <div className="relative mb-1 px-2 pt-1 pb-1.5 border-b border-slate-100 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        )}

        {/* Options List */}
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">
              No options found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs sm:text-sm text-slate-700 transition-colors text-left hover:bg-slate-100 hover:text-slate-900",
                    isSelected && "bg-slate-100 font-semibold text-portal-navy",
                  )}
                >
                  <div className="truncate pr-2">
                    <span>{option.label}</span>
                    {option.sublabel && (
                      <span className="ml-1.5 text-[11px] text-slate-400">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-portal-navy shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
