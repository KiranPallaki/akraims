"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TaskExecutionResultItem, TaskExecuteResponse } from "../types";
import ReusableTable from "@/components/common/ReusableTable";
import {
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { exportTableToPDF } from "@/lib/pdfExport";
import { formatDate } from "@/lib/dateUtils";

export interface TableDataProps {
  getExecuteValue?: TaskExecuteResponse | null;
  data?: TaskExecutionResultItem[];
  isLoading?: boolean;
  taskTitle?: string;
}

export default function TableData({
  getExecuteValue,
  data: directData,
  isLoading = false,
  taskTitle = "Task Result Grid",
}: TableDataProps) {
  // Extract rows from getExecuteValue or direct props
  const tableRows = useMemo(() => {
    if (directData && directData.length > 0) return directData;
    if (getExecuteValue?.data && Array.isArray(getExecuteValue.data)) {
      return getExecuteValue.data;
    }
    return [];
  }, [getExecuteValue, directData]);

  // Column definitions as specified in PDF Section 18
  const columns = useMemo<ColumnDef<TaskExecutionResultItem>[]>(
    () => [
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: (info) => (
          <span className="font-bold text-slate-800">
            {String(info.getValue() ?? "-")}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => {
          const val = info.getValue() as string;
          return val ? formatDate(val) : "-";
        },
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: (info) => {
          const val = Number(info.getValue() ?? 0);
          return (
            <span className="font-medium text-slate-700">
              $
              {val.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "gainOrLoss",
        header: "Gain / Loss",
        cell: (info) => {
          const val = Number(info.getValue() ?? 0);
          const isPositive = val >= 0;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {isPositive ? "+" : ""}$
              {val.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "marketValue",
        header: "Market Value",
        cell: (info) => {
          const val = Number(info.getValue() ?? 0);
          return (
            <span className="font-bold text-slate-800">
              $
              {val.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: (info) => {
          const val = Number(info.getValue() ?? 0);
          return (
            <span className="font-medium text-slate-700">
              $
              {val.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "qty",
        header: "Qty",
        cell: (info) => (
          <span className="font-medium text-slate-700">
            {Number(info.getValue() ?? 0).toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  );

  // Excel export as specified in PDF Section 18: exportDataAsExcel
  const exportDataAsExcel = () => {
    if (tableRows.length === 0) return;
    const headers = [
      "Symbol",
      "Date",
      "Cost",
      "Gain/Loss",
      "Market Value",
      "Price",
      "Qty",
    ];
    const csvRows = [headers.join(",")];

    tableRows.forEach((row) => {
      const sym = `"${row.symbol || ""}"`;
      const dt = `"${row.date || ""}"`;
      const cost = row.cost ?? 0;
      const gl = row.gainOrLoss ?? 0;
      const mv = row.marketValue ?? 0;
      const pr = row.price ?? 0;
      const qty = row.qty ?? 0;
      csvRows.push([sym, dt, cost, gl, mv, pr, qty].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "TaskDetails.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF export as specified in PDF Section 18: Title "Task Details", file "TaskDetails.pdf"
  const exportDataAsPDF = () => {
    if (tableRows.length === 0) return;
    const headers = [
      "Symbol",
      "Date",
      "Cost",
      "Gain/Loss",
      "Market Value",
      "Price",
      "Qty",
    ];
    const pdfRows = tableRows.map((row) => {
      const formattedDate = row.date ? formatDate(row.date) : "";
      return [
        row.symbol || "",
        formattedDate,
        `$${Number(row.cost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        `$${Number(row.gainOrLoss || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        `$${Number(row.marketValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        `$${Number(row.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        String(row.qty || 0),
      ];
    });

    exportTableToPDF({
      fileName: "TaskDetails.pdf",
      title: "Task Details",
      subtitle: taskTitle,
      headers,
      rows: pdfRows,
      orientation: "portrait",
    });
  };

  const processDesc = getExecuteValue?.processResultDesc;
  const processCode = getExecuteValue?.processResultCode;
  const hasErrors = Boolean(getExecuteValue?.errors);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">{taskTitle}</h3>
          {processDesc && (
            <p className="text-xs text-slate-500 mt-0.5">
              Result Code: {processCode} | {processDesc}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportDataAsExcel}
            disabled={tableRows.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Export to Excel"
            type="button"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Excel
          </button>
          <button
            onClick={exportDataAsPDF}
            disabled={tableRows.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Export to PDF"
            type="button"
          >
            <FileText className="h-4 w-4 text-red-500" />
            PDF
          </button>
        </div>
      </div>

      {/* Execution Error Feedback Banner
      {hasErrors && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>Execution Error: {JSON.stringify(getExecuteValue?.errors)}</span>
        </div>
      )}

      {/* Execution Success Feedback Banner */}
      {/* {getExecuteValue?.ok && !hasErrors && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{getExecuteValue.message || "Process completed successfully."}</span>
        </div>
      )}  */}

      {/* Results Table */}
      <ReusableTable
        columns={columns}
        data={tableRows}
        isLoading={isLoading}
        emptyMessage="No execution results to display. Run a task to populate data."
        enablePagination={true}
        initialPageSize={10}
      />
    </div>
  );
}
