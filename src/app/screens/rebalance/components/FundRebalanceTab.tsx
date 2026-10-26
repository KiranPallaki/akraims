"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  FileSpreadsheet,
  FileText,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  X,
  Scale,
} from "lucide-react";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import { exportTableToPDF } from "@/lib/pdfExport";
import { RebalanceParticipantItem } from "../types";
import {
  formateDataCurr,
  formateDataPrec,
  formateDatabuyCurr,
  formateAsPercent,
  formatLargeCurr,
  currencyFormat,
} from "../formatters";

interface FundRebalanceTabProps {
  data: RebalanceParticipantItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onShowMessage: (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => void;
}

export default function FundRebalanceTab({
  data,
  isLoading,
  onRefresh,
  onShowMessage,
}: FundRebalanceTabProps) {
  // ── 1. Participant Selection & Default ──────────────────────────────────────
  // Distinct participant list based on participantName
  const participantList = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      if (item.participantName) {
        set.add(item.participantName);
      }
    });
    return Array.from(set);
  }, [data]);

  const defaultParticipant = useMemo(() => {
    if (participantList.length === 0) return "";
    const preferred = participantList.find((name) =>
      name.toLowerCase().includes("ak retirement"),
    );
    return preferred ?? participantList[0];
  }, [participantList]);

  const [selectedParticipant, setSelectedParticipant] = useState<string>("");

  useEffect(() => {
    if (participantList.length > 0 && !selectedParticipant) {
      setSelectedParticipant(defaultParticipant);
    }
  }, [participantList, defaultParticipant, selectedParticipant]);

  const effectiveParticipant = selectedParticipant || defaultParticipant;

  // ── 2. Participant Balance & Transfer Type State ────────────────────────────
  // Balance displays the marketValue of the first matching row for selected/default participant
  const participantBalance = useMemo(() => {
    const firstMatch = data.find(
      (d) => d.participantName === effectiveParticipant,
    );
    return firstMatch?.marketValue ?? 0;
  }, [data, effectiveParticipant]);

  // Transfer Type Radio state: "$" or "%" (defaults to "$")
  const [transferType, setTransferType] = useState<"$" | "%">("$");

  // ── 3. Filtered Rows for Selected Participant ──────────────────────────────
  const participantRows = useMemo(() => {
    if (!effectiveParticipant) return [];
    return data.filter((d) => d.participantName === effectiveParticipant);
  }, [data, effectiveParticipant]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return participantRows;
    const q = searchQuery.toLowerCase();
    return participantRows.filter(
      (r) =>
        r.fundName.toLowerCase().includes(q) ||
        (r.symbol && r.symbol.toLowerCase().includes(q)) ||
        (r.fund && r.fund.toLowerCase().includes(q)),
    );
  }, [participantRows, searchQuery]);

  // ── 4. Editable Buy/Sell State & Net Amount Calculation ─────────────────────
  // Keyed by fundID so user can edit the Buy/Sell numeric input
  const [editedBuyOrSell, setEditedBuyOrSell] = useState<Record<number, number>>(
    {},
  );

  // Reset edited values when participant changes
  useEffect(() => {
    setEditedBuyOrSell({});
    setShowErrormsg(false);
  }, [effectiveParticipant]);

  // Calculate Net Buy/Sell across all participant funds
  const netAmount = useMemo(() => {
    return participantRows.reduce((sum, r) => {
      const val =
        editedBuyOrSell[r.fundID] !== undefined
          ? editedBuyOrSell[r.fundID]
          : r.buyOrSell || 0;
      return sum + val;
    }, 0);
  }, [participantRows, editedBuyOrSell]);

  const isBalanced = Math.abs(netAmount) < 0.01;

  // Error Alert State
  const [showErrormsg, setShowErrormsg] = useState(false);

  // ── 5. Portfolio Summary Metrics ───────────────────────────────────────────
  const summaryMetrics = useMemo(() => {
    let totalMarketValue = 0;
    let totalTargetMarketValue = 0;
    let totalActualPct = 0;
    let totalTargetPct = 0;
    let totalBuy = 0;
    let totalSell = 0;

    participantRows.forEach((r) => {
      totalMarketValue += r.marketValue || 0;
      totalTargetMarketValue += r.targetMarketValue || 0;
      totalActualPct += r.actualPct || 0;
      totalTargetPct += r.targetPct || 0;

      const currentVal =
        editedBuyOrSell[r.fundID] !== undefined
          ? editedBuyOrSell[r.fundID]
          : r.buyOrSell || 0;

      if (currentVal > 0) totalBuy += currentVal;
      if (currentVal < 0) totalSell += Math.abs(currentVal);
    });

    return {
      totalMarketValue,
      totalTargetMarketValue,
      totalActualPct,
      totalTargetPct,
      totalBuy,
      totalSell,
    };
  }, [participantRows, editedBuyOrSell]);

  // ── 6. Submit & Cancel Action Handlers ─────────────────────────────────────
  const handleSubmit = () => {
    if (!isBalanced) {
      setShowErrormsg(true);
      onShowMessage(
        "error",
        `Total Buy Or Sell amount should equal to 0. Current net amount = $${currencyFormat(netAmount)}`,
      );
    } else {
      setShowErrormsg(false);
      onShowMessage(
        "success",
        "Fund rebalance trades validated successfully (Zero-Sum reached).",
      );
    }
  };

  const handleCancel = () => {
    setEditedBuyOrSell({});
    setShowErrormsg(false);
    onShowMessage("info", "Buy/Sell trade edits discarded.");
  };

  const handleCloseClick = () => {
    setShowErrormsg(false);
  };

  // ── 7. Export Helpers ──────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (filteredRows.length === 0) return;
    const headers = [
      "Participant",
      "Fund Name",
      "Balances ($)",
      "Actual %",
      "Target Market Value ($)",
      "Target %",
      "Buy / Sell ($)",
    ];
    const rows = filteredRows.map((r) => {
      const currentBuyOrSell =
        editedBuyOrSell[r.fundID] !== undefined
          ? editedBuyOrSell[r.fundID]
          : r.buyOrSell || 0;
      return [
        `"${effectiveParticipant.replace(/"/g, '""')}"`,
        `"${r.fundName.replace(/"/g, '""')}"`,
        r.marketValue !== null ? currencyFormat(r.marketValue) : "NA",
        r.actualPct !== null ? formateAsPercent(r.actualPct) : "NA",
        r.targetMarketValue !== null ? currencyFormat(r.targetMarketValue) : "NA",
        r.targetPct !== null ? formateAsPercent(r.targetPct) : "NA",
        currentBuyOrSell >= 0
          ? `+${currencyFormat(currentBuyOrSell)}`
          : `(${currencyFormat(Math.abs(currentBuyOrSell))})`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Fund_Rebalance_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredRows.length === 0) return;
    const headers = [
      "Fund",
      "Balances",
      "Actual %",
      "Target Market Value",
      "Target %",
      "Buy / Sell",
    ];
    const rows = filteredRows.map((r) => {
      const currentBuyOrSell =
        editedBuyOrSell[r.fundID] !== undefined
          ? editedBuyOrSell[r.fundID]
          : r.buyOrSell || 0;
      return [
        r.fundName,
        r.marketValue !== null
          ? r.marketValue >= 0
            ? `$${currencyFormat(r.marketValue)}`
            : `($${currencyFormat(Math.abs(r.marketValue))})`
          : "NA",
        r.actualPct !== null ? formateAsPercent(r.actualPct) : "NA",
        r.targetMarketValue !== null
          ? r.targetMarketValue >= 0
            ? `$${currencyFormat(r.targetMarketValue)}`
            : `($${currencyFormat(Math.abs(r.targetMarketValue))})`
          : "NA",
        r.targetPct !== null ? formateAsPercent(r.targetPct) : "NA",
        currentBuyOrSell > 0
          ? `+$${currencyFormat(currentBuyOrSell)}`
          : currentBuyOrSell < 0
          ? `-$${currencyFormat(Math.abs(currentBuyOrSell))}`
          : "$0.00",
      ];
    });

    exportTableToPDF({
      fileName: `Fund_Rebalance_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "Fund Rebalance Trades",
      subtitle: `Participant: ${effectiveParticipant} | Balance: $${currencyFormat(participantBalance)}`,
      headers,
      rows,
      orientation: "landscape",
    });
  };

  // ── 8. Table Columns per Specification ─────────────────────────────────────
  const columns = useMemo<ColumnDef<RebalanceParticipantItem>[]>(
    () => [
      {
        accessorKey: "fundName",
        header: "Fund",
        cell: (info) => (
          <div>
            <span className="font-semibold text-slate-800">
              {info.getValue() as string}
            </span>
            {info.row.original.symbol && (
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                {info.row.original.symbol}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "marketValue",
        header: "Balances",
        cell: (info) => {
          const val = info.getValue() as number | null;
          if (val === null || val === undefined) {
            return <span className="text-slate-400">NA</span>;
          }
          return val >= 0 ? (
            <span className="font-semibold text-slate-800">
              ${currencyFormat(val)}
            </span>
          ) : (
            <span className="text-red-600 font-semibold">
              (${currencyFormat(Math.abs(val))})
            </span>
          );
        },
      },
      {
        accessorKey: "actualPct",
        header: "Actual %",
        cell: (info) => {
          const val = info.getValue() as number | null;
          if (val === null || val === undefined) {
            return <span className="text-slate-400">NA</span>;
          }
          return val >= 0 ? (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {formateAsPercent(val)}
            </span>
          ) : (
            <span className="text-red-600 font-semibold">
              ({formateAsPercent(val).slice(1)})
            </span>
          );
        },
      },
      {
        accessorKey: "targetMarketValue",
        header: "Target Market Value",
        cell: (info) => {
          const val = info.getValue() as number | null;
          if (val === null || val === undefined) {
            return <span className="text-slate-400">NA</span>;
          }
          return val >= 0 ? (
            <span className="font-semibold text-portal-navy">
              ${currencyFormat(val)}
            </span>
          ) : (
            <span className="text-red-600 font-semibold">
              (${currencyFormat(Math.abs(val))})
            </span>
          );
        },
      },
      {
        accessorKey: "targetPct",
        header: "Target %",
        cell: (info) => {
          const val = info.getValue() as number | null;
          if (val === null || val === undefined) {
            return <span className="text-slate-400">NA</span>;
          }
          return val >= 0 ? (
            <input
              type="text"
              readOnly
              value=""
              placeholder={formateAsPercent(val)}
              className="form-input-standard py-1 px-2 text-xs font-medium text-slate-700 w-20 bg-slate-50 cursor-default text-right"
            />
          ) : (
            <span className="text-red-600 font-semibold">
              ({formateAsPercent(val).slice(1)})
            </span>
          );
        },
      },
      {
        accessorKey: "buyOrSell",
        header: "Buy / Sell",
        cell: (info) => {
          const fundID = info.row.original.fundID;
          const currentVal =
            editedBuyOrSell[fundID] !== undefined
              ? editedBuyOrSell[fundID]
              : info.row.original.buyOrSell ?? 0;

          return (
            <div className="flex items-center gap-1.5 min-w-[130px]">
              <input
                type="number"
                step="0.01"
                value={currentVal}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  setEditedBuyOrSell((prev) => ({
                    ...prev,
                    [fundID]: isNaN(num) ? 0 : num,
                  }));
                }}
                className="form-input-standard py-1 px-2 text-xs font-semibold text-slate-800 w-28 text-right"
              />
              {currentVal !== 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    currentVal > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {currentVal > 0 ? "Buy" : "Sell"}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [editedBuyOrSell],
  );

  return (
    <div className="space-y-4 font-sans">
      {/* ── Top Header & Participant Selector Card ───────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Scale className="h-5 w-5 text-portal-navy" />
              Fund Rebalance Trades
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review allocations and execute zero-sum rebalancing trades
            </p>
          </div>

          {/* Transfer Type Radios ($ and %) */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-semibold text-slate-600">
              Transfer Type:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="radio"
                name="fundRebalanceTransferType"
                value="$"
                checked={transferType === "$"}
                onChange={() => setTransferType("$")}
                className="h-3.5 w-3.5 accent-portal-navy"
              />
              <span>Dollar ($)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="radio"
                name="fundRebalanceTransferType"
                value="%"
                checked={transferType === "%"}
                onChange={() => setTransferType("%")}
                className="h-3.5 w-3.5 accent-portal-navy"
              />
              <span>Percentage (%)</span>
            </label>
          </div>
        </div>

        {/* Participant & Balance Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="form-label mb-0 whitespace-nowrap font-semibold text-slate-700">
              Participant:
            </label>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="form-input-standard sm:w-80 font-medium"
            >
              <option value="">Select</option>
              {participantList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Balance:
              </span>
              <span className="text-base font-extrabold text-portal-navy">
                ${currencyFormat(participantBalance)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Funds:</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {participantRows.length}
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert when showErrormsg is true */}
        {showErrormsg && (
          <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>
                Total Buy Or Sell amount should equal to 0. Current net amount ={" "}
                <strong className="underline">
                  {netAmount >= 0
                    ? `$${currencyFormat(netAmount)}`
                    : `($${currencyFormat(Math.abs(netAmount))})`}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseClick}
              className="text-red-500 hover:text-red-700 p-1 rounded-md transition-colors"
              title="Close alert"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Portfolio Balance
            </span>
            <span className="text-base font-bold text-slate-800 mt-1 block">
              ${currencyFormat(summaryMetrics.totalMarketValue)}
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Target Market Value
            </span>
            <span className="text-base font-bold text-portal-navy mt-1 block">
              ${currencyFormat(summaryMetrics.totalTargetMarketValue)}
            </span>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Total Buy Required
            </span>
            <span className="text-base font-bold text-emerald-700 mt-1 block">
              +${currencyFormat(summaryMetrics.totalBuy)}
            </span>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
            <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider block">
              Total Sell Required
            </span>
            <span className="text-base font-bold text-red-700 mt-1 block">
              -${currencyFormat(summaryMetrics.totalSell)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Table Card ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 py-3 gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search funds or symbol..."
            className="w-full sm:w-72"
          />

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
              onClick={onRefresh}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Refresh"
              type="button"
            >
              <RotateCw
                className={`h-4 w-4 text-slate-700 ${isLoading ? "animate-spin text-portal-navy" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Table Body using existing ReusableTable component */}
        <div className="p-2">
          <ReusableTable
            columns={columns}
            data={filteredRows}
            isLoading={isLoading}
            emptyMessage="No rebalance rows found for this participant."
            containerClassName="border border-slate-200 shadow-2xs"
            headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
            rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
          />
        </div>

        {/* Table Footer with Cancel and Submit buttons */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-portal-navy px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors"
          >
            <CheckCircle2 size={14} />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
