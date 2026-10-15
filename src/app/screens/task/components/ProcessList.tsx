"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TaskMetadata } from "../types";
import { DeleteNewMeta } from "../api";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import { FileSpreadsheet, FileText, Trash2, Edit, Plus, RotateCw, Play, SlidersHorizontal } from "lucide-react";
import { exportTableToPDF } from "@/lib/pdfExport";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

export interface ProcessListProps {
  metadataList: TaskMetadata[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddTask?: () => void;
  onCreateTask?: () => void;
  onEditTask?: (task: TaskMetadata) => void;
  onRunTask?: (task: TaskMetadata) => void;
  onDeleteSuccess?: (deletedId: string | number) => void;
}

export default function ProcessList({
  metadataList = [],
  isLoading = false,
  onRefresh,
  onAddTask,
  onCreateTask,
  onEditTask,
  onRunTask,
  onDeleteSuccess,
}: ProcessListProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteModalTask, setDeleteModalTask] = useState<TaskMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Search filtering
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return metadataList;
    const q = searchQuery.toLowerCase();
    return metadataList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.spName || "").toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q)
    );
  }, [metadataList, searchQuery]);

  // Handle delete execution
  const confirmDelete = async () => {
    if (!deleteModalTask) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await DeleteNewMeta(deleteModalTask.id);
    setIsDeleting(false);

    if (res.ok) {
      if (onDeleteSuccess) onDeleteSuccess(deleteModalTask.id);
      if (onRefresh) onRefresh();
      setDeleteModalTask(null);
    } else {
      setDeleteError(res.message || "Failed to delete metadata record.");
    }
  };

  // CSV / Excel Export
  const handleExportExcel = () => {
    if (filteredList.length === 0) return;
    const headers = ["Name", "SP Name", "Description", "Return Type"];
    const csvRows = [headers.join(",")];

    filteredList.forEach((row) => {
      const nm = `"${(row.name || "").replace(/"/g, '""')}"`;
      const sp = `"${(row.spName || "").replace(/"/g, '""')}"`;
      const desc = `"${(row.description || "").replace(/"/g, '""')}"`;
      const type = `"${(row.returnType || "").replace(/"/g, '""')}"`;
      csvRows.push([nm, sp, desc, type].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Task.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export as specified in PDF Section 19: Output document named Task.pdf
  const handleExportPDF = () => {
    if (filteredList.length === 0) return;
    const headers = ["Name", "SP Name", "Description", "Return Type"];
    const pdfRows = filteredList.map((row) => [
      row.name || "",
      row.spName || "",
      row.description || "",
      row.returnType || "",
    ]);

    exportTableToPDF({
      fileName: "Task.pdf",
      title: "Process & Task Metadata List",
      subtitle: "AKRA IMS Metadata Administration",
      headers,
      rows: pdfRows,
      orientation: "landscape",
    });
  };

  // Grid columns specified in Section 19: Name, SP Name, Description, Actions
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
              {onRunTask && (
                <button
                  onClick={() => onRunTask(task)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Run Task"
                  type="button"
                >
                  <Play size={15} />
                </button>
              )}
              {onEditTask && (
                <button
                  onClick={() => onEditTask(task)}
                  className="btn-action-edit"
                  title="Edit Task / Metadata"
                  type="button"
                >
                  <Edit size={16} />
                </button>
              )}
              <button
                onClick={() => setDeleteModalTask(task)}
                className="btn-action-delete"
                title="Delete Metadata"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [onEditTask, onRunTask]
  );

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Process & Task Directory</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage metadata task definitions and stored procedure bindings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search metadata..."
            className="w-48 sm:w-60"
          />

          <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
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
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                title="Refresh Data"
                type="button"
              >
                <RotateCw
                  className={`h-4 w-4 text-slate-700 ${
                    isLoading ? "animate-spin text-portal-navy" : ""
                  }`}
                />
              </button>
            )}
          </div>

          {(onCreateTask || onAddTask) && (
            <button
              type="button"
              onClick={onCreateTask || onAddTask}
              className="flex items-center gap-1.5 rounded-md bg-portal-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors"
            >
              <Plus size={16} /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="p-2">
        <ReusableTable
          columns={columns}
          data={filteredList}
          isLoading={isLoading}
          emptyMessage="No metadata task records found."
          containerClassName="border border-slate-200 shadow-2xs"
          headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
          rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
        />
      </div>

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteModalTask)}
        onClose={() => {
          setDeleteModalTask(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Task Metadata"
        itemName={deleteModalTask?.name}
        warningMessage="This action cannot be undone. Any parameters and export bindings will also be removed."
        errorMessage={deleteError}
        isDeleting={isDeleting}
        confirmButtonText="Delete Task"
      />
    </div>
  );
}

