"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TaskMetadata } from "../types";
import { DeleteNewMeta } from "../api";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import { FileSpreadsheet, FileText, Trash2, Edit, AlertTriangle, X, RefreshCw } from "lucide-react";
import { exportTableToPDF } from "@/lib/pdfExport";

export interface ProcessListProps {
  metadataList: TaskMetadata[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onEditTask?: (task: TaskMetadata) => void;
  onDeleteSuccess?: (deletedId: string | number) => void;
}

export default function ProcessList({
  metadataList = [],
  isLoading = false,
  onRefresh,
  onEditTask,
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
        cell: (info) => <span className="font-bold text-slate-800">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "spName",
        header: "SP Name",
        cell: (info) => (
          <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
            {(info.getValue() as string) || "-"}
          </code>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <span className="text-xs text-slate-600 truncate max-w-xs inline-block">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "returnType",
        header: "Return Type",
        cell: (info) => {
          const type = (info.getValue() as string) || "dataset";
          const isDataset = type === "dataset";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                isDataset ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
              }`}
            >
              {isDataset ? "Data Views" : "Data Process"}
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
            <div className="flex items-center gap-2">
              {onEditTask && (
                <button
                  onClick={() => onEditTask(task)}
                  className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                  title="Edit Metadata"
                  type="button"
                >
                  <Edit size={16} />
                </button>
              )}
              <button
                onClick={() => setDeleteModalTask(task)}
                className="p-1 text-slate-500 hover:text-red-600 transition-colors"
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
    [onEditTask]
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

        <div className="flex items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search metadata..."
            className="w-48 sm:w-60"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to Excel"
              type="button"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to PDF (Task.pdf)"
              type="button"
            >
              <FileText className="h-4 w-4 text-red-500" />
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                title="Refresh list"
                type="button"
              >
                <RefreshCw className={`h-4 w-4 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <ReusableTable
        columns={columns}
        data={filteredList}
        isLoading={isLoading}
        emptyMessage="No metadata task records found."
        enablePagination={true}
        initialPageSize={10}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertTriangle size={20} />
                Delete Task Metadata
              </div>
              <button
                onClick={() => setDeleteModalTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-900">&quot;{deleteModalTask.name}&quot;</span>?
                This action cannot be undone.
              </p>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setDeleteModalTask(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                type="button"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Task"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
