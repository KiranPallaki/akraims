"use client";

import React from "react";
import { Search, X } from "lucide-react";

export interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  clearable?: boolean;
  onClear?: () => void;
  size?: "sm" | "md" | "lg";
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function SearchBar({
  value = "",
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "w-64",
  inputClassName = "",
  iconClassName = "",
  clearable = true,
  onClear,
  size = "md",
  autoFocus = false,
  disabled = false,
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) {
      onChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange("");
    }
    if (onClear) {
      onClear();
    }
  };

  const sizeStyles = {
    sm: {
      container: "h-8",
      icon: "left-2 top-2 h-3.5 w-3.5",
      input: "pl-7 pr-7 text-xs",
      clear: "right-2 top-2 h-3.5 w-3.5",
    },
    md: {
      container: "h-9",
      icon: "left-2.5 top-2.5 h-4 w-4",
      input: "pl-8 pr-8 text-xs sm:text-sm",
      clear: "right-2.5 top-2.5 h-4 w-4",
    },
    lg: {
      container: "h-10",
      icon: "left-3 top-3 h-4 w-4",
      input: "pl-9 pr-9 text-sm",
      clear: "right-3 top-3 h-4 w-4",
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`relative ${currentSize.container} ${className}`}>
      <Search
        aria-hidden="true"
        className={`absolute ${currentSize.icon} text-slate-400 pointer-events-none ${iconClassName}`}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`w-full h-full rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:bg-slate-50 ${currentSize.input} ${inputClassName}`}
      />
      {clearable && value ? (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute ${currentSize.clear} text-slate-400 hover:text-slate-600 focus:outline-none transition-colors flex items-center justify-center`}
          title="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
