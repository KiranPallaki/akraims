"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { formatDate, parseDate } from "@/lib/dateUtils";

interface StandardDatePickerProps {
  value: string; // MM/DD/YYYY or YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function StandardDatePicker({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  disabled = false,
  required = false,
  className = "",
}: StandardDatePickerProps) {
  const [open, setOpen] = useState(false);

  // Convert incoming value (could be YYYY-MM-DD or MM/DD/YYYY) into MM/DD/YYYY display string
  const displayValue = value ? formatDate(value) : "";
  const selectedDate = parseDate(value);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
  };

  const handleSelectDate = (date?: Date) => {
    if (date) {
      const formatted = formatDate(date);
      onChange(formatted);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={`relative flex items-center w-full ${className}`}>
        <input
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full h-8 px-3 pr-9 rounded-lg border border-slate-300 bg-white text-[12px] text-slate-800  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center p-0.5 rounded"
            title="Open calendar"
          >
            <CalendarIcon size={16} />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        className="w-auto p-0 border border-slate-200 shadow-md bg-white"
        align="end"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate || new Date()}
          onSelect={handleSelectDate}
        />
      </PopoverContent>
    </Popover>
  );
}
