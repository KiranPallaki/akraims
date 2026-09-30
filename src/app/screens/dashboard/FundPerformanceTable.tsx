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
import { FundPerformanceItem } from "@/types/dashboard";
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

interface FundPerformanceTableProps {
  data: FundPerformanceItem[];
  isLoading?: boolean;
}

// Accessor helpers
function getFundName(item: FundPerformanceItem): string {
  return String(item.fundName ?? item.fund ?? "");
}

function getVal(val?: number): number {
  return Number(val ?? 0);
}

const formatPct = (val?: number): string => {
  if (val === undefined || val === null || Number.isNaN(val)) return "0.00%";
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
};

const renderFormattedPct = (val?: number) => {
  const num = val ?? 0;
  const isPositive = num >= 0;
  return (
    <span className={`font-semibold `}>
      {isPositive ? "+" : ""}
      {num.toFixed(2)}%
    </span>
  );
};

// Filter Functions
const textFilterFn: FilterFn<FundPerformanceItem> = (
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

const numericMultiSelectFilterFn: FilterFn<FundPerformanceItem> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0)
    return true;
  const val = Number(row.getValue(columnId));
  return (filterValue as number[]).includes(val);
};

export default function FundPerformanceTable({
  data = [],
  isLoading = false,
}: FundPerformanceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [activePopoverCol, setActivePopoverCol] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  // Unique value extractors for numeric filters
  const uniqueMTD = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.mtdNet)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const unique3M = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.threeMonthsNet)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueQTD = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.qtdNet)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueYTD = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.ytdNet)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const unique1Y = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.oneYearNet)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const unique5Y = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.fiveYearNet)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const unique10Y = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.tenYearNet)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const columns = useMemo<ColumnDef<FundPerformanceItem>[]>(
    () => [
      {
        id: "fundName",
        accessorFn: (row) => getFundName(row),
        filterFn: textFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as TextFilterValue | null;
          const isFiltered = !!(filterValue && filterValue.value);

          return (
            <div className="flex items-center justify-between gap-1 py-1 min-w-[160px]">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-bold text-xs sm:text-[12px]  tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                  isSorted
                    ? "text-blue-600 font-bold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Fund Name (3-step: asc, desc, normal)"
              >
                Fund Name
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <span className=" text-left font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {getFundName(row.original)}
          </span>
        ),
      },
      {
        id: "mtdNet",
        accessorFn: (row) => getVal(row.mtdNet),
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
                    ? "text-blue-600"
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
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedPct(row.original.mtdNet)}
          </div>
        ),
      },
      {
        id: "threeMonthsNet",
        accessorFn: (row) => getVal(row.threeMonthsNet),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < unique3M.length
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
                    ? "text-blue-600"
                    : "text-slate-900 hover:text-blue-600"
                }`}
                title="Sort 3M (3-step: asc, desc, normal)"
              >
                3M
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedPct(row.original.threeMonthsNet)}
          </div>
        ),
      },
      {
        id: "qtdNet",
        accessorFn: (row) => getVal(row.qtdNet),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueQTD.length
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
                    ? "text-blue-600"
                    : "text-slate-900 hover:text-blue-600"
                }`}
                title="Sort QTD (3-step: asc, desc, normal)"
              >
                QTD
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedPct(row.original.qtdNet)}
          </div>
        ),
      },
      {
        id: "ytdNet",
        accessorFn: (row) => getVal(row.ytdNet),
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
                    ? "text-blue-600"
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
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedPct(row.original.ytdNet)}
          </div>
        ),
      },
      {
        id: "oneYearNet",
        accessorFn: (row) => getVal(row.oneYearNet),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < unique1Y.length
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
                    ? "text-blue-600"
                    : "text-slate-900 hover:text-blue-600"
                }`}
                title="Sort 1Y (3-step: asc, desc, normal)"
              >
                1Y
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedPct(row.original.oneYearNet)}
          </div>
        ),
      },
      {
        id: "fiveYearNet",
        accessorFn: (row) => getVal(row.fiveYearNet),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < unique5Y.length
          );

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-bold text-xs sm:text-[12px]  tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded${
                  isSorted
                    ? "text-blue-600"
                    : "text-slate-900 hover:text-blue-600"
                }`}
                title="Sort 5Y (3-step: asc, desc, normal)"
              >
                5Y
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right">
            {renderFormattedPct(row.original.fiveYearNet)}
          </div>
        ),
      },
      {
        id: "tenYearNet",
        accessorFn: (row) => getVal(row.tenYearNet),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < unique10Y.length
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
                    ? "text-blue-600"
                    : "text-slate-900 hover:text-blue-600"
                }`}
                title="Sort 10Y (3-step: asc, desc, normal)"
              >
                10Y
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedPct(row.original.tenYearNet)}
          </div>
        ),
      },
    ],
    [
      activePopoverCol,
      uniqueMTD,
      unique3M,
      uniqueQTD,
      uniqueYTD,
      unique1Y,
      unique5Y,
      unique10Y,
    ],
  );

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

    const headers = ["Fund Name", "MTD", "3M", "QTD", "YTD", "1Y", "5Y", "10Y"];
    const csvLines = [headers.join(",")];

    rows.forEach((r) => {
      const fn = `"${getFundName(r.original).replace(/"/g, '""')}"`;
      const mtd = getVal(r.original.mtdNet);
      const m3 = getVal(r.original.threeMonthsNet);
      const qtd = getVal(r.original.qtdNet);
      const ytd = getVal(r.original.ytdNet);
      const y1 = getVal(r.original.oneYearNet);
      const y5 = getVal(r.original.fiveYearNet);
      const y10 = getVal(r.original.tenYearNet);
      csvLines.push([fn, mtd, m3, qtd, ytd, y1, y5, y10].join(","));
    });

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `fund_performance_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white p-2 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      {/* Top Header: Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1">
        <div>
          <h4 className="text-md  sm:text-sm font-semibold text-slate-900 tracking-tight">
            Fund Performance
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search */}
          {/* <SearchBar
            value={globalFilter ?? ""}
            onChange={setGlobalFilter}
            placeholder="Search performance..."
            className="w-44 sm:w-56"
            size="sm"
          /> */}

          {/* Export Buttons */}
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
                    className="h-44 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                      <span>Loading fund performance...</span>
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
