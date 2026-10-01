"use client";

import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import { ParticipantBalanceItem } from "@/types/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import TextFilterPopover, {
  TextFilterValue,
} from "@/components/common/TextFilterPopover";
import NumericFilterPopover from "@/components/common/NumericFilterPopover";
import { FileSpreadsheet, FileText } from "lucide-react";

interface ParticipantBalancesTableProps {
  data: ParticipantBalanceItem[];
  isLoading?: boolean;
  maxHeight?: string;
  className?: string;
}

// Accessor helpers
function truncateText(str: string, maxLen: number = 40): string {
  if (!str || str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}...`;
}

function getNum(item: ParticipantBalanceItem): string {
  return String(
    item.Number ??
      item.number ??
      item.participantNumber ??
      item.participantNo ??
      "",
  );
}

function getName(item: ParticipantBalanceItem): string {
  return String(item.Name ?? item.name ?? item.participantName ?? "");
}

function getBalance(item: ParticipantBalanceItem): number {
  return Number(item.Balance ?? item.balance ?? item.participantBalance ?? 0);
}

function getPct(item: ParticipantBalanceItem): number {
  return Number(item.Pct ?? item.pct ?? item.percentage ?? item.percent ?? 0);
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
};

// Custom Filter Functions
const textFilterFn: FilterFn<ParticipantBalanceItem> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue) return true;
  const { value, mode } = filterValue as TextFilterValue;
  if (!value || value.trim() === "") return true;

  const rawCell = String(row.getValue(columnId) ?? "").toLowerCase();
  const search = String(value).trim().toLowerCase();

  switch (mode) {
    case "startsWith":
      return rawCell.startsWith(search);
    case "endsWith":
      return rawCell.endsWith(search);
    case "equals":
      return rawCell === search;
    case "contains":
    default:
      return rawCell.includes(search);
  }
};

const numericMultiSelectFilterFn: FilterFn<ParticipantBalanceItem> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0)
    return true;
  const val = Number(row.getValue(columnId));
  return (filterValue as number[]).includes(val);
};

export default function ParticipantBalancesTable({
  data = [],
  isLoading = false,
  maxHeight = "max-h-[50vh] xl:max-h-[calc(100vh-340px)]",
  className,
}: ParticipantBalancesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [selectedRowId, setSelectedRowId] = useState<string | null>("21009");
  const [activePopoverCol, setActivePopoverCol] = useState<string | null>(null);

  // Extract unique balances and percentages
  const uniqueBalances = useMemo(() => {
    const set = new Set<number>();
    data.forEach((item) => set.add(getBalance(item)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniquePcts = useMemo(() => {
    const set = new Set<number>();
    data.forEach((item) => set.add(getPct(item)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const columns = useMemo<ColumnDef<ParticipantBalanceItem>[]>(
    () => [
      {
        id: "number",
        accessorFn: (row) => getNum(row),
        filterFn: textFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();

          return (
            <div className="flex items-center justify-between gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-semibold text-xs sm:text-[12px] transition-colors cursor-pointer select-none text-left py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-semibold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Number (3-step: asc, desc, normal)"
              >
                Number
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <span className="text-right font-medium text-slate-700 text-[12px] sm:text-[13px] hover:text-blue-600 cursor-pointer">
            {getNum(row.original)}
          </span>
        ),
      },
      {
        id: "name",
        accessorFn: (row) => getName(row),
        filterFn: textFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();

          return (
            <div className="flex items-center justify-between gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-semibold text-xs sm:text-[12px] transition-colors cursor-pointer select-none text-left py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-semibold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Name (3-step: asc, desc, normal)"
              >
                Name
              </button>
            </div>
          );
        },
        cell: ({ row }) => {
          const name = getName(row.original);
          return (
            <span
              className="text-left font-medium text-slate-700 text-[13px] sm:text-[13px] block truncate max-w-[200px]"
              title={name}
            >
              {truncateText(name, 40)}
            </span>
          );
        },
      },
      {
        id: "balance",
        accessorFn: (row) => getBalance(row),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-bold text-xs sm:text-[12px] transition-colors cursor-pointer select-none py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-bold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Balance (3-step: asc, desc, normal)"
              >
                Balance
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {formatCurrency(getBalance(row.original))}
          </div>
        ),
      },
      {
        id: "pct",
        accessorFn: (row) => getPct(row),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-bold text-xs sm:text-[12px] transition-colors cursor-pointer select-none py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-bold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Pct (3-step: asc, desc, normal)"
              >
                %
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right text-slate-700 text-[13px] font-medium">
            {getPct(row.original).toFixed(2)}%
          </div>
        ),
      },
    ],
    [activePopoverCol, uniqueBalances, uniquePcts],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportCSV = () => {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) return;

    const headers = ["Number", "Name", "Balance", "Pct"];
    const csvLines = [headers.join(",")];

    rows.forEach((r) => {
      const num = getNum(r.original);
      const name = `"${getName(r.original).replace(/"/g, '""')}"`;
      const bal = getBalance(r.original);
      const pct = getPct(r.original);
      csvLines.push([num, name, bal, pct].join(","));
    });

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `participant_balances_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div
      className={cn(
        "bg-white p-2 sm:p-2 rounded-lg border border-slate-200/80 shadow-xs flex flex-col justify-between h-full space-y-4",
        className,
      )}
    >
      {/* Table Top Header: Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1">
        <div>
          <h4 className="text-md sm:text-sm font-semibold text-slate-900 tracking-tight">
            Participant Balances
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Export to Excel / CSV"
            >
              <div className="relative flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-slate-700" />
                <span className="absolute text-[8px] font-black text-slate-900 right-0 bottom-0 bg-white px-0.5 rounded border border-slate-300">
                  X
                </span>
              </div>
            </button>

            <button
              onClick={handleExportPDF}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Export to PDF"
            >
              <div className="relative flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-700" />
                <span className="absolute text-[7px] font-black text-slate-900 -right-1 -bottom-0.5 bg-white px-0.5 rounded border border-slate-300">
                  PDF
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex-1 flex flex-col justify-between">
        <Table containerClassName={cn("overflow-y-auto relative", maxHeight)}>
          <TableHeader className="sticky top-0 z-30 bg-white shadow-2xs border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b border-slate-200 bg-white"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-white py-2">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                    <span>Loading participant balances...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-slate-500 text-xs font-medium"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const num = getNum(row.original);
                const isSelected = selectedRowId === num;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedRowId(num)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-sky-50/80 border-sky-200 font-medium"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
