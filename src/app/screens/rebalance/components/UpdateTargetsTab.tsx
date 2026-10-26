"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { RotateCw, Save, FileSpreadsheet, FileText } from "lucide-react";
import ReusableTable from "@/components/common/ReusableTable";
import { exportTableToPDF } from "@/lib/pdfExport";
import { RebalanceDataItem, NewTargetPayloadItem } from "../types";
import { submitNewTargets } from "../api";
import { formateDataCurr, formateDataPrec, currencyFormat } from "../formatters";

interface UpdateTargetsTabProps {
  data: RebalanceDataItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onShowMessage: (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => void;
}

export default function UpdateTargetsTab({
  data,
  isLoading,
  onRefresh,
  onShowMessage,
}: UpdateTargetsTabProps) {
  // Show every row returned by RebalanceData; no participant selection.
  const rows = data;

  // ── newTarget state — keyed by accountID (unique per row) ─────────────────
  // Value is stored as string while user is typing; convert to number on save.
  const [newTargets, setNewTargets] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewTargetChange = (accountID: number, raw: string) => {
    setNewTargets((prev) => ({ ...prev, [accountID]: raw }));
  };

  // ── Derived helpers ────────────────────────────────────────────────────────
  const filledCount = useMemo(
    () =>
      rows.filter((r) => {
        const value = newTargets[r.accountID];
        return value !== undefined && value.trim() !== "";
      }).length,
    [rows, newTargets],
  );

  // The API endpoint is participant-specific, so save edited rows grouped by participant.
  const handleSave = async () => {
    if (filledCount === 0) {
      onShowMessage(
        "info",
        "Enter at least one new target value before saving.",
      );
      return;
    }

    const grouped = new Map<number, NewTargetPayloadItem[]>();
    rows.forEach((row) => {
      const value = newTargets[row.accountID];
      if (value === undefined || value.trim() === "") return;

      const target = Number(value);
      if (!Number.isFinite(target) || target < 0 || target > 100) return;

      const participantPayload = grouped.get(row.participantID) ?? [];
      participantPayload.push({ fundID: row.fundID, newTarget: target });
      grouped.set(row.participantID, participantPayload);
    });

    if (grouped.size === 0) {
      onShowMessage(
        "error",
        "Enter valid target percentages between 0 and 100.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const results = await Promise.all(
        Array.from(grouped.entries()).map(([participantID, payload]) =>
          submitNewTargets(participantID, payload),
        ),
      );
      const failed = results.filter((result) => !result.ok);

      if (failed.length === 0) {
        onShowMessage("success", "Target allocations updated successfully.");
        setNewTargets({});
        onRefresh();
      } else {
        onShowMessage(
          "error",
          `${failed.length} participant update(s) failed. ${failed.map((result) => result.message).join(" ")}`,
        );
      }
    } catch (error) {
      onShowMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to update target allocations.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Export helpers ─────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (rows.length === 0) return;
    const headers = [
      "Fund Code",
      "Fund Name",
      "Balance ($)",
      "Actual %",
      "Target %",
      "New Target %",
    ];
    const exportRows = rows.map((r) => [
      r.fund,
      `"${r.fundName.replace(/"/g, '""')}"`,
      r.marketValue.toFixed(2),
      `${r.actualPct.toFixed(4)}%`,
      `${r.targetPct}%`,
      newTargets[r.accountID] ? `${newTargets[r.accountID]}%` : "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...exportRows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Update_Targets_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (rows.length === 0) return;
    exportTableToPDF({
      fileName: `Update_Targets_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "Update Target Allocations",
      subtitle: `All participants · ${rows.length} fund records`,
      headers: [
        "Fund Code",
        "Fund Name",
        "Balance",
        "Actual %",
        "Target %",
        "New Target %",
      ],
      rows: rows.map((r) => [
        r.fund,
        r.fundName,
        `$${r.marketValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${r.actualPct.toFixed(4)}%`,
        `${r.targetPct}%`,
        newTargets[r.accountID] ? `${newTargets[r.accountID]}%` : "—",
      ]),
      orientation: "landscape",
    });
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<RebalanceDataItem>[]>(
    () => [
      {
        id: "fundCode",
        header: "Fund Code",
        cell: (info) => (
          <span className=" text-[13px] font-bold  tracking-tight">
            {info.row.original.fund}
          </span>
        ),
      },
      {
        accessorKey: "fundName",
        header: "Fund Name",
        cell: (info) => (
          <span className="font-semibold text-slate-800">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "marketValue",
        header: "Balance",
        cell: (info) => (
          <span className="font-semibold text-slate-800">
            {formateDataCurr({ value: info.getValue() })}
          </span>
        ),
      },
      {
        accessorKey: "actualPct",
        header: "Actual %",
        cell: (info) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {formateDataPrec({ value: info.getValue() })}
          </span>
        ),
      },
      {
        accessorKey: "targetPct",
        header: "Target %",
        cell: (info) => (
          <span className="inline-flex items-center rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs font-semibold text-sky-800">
            {formateDataPrec({ value: info.getValue() })}
          </span>
        ),
      },
      {
        id: "newTarget",
        header: "New Target %",
        cell: (info) => {
          const accountID = info.row.original.accountID;
          const val = newTargets[accountID] ?? "";
          return (
            <div className="flex items-center gap-1 max-w-[130px]">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={val}
                placeholder="—"
                onChange={(e) =>
                  handleNewTargetChange(accountID, e.target.value)
                }
                className="form-input-standard text-right text-xs font-bold text-portal-navy w-full"
              />
              {val.trim() !== "" && (
                <span className="text-xs font-semibold text-slate-500 shrink-0">
                  %
                </span>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [newTargets],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 py-3 gap-3">
          <p className="text-xs text-slate-500 font-medium">
            Enter a{" "}
            <span className="font-bold text-slate-700">New Target %</span> for
            the funds you want to update. Leave blank to keep the current
            target.
          </p>

          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Export CSV */}
            <button
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to CSV"
              type="button"
            >
              <div className="relative flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span className="absolute text-[8px] font-black text-emerald-600 right-0 bottom-0 bg-white">
                  X
                </span>
              </div>
            </button>

            {/* Export PDF */}
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

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Refresh"
              type="button"
            >
              <RotateCw
                className={`h-4 w-4 text-slate-700 ${isLoading ? "animate-spin text-portal-navy" : ""}`}
              />
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || filledCount === 0}
              className="flex items-center gap-1.5 rounded-md bg-portal-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {isSubmitting
                ? "Saving..."
                : filledCount > 0
                  ? `Save ${filledCount} Target${filledCount > 1 ? "s" : ""}`
                  : "Save Targets"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="p-2">
          <ReusableTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            emptyMessage="No RebalanceData records found."
            containerClassName="border border-slate-200 shadow-2xs"
            headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
            rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
