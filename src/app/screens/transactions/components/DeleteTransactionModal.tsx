"use client";

import React, { useState } from "react";
import { TransactionsTransactionItem } from "../types";
import { submitDeleteTransaction } from "../api";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

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
    // Expected HTTP 204 No Content
    if (res.ok || res.status === 204) {
      onSuccess(transactionID);
      onClose();
    } else {
      setErrorMessage(res.message || "Failed to delete transaction.");
    }
  };

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Transaction"
      itemName={`Transaction #${item.transactionID}`}
      itemDetails={
        item.participantName ? (
          <p className="text-xs text-slate-500 mt-1">
            Participant: <span className="text-slate-700 font-medium">{item.participantName}</span>
          </p>
        ) : null
      }
      warningMessage="This action cannot be undone."
      errorMessage={errorMessage}
      isDeleting={isDeleting}
      confirmButtonText="Delete Transaction"
    />
  );
}
