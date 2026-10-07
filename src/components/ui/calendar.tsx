"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Extended years range from 1950 to 2075
const ALL_YEARS = Array.from({ length: 126 }, (_, i) => 1950 + i);

interface SearchableSelectProps {
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (val: string | number) => void;
  placeholder: string;
  className?: string;
  buttonClassName?: string;
}

function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  className,
  buttonClassName,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const selectedItemRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Scroll to selected item when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (selectedItemRef.current) {
          selectedItemRef.current.scrollIntoView({
            block: "center",
            behavior: "instant" as ScrollBehavior,
          });
        }
      }, 0);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) ||
      String(opt.value).toLowerCase().includes(q)
    );
  });

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      className={cn("relative inline-block text-left", className)}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-1 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-700 transition-colors focus:outline-none cursor-pointer",
          buttonClassName
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-xl z-50 p-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative mb-1.5">
            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-5 pr-1.5 py-0.5 border border-slate-200 rounded text-[11px] text-slate-700 focus:outline-none focus:border-slate-400 bg-slate-50"
            />
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-40 overflow-y-auto space-y-0.5 text-xs select-none"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-1 px-2 text-[11px] text-slate-400 text-center">
                No results
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={String(opt.value)}
                    ref={isSelected ? selectedItemRef : null}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "px-2 py-1 rounded text-[11px] cursor-pointer transition-colors flex items-center justify-between",
                      isSelected
                        ? "bg-[#051a39] text-white font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: externalMonth,
  onMonthChange: externalOnMonthChange,
  defaultMonth,
  ...props
}: CalendarProps) {
  // Determine initial month
  const getInitialMonth = () => {
    if (externalMonth instanceof Date) return externalMonth;
    const anyProps = props as any;
    if (anyProps.selected instanceof Date) return anyProps.selected;
    if (defaultMonth instanceof Date) return defaultMonth;
    return new Date();
  };

  const [internalMonth, setInternalMonth] = React.useState<Date>(getInitialMonth);

  // Keep internal month updated if externalMonth prop changes
  React.useEffect(() => {
    if (externalMonth instanceof Date) {
      setInternalMonth(externalMonth);
    }
  }, [externalMonth]);

  const displayMonth = externalMonth || internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    if (externalOnMonthChange) {
      externalOnMonthChange(newMonth);
    }
  };

  const currentYear = displayMonth.getFullYear();
  const currentMonthIndex = displayMonth.getMonth();

  const handlePrevMonth = () => {
    const prev = new Date(currentYear, currentMonthIndex - 1, 1);
    handleMonthChange(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentYear, currentMonthIndex + 1, 1);
    handleMonthChange(next);
  };

  const handleSelectMonth = (mIndex: string | number) => {
    const targetMonth =
      typeof mIndex === "number" ? mIndex : parseInt(mIndex, 10);
    const updated = new Date(currentYear, targetMonth, 1);
    handleMonthChange(updated);
  };

  const handleSelectYear = (yr: string | number) => {
    const targetYear = typeof yr === "number" ? yr : parseInt(yr, 10);
    const updated = new Date(targetYear, currentMonthIndex, 1);
    handleMonthChange(updated);
  };

  const monthOptions = MONTHS.map((m, idx) => ({
    label: m,
    value: idx,
  }));

  const yearOptions = ALL_YEARS.map((y) => ({
    label: String(y),
    value: y,
  }));

  return (
    <div
      className={cn(
        "p-2.5 bg-white rounded-md border border-slate-200 shadow-lg text-slate-800 w-[260px] min-w-[260px] max-w-[260px]",
        className
      )}
    >
      {/* Top Navigation Row: Left Arrow | Searchable Month & Year | Right Arrow */}
      <div className="flex items-center justify-between pb-2 pt-0.5 px-0.5 mb-1 border-b border-slate-100 gap-1.5">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={handlePrevMonth}
          className="h-6 w-6 bg-slate-50 border border-slate-200 rounded p-0 opacity-80 hover:opacity-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          title="Previous Month"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Center: Fixed-width Searchable Month & Year Selectors */}
        <div className="flex items-center gap-1.5 flex-1 justify-center">
          <SearchableSelect
            value={currentMonthIndex}
            options={monthOptions}
            onChange={handleSelectMonth}
            placeholder="Search month..."
            buttonClassName="w-[100px]"
          />
          <SearchableSelect
            value={currentYear}
            options={yearOptions}
            onChange={handleSelectYear}
            placeholder="Search year..."
            buttonClassName="w-[66px]"
          />
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={handleNextMonth}
          className="h-6 w-6 bg-slate-50 border border-slate-200 rounded p-0 opacity-80 hover:opacity-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          title="Next Month"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* DayPicker Grid */}
      <DayPicker
        month={displayMonth}
        onMonthChange={handleMonthChange}
        showOutsideDays={showOutsideDays}
        {...(props as any)}
        classNames={{
          months: "flex flex-col sm:flex-row gap-3 w-full",
          month: "flex flex-col gap-2 w-full",
          month_caption: "hidden",
          nav: "hidden",
          month_grid: "w-full border-collapse space-y-1",
          weekdays: "flex border-b border-slate-100 pb-1 mb-1 justify-between",
          weekday:
            "text-slate-400 rounded-md w-7 font-medium text-[11px] text-center",
          week: "flex w-full mt-1 justify-between",
          day: "h-7 w-7 p-0 font-normal text-xs text-slate-700 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer transition-colors focus:outline-none",
          day_button: "h-full w-full flex items-center justify-center rounded text-xs",
          selected:
            "bg-[#051a39] text-white hover:bg-[#051a39] hover:text-white font-semibold rounded",
          today: "bg-slate-100 text-[#051a39] font-bold border border-slate-300",
          outside:
            "text-slate-300 opacity-40 hover:bg-transparent cursor-default",
          disabled: "text-slate-300 opacity-30 cursor-not-allowed",
          ...classNames,
        }}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
