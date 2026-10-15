"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  maxWidth?: string; // e.g. "max-w-lg", "max-w-xl", "max-w-2xl", "max-w-3xl", "max-w-4xl"
  isSubmitting?: boolean;
  showHeader?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = "max-w-2xl",
  isSubmitting = false,
  showHeader = true,
  headerRight,
  children,
  footer,
  className = "",
}: SlideOverDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div
          className={`w-screen ${maxWidth} bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-250 ${className}`}
        >
          {/* Drawer Header */}
          {showHeader && (
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 backdrop-blur-xs">
              <div>
                {typeof title === "string" ? (
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {title}
                  </h2>
                ) : (
                  title
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {headerRight}
                <button
                  onClick={onClose}
                  type="button"
                  disabled={isSubmitting}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-50"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto">{children}</div>

          {/* Optional Drawer Footer */}
          {footer && (
            <div className="border-t border-slate-200 bg-slate-50/80 p-4 sticky bottom-0 z-10">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
