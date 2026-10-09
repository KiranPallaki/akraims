"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import SearchBar from "@/components/common/SearchBar";
import { X } from "lucide-react";

interface NumericFilterPopoverProps {
  columnTitle: string;
  uniqueValues: number[];
  formatFn: (val: number) => string;
  initialFilter: number[] | null;
  onApply: (selectedValues: number[] | null) => void;
  onClose: () => void;
}

export default function NumericFilterPopover({
  columnTitle,
  uniqueValues,
  formatFn,
  initialFilter,
  onApply,
  onClose,
}: NumericFilterPopoverProps) {
  const [selected, setSelected] = useState<number[]>(
    initialFilter ?? uniqueValues
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  const filteredValues = useMemo(() => {
    if (!searchQuery.trim()) return uniqueValues;
    const q = searchQuery.toLowerCase();
    return uniqueValues.filter(
      (val) =>
        formatFn(val).toLowerCase().includes(q) ||
        String(val).toLowerCase().includes(q)
    );
  }, [uniqueValues, searchQuery, formatFn]);

  const toggleSelectAll = () => {
    if (selected.length === uniqueValues.length) {
      setSelected([]);
    } else {
      setSelected([...uniqueValues]);
    }
  };

  const toggleItem = (val: number) => {
    if (selected.includes(val)) {
      setSelected(selected.filter((v) => v !== val));
    } else {
      setSelected([...selected, val]);
    }
  };

  const handleApply = () => {
    if (selected.length === uniqueValues.length || selected.length === 0) {
      onApply(null);
    } else {
      onApply(selected);
    }
    onClose();
  };

  const handleClear = () => {
    setSelected(uniqueValues);
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
          Filter {columnTitle} (Unique Values)
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Search inside list & Select All */}
        <div className="flex items-center justify-between gap-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search values..."
            size="sm"
            className="flex-1 text-[12px]"
          />
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[12px] font-normal text-[#051a36] hover:underline flex-shrink-0"
          >
            {selected.length === uniqueValues.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        {/* Scrollable Checkbox List */}
        <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100 p-1 bg-slate-50/50">
          {filteredValues.length === 0 ? (
            <div className="py-4 text-center text-slate-400 text-[12px] font-normal">
              No values match filter.
            </div>
          ) : (
            filteredValues.map((val) => {
              const checked = selected.includes(val);
              return (
                <label
                  key={val}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors text-[12px] ${
                    checked ? "bg-[#051a36]/10 text-[#051a36]" : "hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(val)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#051a36] focus:ring-[#051a36]"
                    />
                    <span className="font-normal text-slate-800 truncate text-[12px]">
                      {formatFn(val)}
                    </span>
                  </div>
                </label>
              );
            })
          )}
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
