"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { fetchMetadataList, DeleteNewMeta } from "../task/api";
import { TaskMetadata } from "../task/types";
import CreateTask from "../task/components/CreateTask";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import ConstantMessageBanner from "@/components/common/ConstantMessageBanner";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { exportTableToPDF } from "@/lib/pdfExport";
import {
  Plus,
  RotateCw,
  FileSpreadsheet,
  FileText,
  Edit,
  Trash2,
  Play,
} from "lucide-react";

export default function CreateTaskScreenPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskMetadata | null>(null);
  const [deleteModalTask, setDeleteModalTask] = useState<TaskMetadata | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  const clientID = client?.clientID;

  // 1. Fetch Metadata Tasks List
  const {
    data: metadataList = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<TaskMetadata[]>({
    queryKey: ["metadataList", clientID],
    queryFn: () => fetchMetadataList(clientID),
    staleTime: 1000 * 60 * 3,
  });

  // 2. Global search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return metadataList;
    const q = searchQuery.toLowerCase();
    return metadataList.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.spName || "").toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q) ||
        (m.returnType || "").toLowerCase().includes(q),
    );
  }, [metadataList, searchQuery]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (task: TaskMetadata) => {
    setEditingTask(task);
    setIsDrawerOpen(true);
  };

  const handleDelete = (task: TaskMetadata) => {
    setDeleteModalTask(task);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalTask) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await DeleteNewMeta(deleteModalTask.id);
    setIsDeleting(false);

    if (res.ok) {
      setFeedbackBanner({
        type: "success",
        message: `Task "${deleteModalTask.name}" was successfully removed.`,
      });
      setDeleteModalTask(null);
      refetch();
    } else {
      setDeleteError(res.message || "Failed to delete task metadata.");
    }
  };

  const handleRunTask = (task: TaskMetadata) => {
    router.push(`/screens/task?taskId=${task.id}`);
  };

  // Export handlers matching fund and participant screens
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const headers = ["Name", "SP Name", "Description", "Return Type"];
    const rows = filteredData.map((row) => [
      `"${(row.name || "").replace(/"/g, '""')}"`,
      `"${(row.spName || "").replace(/"/g, '""')}"`,
      `"${(row.description || "").replace(/"/g, '""')}"`,
      `"${(row.returnType || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Task_Directory_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const headers = ["Name", "SP Name", "Description", "Return Type"];
    const rows = filteredData.map((row) => [
      row.name || "-",
      row.spName || "-",
      row.description || "-",
      row.returnType === "dataprocess" ? "Data Process" : "Data Views",
    ]);

    exportTableToPDF({
      fileName: "Task.pdf",
      title: "Process & Task Directory",
      subtitle: `AKRA IMS - ${client?.clientName || "Selected Client"}`,
      headers,
      rows,
      orientation: "landscape",
    });
  };

  // Pre-defined table columns matching design system
  const columns = useMemo<ColumnDef<TaskMetadata>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => (
          <span className="font-semibold text-slate-800">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "spName",
        header: "SP Name",
        cell: (info) => (
          <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
            {(info.getValue() as string) || "-"}
          </code>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <span className="text-slate-600 truncate max-w-xs inline-block">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "returnType",
        header: "Return Type",
        cell: (info) => {
          const type = (info.getValue() as string) || "dataset";
          return (
            <span className="text-slate-700 font-normal">
              {type === "dataprocess" ? "Data Process" : "Data Views"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const task = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleRunTask(task)}
                className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Run Task"
                type="button"
              >
                <Play size={15} />
              </button>
              <button
                onClick={() => handleEdit(task)}
                className="btn-action-edit"
                title="Edit Task / Metadata"
                type="button"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(task)}
                className="btn-action-delete"
                title="Delete Task"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <ConstantMessageBanner
          message={feedbackBanner.message}
          type={feedbackBanner.type}
          onClose={() => setFeedbackBanner(null)}
        />
      )}

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar: Search & Action Buttons matching fund/participant */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 py-3 gap-3">
          {/* SearchBar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks..."
            className="w-full sm:w-72"
          />

          {/* Action Buttons: Export, Refresh & Add */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to Excel / CSV"
              type="button"
            >
              <div className="relative flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span className="absolute text-[8px] font-black text-emerald-600 right-0 bottom-0 bg-white">
                  X
                </span>
              </div>
            </button>

            <button
              onClick={handleExportPDF}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to PDF"
              type="button"
            >
              <div className="relative flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-500" />
                <span className="absolute text-[7px] font-black text-red-500 -right-1 -bottom-0.5 bg-white">
                  PDF
                </span>
              </div>
            </button>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Refresh Data"
              type="button"
            >
              <RotateCw
                className={`h-4 w-4 text-slate-700 ${
                  isFetching ? "animate-spin text-portal-navy" : ""
                }`}
              />
            </button>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 rounded-md bg-portal-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors"
              >
                <Plus size={16} /> Create Task
              </button>
            </div>
          </div>
        </div>

        {/* Data Table with Sorting and Pagination matching predefined screens */}
        <div className="p-2">
          <ReusableTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            emptyMessage="No metadata task records found."
            containerClassName="border border-slate-200 shadow-2xs"
            headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200"
            rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
          />
        </div>
      </div>

      {/* Slide-over Side Bar Drawer for Create / Edit Task Form */}
      <CreateTask
        isOpen={isDrawerOpen}
        initialTask={editingTask}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingTask(null);
        }}
        onSuccess={(savedTask) => {
          setIsDrawerOpen(false);
          setEditingTask(null);
          refetch();
          setFeedbackBanner({
            type: "success",
            message: `Task "${savedTask.name}" was successfully saved.`,
          });
        }}
        clientID={clientID}
        asDrawer={true}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteModalTask)}
        onClose={() => {
          setDeleteModalTask(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        itemName={deleteModalTask?.name}
        warningMessage="This action cannot be undone. Stored procedure parameter bindings will also be removed."
        errorMessage={deleteError}
        isDeleting={isDeleting}
        confirmButtonText="Delete Task"
      />
    </div>
  );
}
