"use client";

import React, { useState } from "react";
import { FundItem } from "../types";
import { submitDeleteFund } from "../api";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

export interface DeleteFundModalProps {
  isOpen: boolean;
  item: FundItem | null;
  onClose: () => void;
  onSuccess: (deletedId: number | string) => void;
  clientID?: number;
}

export default function DeleteFundModal({
  isOpen,
  item,
  onClose,
  onSuccess,
  clientID,
}: DeleteFundModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const fundId = item.fundID;
    const res = await submitDeleteFund(fundId, clientID);

    setIsDeleting(false);
    if (res.ok || (res as any).status === 204) {
      onSuccess(fundId);
      onClose();
    } else {
      setErrorMessage(res.message || "Failed to delete fund.");
    }
  };

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Fund"
      itemName={`${item.fundName || item.fund} (${item.fund})`}
      warningMessage="This action cannot be undone. Any associations with participants will be affected."
      errorMessage={errorMessage}
      isDeleting={isDeleting}
      confirmButtonText="Delete Fund"
    />
  );
}
