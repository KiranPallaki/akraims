"use client";

import React, { useState } from "react";
import { ParticipantItem } from "../types";
import { submitDeleteParticipant } from "../api";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

export interface DeleteParticipantModalProps {
  isOpen: boolean;
  item: ParticipantItem | null;
  onClose: () => void;
  onSuccess: (deletedId: number | string) => void;
  clientID?: number;
}

export default function DeleteParticipantModal({
  isOpen,
  item,
  onClose,
  onSuccess,
  clientID,
}: DeleteParticipantModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const pId = item.participantID;
    const res = await submitDeleteParticipant(pId, clientID);

    setIsDeleting(false);
    if (res.ok || (res as any).status === 204) {
      onSuccess(pId);
      onClose();
    } else {
      setErrorMessage(res.message || "Failed to delete participant.");
    }
  };

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Participant"
      itemName={item.participantName}
      itemDetails={
        item.participantType ? (
          <p className="text-xs text-slate-500 mt-1">
            Type: <span className="text-slate-700 font-medium">{item.participantType}</span>
          </p>
        ) : null
      }
      warningMessage="This will permanently remove the participant and their fund associations."
      errorMessage={errorMessage}
      isDeleting={isDeleting}
      confirmButtonText="Delete Participant"
    />
  );
}
