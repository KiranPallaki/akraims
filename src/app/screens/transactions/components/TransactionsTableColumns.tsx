import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TransactionsTransactionItem, TransactionsTabType } from "../types";
import { SquarePen, Trash2 } from "lucide-react";

interface UseTransactionColumnsOptions {
  activeTab: TransactionsTabType;
  onEdit?: (item: TransactionsTransactionItem) => void;
  onDelete?: (item: TransactionsTransactionItem) => void;
}

export function useTransactionColumns({
  activeTab,
  onEdit,
  onDelete,
}: UseTransactionColumnsOptions): ColumnDef<TransactionsTransactionItem>[] {
  return useMemo(() => {
    const columns: ColumnDef<TransactionsTransactionItem>[] = [
      {
        id: "transactionID",
        header: "ID",
        accessorFn: (row) => row.transactionID ?? "",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 tracking-tight">
            {row.original.transactionID ?? "-"}
          </span>
        ),
      },
      {
        id: "participantName",
        header: "Participant Name",
        accessorFn: (row) => row.participantName || row.accountName || "",
        cell: ({ row }) => (
          <span className="font-medium text-slate-800">
            {row.original.participantName || row.original.accountName || "-"}
          </span>
        ),
      },
      {
        id: "fund",
        header: "Fund",
        accessorFn: (row) => row.fund || row.fundName || "",
        cell: ({ row }) => (
          <span className="text-slate-800 font-medium">
            {row.original.fund || row.original.fundName || "-"}
          </span>
        ),
      },
      {
        id: "transactionCode",
        header: "Transaction Code",
        accessorFn: (row) =>
          row.transactionCode || row.transactionCode || row.type || "",
        cell: ({ row }) => (
          <span className=" text-center text-slate-700">
            {row.original.transactionCode ||
              row.original.transactionCode ||
              row.original.type ||
              "-"}
          </span>
        ),
      },
      {
        id: "transactionDate",
        header: "Transaction Date",
        accessorFn: (row) => row.transactionDate || "",
        cell: ({ row }) => {
          const raw = row.original.transactionDate || "";
          const formattedDate = raw ? raw.split("T")[0] : "-";
          return <span className="text-slate-600">{formattedDate}</span>;
        },
      },
      {
        id: "amount",
        header: () => <div className="text-right">Amount</div>,
        accessorFn: (row) => row.transactionAmount ?? row.amount ?? 0,
        cell: ({ row }) => {
          const val = Number(
            row.original.transactionAmount ?? row.original.amount ?? 0,
          );
          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(Math.abs(val));
          return (
            <div className="text-right font-bold">
              {val < 0 ? (
                <span className="text-rose-600">({formatted})</span>
              ) : (
                <span className="text-slate-900">{formatted}</span>
              )}
            </div>
          );
        },
      },
      {
        id: "units",
        header: () => <div className="text-right">Units</div>,
        accessorFn: (row) => row.transactionUnits ?? 0,
        cell: ({ row }) => {
          const u = row.original.transactionUnits;
          return (
            <div className="text-right text-slate-600 font-medium">
              {u !== null && u !== undefined ? Number(u).toFixed(4) : "-"}
            </div>
          );
        },
      },
      {
        id: "feeAmount",
        header: () => <div className="text-right">FeeAmount</div>,
        accessorFn: (row) => row.feeAmount ?? 0,
        cell: ({ row }) => {
          const fee = Number(row.original.feeAmount ?? 0);
          return (
            <div className="text-right text-slate-600">
              {fee > 0
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(fee)
                : "$0.00"}
            </div>
          );
        },
      },
      {
        id: "notes",
        header: "Notes",
        accessorFn: (row) => row.notes || "",
        cell: ({ row }) => (
          <span className="text-slate-500 truncate max-w-[180px] block">
            {row.original.notes || "-"}
          </span>
        ),
      },
    ];

    if (activeTab === "pendingTransactions") {
      columns.push({
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(row.original);
              }}
              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit Transaction"
              type="button"
            >
              <SquarePen size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(row.original);
              }}
              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Transaction"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      });
    }

    return columns;
  }, [activeTab, onEdit, onDelete]);
}
