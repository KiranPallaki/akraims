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
import TextFilterPopover, {
  TextFilterValue,
} from "@/components/common/TextFilterPopover";
import NumericFilterPopover from "@/components/common/NumericFilterPopover";
import Pagination from "@/components/common/Pagination";
import { Filter, FileSpreadsheet, FileText, Search, X } from "lucide-react";

interface ParticipantBalancesTableProps {
  data: ParticipantBalanceItem[];
  isLoading?: boolean;
}

// Accessor helpers
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
          const filterValue = column.getFilterValue() as TextFilterValue | null;
          const isFiltered = !!(filterValue && filterValue.value);

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

              <div className="relative inline-block">
                {activePopoverCol === "number" && (
                  <TextFilterPopover
                    columnTitle="Number"
                    initialFilter={filterValue}
                    onApply={(val) => column.setFilterValue(val)}
                    onClose={() => setActivePopoverCol(null)}
                  />
                )}
              </div>
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
          const filterValue = column.getFilterValue() as TextFilterValue | null;
          const isFiltered = !!(filterValue && filterValue.value);

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
        cell: ({ row }) => (
          <span className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {getName(row.original)}
          </span>
        ),
      },
      {
        id: "balance",
        accessorFn: (row) => getBalance(row),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueBalances.length
          );

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

              <div className="relative inline-block">
                {/* <button
                  onClick={() =>
                    setActivePopoverCol(
                      activePopoverCol === "balance" ? null : "balance",
                    )
                  }
                  className={`p-1.5 rounded-md transition-all ${
                    isFiltered
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : activePopoverCol === "balance"
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                  title="Filter Balance"
                >
                  {/* <Filter className="h-3.5 w-3.5" /> */}
                {/* </button> */}

                {activePopoverCol === "balance" && (
                  <NumericFilterPopover
                    columnTitle="Balance"
                    uniqueValues={uniqueBalances}
                    formatFn={formatCurrency}
                    initialFilter={filterValue}
                    onApply={(val) => column.setFilterValue(val)}
                    onClose={() => setActivePopoverCol(null)}
                  />
                )}
              </div>
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
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniquePcts.length
          );

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

              <div className="relative inline-block">
                {/* <button
                  onClick={() =>
                    setActivePopoverCol(
                      activePopoverCol === "pct" ? null : "pct",
                    )
                  }
                  className={`p-1.5 rounded-md transition-all ${
                    isFiltered
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : activePopoverCol === "pct"
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                  title="Filter Percentage"
                >
                  {/* <Filter className="h-3.5 w-3.5" /> */}
                {/* </button> */}

                {activePopoverCol === "pct" && (
                  <NumericFilterPopover
                    columnTitle="Percentage"
                    uniqueValues={uniquePcts}
                    formatFn={(v) => `${v.toFixed(2)}%`}
                    initialFilter={filterValue}
                    onApply={(val) => column.setFilterValue(val)}
                    onClose={() => setActivePopoverCol(null)}
                  />
                )}
              </div>
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

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
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
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      {/* Table Top Header: Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1">
        <div>
          <h4 className="text-md  sm:text-sm font-semibold text-slate-900 tracking-tight">
            Participant Balances
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search Input */}
          {/* <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search participants..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-52"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div> */}

          {/* Export Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
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
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="max-h-[250px] overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 shadow-xs border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-white">
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
                    className="h-34 text-center"
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
                        <TableCell key={cell.id}>
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
    </div>
  );
}
