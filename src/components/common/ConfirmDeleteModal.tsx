"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X, RefreshCw } from "lucide-react";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  itemDetails?: React.ReactNode;
  warningMessage?: string;
  errorMessage?: string | null;
  isDeleting?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  itemName,
  itemDetails,
  warningMessage = "This action cannot be undone.",
  errorMessage,
  isDeleting = false,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 z-10 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/70">
          <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm sm:text-base">
            <div className="rounded-full bg-rose-100 p-1.5 text-rose-600">
              <Trash2 size={18} />
            </div>
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isDeleting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-50"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3 text-xs sm:text-sm text-slate-600">
          {itemName ? (
            <p>
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-semibold">&quot;{itemName}&quot;</strong>?
            </p>
          ) : (
            <p>Are you sure you want to delete this record?</p>
          )}

          {itemDetails && <div>{itemDetails}</div>}

          {warningMessage && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>{warningMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-rose-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmButtonText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
