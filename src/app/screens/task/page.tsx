"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import {
  fetchMetadataList,
  fetchTaskParameters,
  fetchFundLookup,
  fetchParticipantLookup,
  submitDatasetDownload,
  submitDataProcessExecute,
} from "./api";
import {
  TaskMetadata,
  TaskReturnType,
  TaskExecuteResponse,
  FundLookupItem,
  ParticipantLookupItem,
  TaskParameter,
} from "./types";
import TaskForm from "./components/TaskForm";
import TableData from "./components/TableData";
import ConstantMessageBanner from "@/components/common/ConstantMessageBanner";

export default function TaskPage() {
  const [client, setClient] = useState<Client | null>(null);

  // Selected radio returnType: "dataset" (Data Views) vs "dataprocess" (Data Process)
  const [returnType, setReturnType] = useState<TaskReturnType>("dataset");

  // Selected metadata task
  const [selectedTask, setSelectedTask] = useState<TaskMetadata | null>(null);

  // Execution state & result
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [executeResult, setExecuteResult] =
    useState<TaskExecuteResponse | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  const clientID = client?.clientID;

  // 1. Fetch Metadata List from API
  const {
    data: metadataList = [],
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useQuery<TaskMetadata[]>({
    queryKey: ["metadataList", clientID],
    queryFn: () => fetchMetadataList(clientID),
    staleTime: 1000 * 60 * 5,
  });

  // Auto-select task if navigated from create-task or directory with taskId
  useEffect(() => {
    if (typeof window !== "undefined" && metadataList.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const taskId = params.get("taskId");
      if (taskId) {
        const found = metadataList.find((m) => String(m.id) === String(taskId));
        if (found) {
          setSelectedTask(found);
          setReturnType(found.returnType || "dataset");
        }
      }
    }
  }, [metadataList]);

  // 2. Fetch Fund Lookup from API
  const { data: fundList = [], isLoading: isLoadingFunds } = useQuery<
    FundLookupItem[]
  >({
    queryKey: ["taskFundLookup", clientID],
    queryFn: () => fetchFundLookup(clientID),
    staleTime: 1000 * 60 * 5,
  });

  // 3. Fetch Participant Lookup from API
  const { data: participantList = [], isLoading: isLoadingParticipants } =
    useQuery<ParticipantLookupItem[]>({
      queryKey: ["taskParticipantLookup", clientID],
      queryFn: () => fetchParticipantLookup(clientID),
      staleTime: 1000 * 60 * 5,
    });

  // 4. Fetch Parameters when selectedTask changes
  const selectedTaskId = selectedTask ? String(selectedTask.id) : null;
  const { data: parameters = [], isLoading: isLoadingParameters } = useQuery<
    TaskParameter[]
  >({
    queryKey: ["taskParameters", selectedTaskId, clientID],
    queryFn: () =>
      selectedTaskId
        ? fetchTaskParameters(selectedTaskId, clientID)
        : Promise.resolve([]),
    enabled: Boolean(selectedTaskId),
    staleTime: 1000 * 60 * 5,
  });

  // Handle Form Submission
  const handleFormSubmit = async (
    formData: Record<string, any>,
    downloadType?: string,
  ) => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    setApiError(null);
    setFeedbackBanner(null);

    try {
      if (returnType === "dataset") {
        // Dataset / Data Views Submit Flow: Calls download endpoint and triggers file save
        const dlType = downloadType || "excel";
        const res = await submitDatasetDownload(
          selectedTask.id,
          dlType,
          formData,
          clientID,
        );

        setIsSubmitting(false);
        if (res.ok && res.blob) {
          const url = URL.createObjectURL(res.blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            res.fileName ||
              `TaskDetails.${dlType === "excel" ? "xlsx" : dlType}`,
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setFeedbackBanner({
            type: "success",
            message: `Successfully generated and downloaded ${selectedTask.name} (${dlType.toUpperCase()}) report!`,
          });
        } else {
          setApiError(res.message || "Failed to download task dataset.");
        }
      } else {
        // Data Process Submit Flow: Calls execute endpoint and updates result grid
        const res = await submitDataProcessExecute(
          selectedTask.id,
          formData,
          clientID,
        );

        setIsSubmitting(false);
        setExecuteResult(res);

        if (res.ok) {
          setFeedbackBanner({
            type: "success",
            message:
              res.message ||
              `Successfully executed ${selectedTask.name} process!`,
          });
        } else {
          setApiError(res.message || "Failed to execute data process.");
        }
      }
    } catch (err) {
      setIsSubmitting(false);
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setApiError(msg);
    }
  };

  const handleFormCancel = () => {
    setSelectedTask(null);
    setExecuteResult(null);
    setApiError(null);
    setFeedbackBanner(null);
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Task Form Component */}
      <TaskForm
        metadataList={metadataList}
        isLoadingMetadata={isLoadingMetadata}
        fundList={fundList}
        isLoadingFunds={isLoadingFunds}
        participantList={participantList}
        isLoadingParticipants={isLoadingParticipants}
        parameters={parameters}
        isLoadingParameters={isLoadingParameters}
        selectedTask={selectedTask}
        onSelectTask={setSelectedTask}
        onReturnTypeChange={setReturnType}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        isSubmitting={isSubmitting}
        apiError={apiError}
        feedbackBanner={feedbackBanner}
      />

      {/* Task Execution Result Grid Component (TableData) */}
      {returnType === "dataprocess" && (
        <div className="w-full">
          {/* Execution results if applicable */}
        </div>
      )}
    </div>
  );
}
