"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  FileSpreadsheet,
  FileText,
  RotateCw,
  Globe2,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Send,
} from "lucide-react";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import { exportTableToPDF } from "@/lib/pdfExport";
import { CountryRebalanceItem, CountryRebalanceTradeItem } from "../types";

interface CountryRebalanceTabProps {
  countryData: CountryRebalanceItem[];
  tradesData: CountryRebalanceTradeItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onShowMessage: (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => void;
}

export default function CountryRebalanceTab({
  countryData = [],
  tradesData = [],
  isLoading,
  onRefresh,
  onShowMessage,
}: CountryRebalanceTabProps) {
  const [viewMode, setViewMode] = useState<"overview" | "trades">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlacingTrades, setIsPlacingTrades] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filtered country overview rows
  const filteredCountries = useMemo(() => {
    if (!countryData || !Array.isArray(countryData)) return [];
    if (!searchQuery.trim()) return countryData;
    const q = searchQuery.toLowerCase();
    return countryData.filter(
      (c) =>
        c.countryName.toLowerCase().includes(q) ||
        (c.countryCode && c.countryCode.toLowerCase().includes(q)),
    );
  }, [countryData, searchQuery]);

  // Filtered trade rows
  const filteredTrades = useMemo(() => {
    if (!tradesData || !Array.isArray(tradesData)) return [];
    if (!searchQuery.trim()) return tradesData;
    const q = searchQuery.toLowerCase();
    return tradesData.filter(
      (t) =>
        t.countryName.toLowerCase().includes(q) ||
        t.action.toLowerCase().includes(q) ||
        t.orderType.toLowerCase().includes(q),
    );
  }, [tradesData, searchQuery]);

  // Metrics
  const countryMetrics = useMemo(() => {
    let totalBalance = 0;
    let totalTargetBalance = 0;
    let buyCount = 0;
    let sellCount = 0;

    (countryData || []).forEach((c) => {
      totalBalance += c.balanceByCountry || 0;
      totalTargetBalance += c.targetBalance || 0;
      if (c.buyOrSell > 0) buyCount++;
      if (c.buyOrSell < 0) sellCount++;
    });

    return {
      totalBalance,
      totalTargetBalance,
      countriesCount: countryData.length,
      rebalanceNeeded: buyCount + sellCount,
    };
  }, [countryData]);

  // Handle Place Trades Simulation
  const handlePlaceTrades = async () => {
    setIsPlacingTrades(true);
    setShowConfirmModal(false);

    // Simulate API placement delay
    setTimeout(() => {
      setIsPlacingTrades(false);
      onShowMessage(
        "success",
        `Successfully placed ${tradesData.length} rebalance trade orders into the order execution queue.`,
      );
    }, 800);
  };

  // Export to Excel / CSV with null/empty guard
  const handleExportExcel = () => {
    if (viewMode === "overview") {
      if (!filteredCountries || filteredCountries.length === 0) {
        onShowMessage("warning", "No country data available to export.");
        return;
      }
      const headers = [
        "Country Name",
        "Code",
        "Balance by Country ($)",
        "Country Holdings %",
        "Target %",
        "Target Balance ($)",
        "Buy / Sell ($)",
      ];
      const rows = filteredCountries.map((c) => [
        `"${c.countryName.replace(/"/g, '""')}"`,
        c.countryCode || "--",
        (c.balanceByCountry || 0).toFixed(2),
        `${(c.countryHoldingsPct || 0).toFixed(2)}%`,
        `${(c.targetPct || 0).toFixed(2)}%`,
        (c.targetBalance || 0).toFixed(2),
        c.buyOrSell >= 0 ? `+${(c.buyOrSell || 0).toFixed(2)}` : (c.buyOrSell || 0).toFixed(2),
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Country_Rebalance_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (!filteredTrades || filteredTrades.length === 0) {
        onShowMessage("warning", "No trades data available to export.");
        return;
      }
      const headers = ["Trade ID", "Country", "Action", "Shares", "Trade Amount ($)", "Order Type", "Status"];
      const rows = filteredTrades.map((t) => [
        t.tradeID,
        `"${t.countryName.replace(/"/g, '""')}"`,
        t.action,
        t.shares,
        (t.tradeAmount || 0).toFixed(2),
        t.orderType,
        t.status,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Country_Rebalance_Trades_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Export to PDF with null/empty guard
  const handleExportPDF = () => {
    if (viewMode === "overview") {
      if (!filteredCountries || filteredCountries.length === 0) {
        onShowMessage("warning", "No country data available to export.");
        return;
      }
      const headers = [
        "Country Name",
        "Balance By Country",
        "Holdings %",
        "Target %",
        "Target Balance",
        "Buy / Sell",
      ];
      const rows = filteredCountries.map((c) => [
        c.countryName,
        `$${(c.balanceByCountry || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${(c.countryHoldingsPct || 0).toFixed(2)}%`,
        `${(c.targetPct || 0).toFixed(2)}%`,
        `$${(c.targetBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        c.buyOrSell > 0
          ? `+$${c.buyOrSell.toLocaleString("en-US", { minimumFractionDigits: 2 })} Buy`
          : c.buyOrSell < 0
          ? `-$${Math.abs(c.buyOrSell).toLocaleString("en-US", { minimumFractionDigits: 2 })} Sell`
          : "$0.00",
      ]);

      exportTableToPDF({
        fileName: `Country_Rebalance_${new Date().toISOString().slice(0, 10)}.pdf`,
        title: "Country Rebalance Report",
        subtitle: `Total Portfolio Balance: $${countryMetrics.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        headers,
        rows,
        orientation: "landscape",
      });
    } else {
      if (!filteredTrades || filteredTrades.length === 0) {
        onShowMessage("warning", "No trades data available to export.");
        return;
      }
      const headers = ["Trade ID", "Country", "Action", "Shares", "Trade Amount", "Order Type", "Status"];
      const rows = filteredTrades.map((t) => [
        String(t.tradeID),
        t.countryName,
        t.action,
        t.shares.toLocaleString("en-US"),
        `$${(t.tradeAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        t.orderType,
        t.status,
      ]);

      exportTableToPDF({
        fileName: `Country_Rebalance_Trades_${new Date().toISOString().slice(0, 10)}.pdf`,
        title: "Country Rebalance - Trade Orders",
        subtitle: `Total Orders: ${tradesData.length}`,
        headers,
        rows,
        orientation: "landscape",
      });
    }
  };

  // Overview Table Columns
  const countryColumns = useMemo<ColumnDef<CountryRebalanceItem>[]>(
    () => [
      {
        accessorKey: "countryName",
        header: "Country Name",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Globe2 size={15} className="text-portal-navy" />
            <span className="font-semibold text-slate-800">{info.getValue() as string}</span>
            {info.row.original.countryCode && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                {info.row.original.countryCode}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "balanceByCountry",
        header: "Balance By Country",
        cell: (info) => (
          <span className="font-semibold text-slate-800">
            ${Number(info.getValue() || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: "countryHoldingsPct",
        header: "Holdings %",
        cell: (info) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {Number(info.getValue() || 0).toFixed(2)}%
          </span>
        ),
      },
      {
        accessorKey: "targetPct",
        header: "Target %",
        cell: (info) => (
          <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200">
            {Number(info.getValue() || 0).toFixed(2)}%
          </span>
        ),
      },
      {
        accessorKey: "targetBalance",
        header: "Target Balance",
        cell: (info) => (
          <span className="font-semibold text-portal-navy">
            ${Number(info.getValue() || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: "buyOrSell",
        header: "Buy / Sell",
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          if (val > 0) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <ArrowUpRight size={13} className="text-emerald-600" />
                +${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Buy
              </span>
            );
          } else if (val < 0) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                <ArrowDownRight size={13} className="text-red-600" />
                -${Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Sell
              </span>
            );
          } else {
            return <span className="text-xs font-medium text-slate-400">Balanced ($0.00)</span>;
          }
        },
      },
    ],
    [],
  );

  // Trades Table Columns
  const tradeColumns = useMemo<ColumnDef<CountryRebalanceTradeItem>[]>(
    () => [
      {
        accessorKey: "tradeID",
        header: "Trade ID",
        cell: (info) => <span className="font-mono text-xs font-semibold text-slate-600">#{info.getValue() as number}</span>,
      },
      {
        accessorKey: "countryName",
        header: "Country",
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: (info) => {
          const action = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                action === "BUY"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {action}
            </span>
          );
        },
      },
      {
        accessorKey: "shares",
        header: "Shares / Qty",
        cell: (info) => (
          <span className="font-semibold text-slate-800">
            {Number(info.getValue() || 0).toLocaleString("en-US")}
          </span>
        ),
      },
      {
        accessorKey: "tradeAmount",
        header: "Trade Amount",
        cell: (info) => (
          <span className="font-bold text-portal-navy">
            ${Number(info.getValue() || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: "orderType",
        header: "Order Type",
        cell: (info) => <span className="text-xs font-medium text-slate-700">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            {info.getValue() as string}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Header Summary & View Mode Switcher */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-portal-navy/10 text-portal-navy">
              <Globe2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {viewMode === "overview" ? "Country Allocation Overview" : "Country Rebalance - Trade Orders"}
              </h3>
              <p className="text-xs text-slate-500">
                {viewMode === "overview"
                  ? "Geographic country holdings, targets, and calculated rebalance needs"
                  : "Staged trades ready for execution to rebalance geographic exposure"}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode("overview")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === "overview"
                    ? "bg-portal-navy text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers size={13} /> Country Overview
              </button>
              <button
                type="button"
                onClick={() => setViewMode("trades")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === "trades"
                    ? "bg-portal-navy text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowRightLeft size={13} /> Rebalance Trades ({tradesData.length})
              </button>
            </div>

            {viewMode === "trades" && (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isPlacingTrades || tradesData.length === 0}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:opacity-90 disabled:opacity-50 transition-colors"
              >
                <Send size={13} />
                {isPlacingTrades ? "Placing..." : "Place Trades"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 py-3 gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={viewMode === "overview" ? "Search country or code..." : "Search trades..."}
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
              <RotateCw className={`h-4 w-4 text-slate-700 ${isLoading ? "animate-spin text-portal-navy" : ""}`} />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="p-2">
          {viewMode === "overview" ? (
            <ReusableTable
              columns={countryColumns}
              data={filteredCountries}
              isLoading={isLoading}
              emptyMessage="No country rebalance data found."
              containerClassName="border border-slate-200 shadow-2xs"
              headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
              rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
            />
          ) : (
            <ReusableTable
              columns={tradeColumns}
              data={filteredTrades}
              isLoading={isLoading}
              emptyMessage="No rebalance trade orders found."
              containerClassName="border border-slate-200 shadow-2xs"
              headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
              rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Confirmation Modal for Placing Trades */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Confirm Order Placement</h3>
                <p className="text-xs text-slate-500">Transmit country rebalance trades to broker execution</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Orders:</span>
                <span className="font-semibold text-slate-800">{tradesData.length} Orders</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Routing:</span>
                <span className="font-semibold text-slate-800">Primary Execution Desk</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">Gross Notional Value:</span>
                <span className="text-portal-navy text-sm">
                  ${tradesData
                    .reduce((acc, t) => acc + (t.tradeAmount || 0), 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              These trade orders will be dispatched to the order book. Please ensure all allocations and targets have
              been validated prior to confirming.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPlacingTrades}
                onClick={handlePlaceTrades}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isPlacingTrades ? "Transmitting..." : "Confirm & Place Trades"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
