"use client";

import React from "react";
import CreateMetaDataForm from "./CreateMetaDataForm";
import SlideOverDrawer from "@/components/common/SlideOverDrawer";
import { TaskMetadata } from "../types";

export interface CreateTaskProps {
  isOpen?: boolean;
  initialTask?: TaskMetadata | null;
  onClose: () => void;
  onSuccess: (savedTask: TaskMetadata) => void;
  clientID?: number;
  asDrawer?: boolean;
}

export default function CreateTask({
  isOpen = true,
  initialTask,
  onClose,
  onSuccess,
  clientID,
  asDrawer = true,
}: CreateTaskProps) {
  if (asDrawer) {
    return (
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={initialTask ? `Edit Task: ${initialTask.name}` : "Create Task / Metadata"}
        subtitle="Configure metadata execution parameters, export flags, and stored procedure schemas"
        maxWidth="max-w-5xl"
        showHeader={false}
      >
        <CreateMetaDataForm
          initialTask={initialTask}
          onClose={onClose}
          onSuccess={onSuccess}
          clientID={clientID}
        />
      </SlideOverDrawer>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <CreateMetaDataForm
        initialTask={initialTask}
        onClose={onClose}
        onSuccess={onSuccess}
        clientID={clientID}
      />
    </div>
  );
}
