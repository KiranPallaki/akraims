"use client";

import React, { useState } from "react";
import { TransactionsTransactionItem } from "../types";
import { submitDeleteTransaction } from "../api";
import { Trash2, AlertTriangle, X } from "lucide-react";

export interface DeleteTransactionModalProps {
  isOpen: boolean;
  item: TransactionsTransactionItem | null;
  onClose: () => void;
  onSuccess: (deletedId: number | string) => void;
  clientID?: number;
}

export default function DeleteTransactionModal({
  isOpen,
  item,
  onClose,
  onSuccess,
  clientID,
}: DeleteTransactionModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const transactionID = item.transactionID;
    const res = await submitDeleteTransaction(transactionID, clientID);

    setIsDeleting(false);
    // PDF Section 10: Expected HTTP 204 No Content
    if (res.ok || res.status === 204) {
      onSuccess(transactionID);
      onClose();
    } else {
      setErrorMessage(res.message || "Failed to delete transaction.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 z-10 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
            <div className="rounded-full bg-rose-100 p-2 text-rose-600">
              <Trash2 size={20} />
            </div>
            Delete Transaction
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-slate-600">
          <p>
            Are you sure you want to delete transaction{" "}
            <strong className="text-slate-900 font-semibold">
              #{item.transactionID}
            </strong>
            ?
          </p>
          {item.participantName && (
            <p className="text-slate-500">
              Participant: <span className="text-slate-700">{item.participantName}</span>
            </p>
          )}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 flex items-center gap-1.5">
            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
            This action cannot be undone.
          </p>

          {errorMessage && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-2 font-medium">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md bg-rose-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
