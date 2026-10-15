"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ParticipantItem } from "../types";
import {
  SquarePen,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

interface UseParticipantColumnsOptions {
  onEdit: (item: ParticipantItem) => void;
  onDelete: (item: ParticipantItem) => void;
}

export function useParticipantColumns({
  onEdit,
  onDelete,
}: UseParticipantColumnsOptions): ColumnDef<ParticipantItem>[] {
  return useMemo(() => {
    return [
      {
        id: "participantName",
        accessorKey: "participantName",
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
              title="Sort Participant Name (3-step: asc, desc, normal)"
            >
              <span>Participant Name</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown
                  size={11}
                  className="text-slate-300 hover:text-slate-500"
                />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="font-medium text-slate-900 block truncate max-w-xs sm:max-w-md">
            {row.original.participantName || "-"}
          </span>
        ),
      },
      {
        id: "participantType",
        accessorKey: "participantType",
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
              title="Sort Participant Type (3-step: asc, desc, normal)"
            >
              <span>Participant Type</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown
                  size={11}
                  className="text-slate-300 hover:text-slate-500"
                />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="text-slate-700 block truncate">
            {row.original.participantType || "-"}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
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
              title="Sort Status (3-step: asc, desc, normal)"
            >
              <span>Status</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown
                  size={11}
                  className="text-slate-300 hover:text-slate-500"
                />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const status = row.original.status || "Active";
          const isActive = status.toLowerCase() === "active";
          return <span>{status}</span>;
        },
      },
      {
        id: "openDate",
        accessorKey: "openDate",
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
          const timeA = new Date(rowA.getValue(columnId) || 0).getTime();
          const timeB = new Date(rowB.getValue(columnId) || 0).getTime();
          return timeA - timeB;
        },
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
              title="Sort Open Date (3-step: asc, desc, normal)"
            >
              <span>Open Date</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown
                  size={11}
                  className="text-slate-300 hover:text-slate-500"
                />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const raw = row.original.openDate;
          return (
            <span className="text-slate-700 block truncate">
              {raw ? formatDate(raw) : "--"}
            </span>
          );
        },
      },
      {
        id: "closeDate",
        accessorKey: "closeDate",
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
          const valA = rowA.getValue(columnId);
          const valB = rowB.getValue(columnId);
          if (!valA && !valB) return 0;
          if (!valA) return 1;
          if (!valB) return -1;
          const timeA = new Date(valA as string).getTime();
          const timeB = new Date(valB as string).getTime();
          return timeA - timeB;
        },
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
              title="Sort Close Date (3-step: asc, desc, normal)"
            >
              <span>Close Date</span>
              {isSorted === "asc" ? (
                <ChevronUp size={13} className="text-blue-600" />
              ) : isSorted === "desc" ? (
                <ChevronDown size={13} className="text-blue-600" />
              ) : (
                <ArrowUpDown
                  size={11}
                  className="text-slate-300 hover:text-slate-500"
                />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const raw = row.original.closeDate;
          return (
            <span className="text-slate-500 block truncate">
              {raw ? formatDate(raw) : "--"}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => (
          <div className="inline-flex items-center gap-1.5 font-semibold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5">
            Actions
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-start gap-1.5 ">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              className="btn-action-edit"
              title="Edit Participant"
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
              title="Delete Participant"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ];
  }, [onEdit, onDelete]);
}
