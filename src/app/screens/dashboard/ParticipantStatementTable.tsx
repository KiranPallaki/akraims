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
import { ParticipantStatementItem } from "@/types/dashboard";
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
import Pagination from "@/components/common/Pagination";
import { Filter, FileSpreadsheet, FileText, Search, X } from "lucide-react";

interface ParticipantStatementTableProps {
  data: ParticipantStatementItem[];
  isLoading?: boolean;
}

// Accessor functions
function getItemName(item: ParticipantStatementItem): string {
  const val =
    item.transactionCodeDesc ??
    (item.transactionCode ? `${item.transactionCode}` : undefined) ??
    item.Item ??
    item.item ??
    item.description ??
    item.activityItem ??
    "";
  return String(val).trim();
}

function getMTD(item: ParticipantStatementItem): number {
  return Number(item.amount ?? item.MTD ?? item.mtd ?? 0);
}

function getYTD(item: ParticipantStatementItem): number {
  return Number(item.ytdAmount ?? item.YTD ?? item.ytd ?? 0);
}

function isBeginningBalanceItem(item: ParticipantStatementItem): boolean {
  const name = getItemName(item).toLowerCase();
  return (
    name.includes("beginning balance") ||
    name.includes("begin balance") ||
    name.includes("start balance") ||
    name.includes("ytd begin balance")
  );
}

function isEndingBalanceItem(item: ParticipantStatementItem): boolean {
  const name = getItemName(item).toLowerCase();
  return (
    name.includes("ending balance") ||
    name.includes("end balance") ||
    name.includes("market value")
  );
}

const formatCurrencyRaw = (val: number): string => {
  if (val < 0) {
    const absVal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Math.abs(val));
    return `(${absVal})`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
};

const renderFormattedCurrency = (val: number) => {
  if (val < 0) {
    const absVal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Math.abs(val));
    return <span className="text-red-600 font-semibold">({absVal})</span>;
  }
  return (
    <span className="text-slate-800 font-medium">
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(val)}
    </span>
  );
};

// Custom Filter Functions
const textFilterFn: FilterFn<ParticipantStatementItem> = (
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

const numericMultiSelectFilterFn: FilterFn<ParticipantStatementItem> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0)
    return true;
  const val = Number(row.getValue(columnId));
  return (filterValue as number[]).includes(val);
};

export default function ParticipantStatementTable({
  data = [],
  isLoading = false,
}: ParticipantStatementTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [activePopoverCol, setActivePopoverCol] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  // Sort data by displayOrderID ascending
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => {
      const orderA = a.displayOrderID ?? 999;
      const orderB = b.displayOrderID ?? 999;
      return orderA - orderB;
    });
  }, [data]);

  // Extract Beginning and Ending Balance items for top display
  const beginningBalanceItem = useMemo(() => {
    return sortedData.find((item) => isBeginningBalanceItem(item));
  }, [sortedData]);

  const endingBalanceItem = useMemo(() => {
    return sortedData.find((item) => isEndingBalanceItem(item));
  }, [sortedData]);

  // Remaining activity items to display inside table
  const tableData = useMemo(() => {
    return sortedData.filter(
      (item) => !isBeginningBalanceItem(item) && !isEndingBalanceItem(item),
    );
  }, [sortedData]);

  // Extract unique numeric values
  const uniqueMTD = useMemo(() => {
    const set = new Set<number>();
    tableData.forEach((item) => set.add(getMTD(item)));
    return Array.from(set).sort((a, b) => b - a);
  }, [tableData]);

  const uniqueYTD = useMemo(() => {
    const set = new Set<number>();
    tableData.forEach((item) => set.add(getYTD(item)));
    return Array.from(set).sort((a, b) => b - a);
  }, [tableData]);

  const columns = useMemo<ColumnDef<ParticipantStatementItem>[]>(
    () => [
      {
        id: "item",
        accessorFn: (row) => getItemName(row),
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
                className={`font-bold text-xs sm:text-[12px] transition-colors cursor-pointer select-none text-left py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-bold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Activity (3-step: asc, desc, normal)"
              >
                Activity
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <span className="font-medium text-[13px] text-slate-700 hover:text-blue-600 cursor-pointer">
            {getItemName(row.original)}
          </span>
        ),
      },
      {
        id: "mtd",
        accessorFn: (row) => getMTD(row),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueMTD.length
          );

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-bold text-xs sm:text-[12px]  tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-bold"
                    : "text-slate-900 hover:text-blue-600"
                }`}
                title="Sort MTD (3-step: asc, desc, normal)"
              >
                MTD
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right text-slate-700 font-medium text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getMTD(row.original))}
          </div>
        ),
      },
      {
        id: "ytd",
        accessorFn: (row) => getYTD(row),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueYTD.length
          );

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-bold text-xs sm:text-[12px]  tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-bold"
                    : "text-slate-900 hover:text-blue-600"
                }`}
                title="Sort YTD (3-step: asc, desc, normal)"
              >
                YTD
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right text-slate-700 font-medium text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getYTD(row.original))}
          </div>
        ),
      },
    ],
    [activePopoverCol, uniqueMTD, uniqueYTD],
  );

  const table = useReactTable({
    data: tableData,
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

    const headers = ["Activity Item", "MTD", "YTD"];
    const csvLines = [headers.join(",")];

    rows.forEach((r) => {
      const item = `"${getItemName(r.original).replace(/"/g, '""')}"`;
      const mtd = getMTD(r.original);
      const ytd = getYTD(r.original);
      csvLines.push([item, mtd, ytd].join(","));
    });

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `portfolio_statement_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full space-y-4">
      {/* Table Top Header: Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1">
        <div>
          <h4 className="text-md  sm:text-sm font-semibold text-slate-900 tracking-tight">
            Portfolio Statement
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search Input */}
          {/* <SearchBar
            value={globalFilter ?? ""}
            onChange={setGlobalFilter}
            placeholder="Search statement..."
            className="w-44 sm:w-52"
            size="sm"
          /> */}

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

      {/* Beginning & Ending Balance Summary Cards */}
      {(beginningBalanceItem || endingBalanceItem) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
          <div className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Beginning Balance
              </span>
              {/* <div className="text-slate-800 font-bold text-xs mt-0.5">
                {beginningBalanceItem
                  ? getItemName(beginningBalanceItem)
                  : "Beginning Balance"}
              </div> */}
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-700">
                MTD:{" "}
                {beginningBalanceItem
                  ? renderFormattedCurrency(getMTD(beginningBalanceItem))
                  : "$0.00"}
              </div>
              <div className="font-semibold text-slate-600 mt-0.5">
                YTD:{" "}
                {beginningBalanceItem
                  ? renderFormattedCurrency(getYTD(beginningBalanceItem))
                  : "$0.00"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Ending Balance
              </span>
              {/* <div className="text-slate-800 font-bold text-xs mt-0.5">
                {endingBalanceItem
                  ? getItemName(endingBalanceItem)
                  : "Ending Balance"}
              </div> */}
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-700">
                MTD:{" "}
                {endingBalanceItem
                  ? renderFormattedCurrency(getMTD(endingBalanceItem))
                  : "$0.00"}
              </div>
              <div className="font-semibold text-slate-600 mt-0.5">
                YTD:{" "}
                {endingBalanceItem
                  ? renderFormattedCurrency(getYTD(endingBalanceItem))
                  : "$0.00"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex-1 flex flex-col justify-between">
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
                    className="h-44 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                      <span>Loading statement...</span>
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
                table.getRowModel().rows.map((row, idx) => {
                  const isSelected = selectedRowIndex === idx;
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => setSelectedRowIndex(idx)}
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
