"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FundItem } from "../types";
import { SquarePen, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";

interface UseFundColumnsOptions {
  onEdit: (item: FundItem) => void;
  onDelete: (item: FundItem) => void;
}

export function useFundColumns({
  onEdit,
  onDelete,
}: UseFundColumnsOptions): ColumnDef<FundItem>[] {
  return useMemo(() => {
    return [
      {
        id: "fund",
        accessorKey: "fund",
        enableSorting: true,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              type="button"
              onClick={() => {
                if (!isSorted) column.toggleSorting(false);
                else if (isSorted === "asc") column.toggleSorting(true);
                else column.clearSorting();
              }}
              className={`inline-flex items-center gap-1.5 font-semibold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                isSorted
                  ? "text-blue-600 font-bold"
                  : "text-slate-800 hover:text-blue-600"
              }`}
              title="Sort Fund (3-step: asc, desc, normal)"
            >
              <span>Fund</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown size={11} className="text-slate-300 hover:text-slate-500" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 block truncate">
            {row.original.fund || "-"}
          </span>
        ),
      },
      {
        id: "fundType",
        accessorKey: "fundType",
        enableSorting: true,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              type="button"
              onClick={() => {
                if (!isSorted) column.toggleSorting(false);
                else if (isSorted === "asc") column.toggleSorting(true);
                else column.clearSorting();
              }}
              className={`inline-flex items-center gap-1.5 font-semibold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                isSorted
                  ? "text-blue-600 font-bold"
                  : "text-slate-800 hover:text-blue-600"
              }`}
              title="Sort Fund Type (3-step: asc, desc, normal)"
            >
              <span>Fund Type</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown size={11} className="text-slate-300 hover:text-slate-500" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="text-slate-700 block truncate">
            {row.original.fundType || "-"}
          </span>
        ),
      },
      {
        id: "fundName",
        accessorKey: "fundName",
        enableSorting: true,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              type="button"
              onClick={() => {
                if (!isSorted) column.toggleSorting(false);
                else if (isSorted === "asc") column.toggleSorting(true);
                else column.clearSorting();
              }}
              className={`inline-flex items-center gap-1.5 font-semibold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                isSorted
                  ? "text-blue-600 font-bold"
                  : "text-slate-800 hover:text-blue-600"
              }`}
              title="Sort Fund Name (3-step: asc, desc, normal)"
            >
              <span>Fund Name</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown size={11} className="text-slate-300 hover:text-slate-500" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="font-medium text-slate-800 block truncate max-w-md">
            {row.original.fundName || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => <div className="text-right pr-2">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5 pr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              className="btn-action-edit"
              title="Edit Fund"
            >
              <SquarePen size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original);
              }}
              className="btn-action-delete"
              title="Delete Fund"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ];
  }, [onEdit, onDelete]);
}
