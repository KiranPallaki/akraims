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
import { FundStatementItem } from "@/types/dashboard";
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

interface FundStatementTableProps {
  data: FundStatementItem[];
  isLoading?: boolean;
}

// Accessor helpers
function getFundName(item: FundStatementItem): string {
  return String(item.fundName ?? item.fund ?? "").trim();
}

function getVal(val?: number): number {
  return Number(val ?? 0);
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

// Filter Functions
const textFilterFn: FilterFn<FundStatementItem> = (
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

const numericMultiSelectFilterFn: FilterFn<FundStatementItem> = (
  row,
  columnId,
  filterValue,
) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0)
    return true;
  const val = Number(row.getValue(columnId));
  return (filterValue as number[]).includes(val);
};

export default function FundStatementTable({
  data = [],
  isLoading = false,
}: FundStatementTableProps) {
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
  const uniqueBeginning = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.beginningBalance)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueContributions = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.contributions)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueRedemptions = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.redemptions)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueIncome = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.income)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueExpenses = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.expenses)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueRealGL = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.realGainLoss)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueUnrealGL = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.unrealGainLoss)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const uniqueEnding = useMemo(() => {
    const set = new Set<number>();
    data.forEach((i) => set.add(getVal(i.endingBalance)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const columns = useMemo<ColumnDef<FundStatementItem>[]>(
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
                className={`font-bold text-xs sm:text-[12px]  tracking-wider transition-colors cursor-pointer select-none text-left py-0.5 rounded ${
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
          <span className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {getFundName(row.original)}
          </span>
        ),
      },
      {
        id: "beginningBalance",
        accessorFn: (row) => getVal(row.beginningBalance),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueBeginning.length
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
                title="Sort Market Value (3-step: asc, desc, normal)"
              >
                Market Value
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.beginningBalance))}
          </div>
        ),
      },
      {
        id: "contributions",
        accessorFn: (row) => getVal(row.contributions),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueContributions.length
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
                title="Sort Contributions (3-step: asc, desc, normal)"
              >
                Contributions
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.contributions))}
          </div>
        ),
      },
      {
        id: "redemptions",
        accessorFn: (row) => getVal(row.redemptions),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueRedemptions.length
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
                title="Sort Redemptions (3-step: asc, desc, normal)"
              >
                Redemptions
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.redemptions))}
          </div>
        ),
      },
      {
        id: "income",
        accessorFn: (row) => getVal(row.income),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueIncome.length
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
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Income (3-step: asc, desc, normal)"
              >
                Income
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.income))}
          </div>
        ),
      },
      {
        id: "expenses",
        accessorFn: (row) => getVal(row.expenses),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueExpenses.length
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
                    ? "text-blue-600 font-semibold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Expenses (3-step: asc, desc, normal)"
              >
                Expenses
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.expenses))}
          </div>
        ),
      },
      {
        id: "realGainLoss",
        accessorFn: (row) => getVal(row.realGainLoss),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueRealGL.length
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
                    ? "text-blue-600 font-semibold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Real G/L (3-step: asc, desc, normal)"
              >
                Real G/L
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.realGainLoss))}
          </div>
        ),
      },
      {
        id: "unrealGainLoss",
        accessorFn: (row) => getVal(row.unrealGainLoss),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueUnrealGL.length
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
                    ? "text-blue-600 font-semibold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Unreal G/L (3-step: asc, desc, normal)"
              >
                Unreal G/L
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.unrealGainLoss))}
          </div>
        ),
      },
      {
        id: "endingBalance",
        accessorFn: (row) => getVal(row.endingBalance),
        filterFn: numericMultiSelectFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as number[] | null;
          const isFiltered = !!(
            filterValue &&
            filterValue.length > 0 &&
            filterValue.length < uniqueEnding.length
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
                    ? "text-blue-600 font-semibold"
                    : "text-slate-800 hover:text-blue-600"
                }`}
                title="Sort Ending Balance (3-step: asc, desc, normal)"
              >
                Ending Balance
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-medium text-slate-700 text-[13px] sm:text-[13px]">
            {renderFormattedCurrency(getVal(row.original.endingBalance))}
          </div>
        ),
      },
    ],
    [
      activePopoverCol,
      uniqueBeginning,
      uniqueContributions,
      uniqueRedemptions,
      uniqueIncome,
      uniqueExpenses,
      uniqueRealGL,
      uniqueUnrealGL,
      uniqueEnding,
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

    const headers = [
      "Fund Name",
      "Market Value",
      "Contributions",
      "Redemptions",
      "Income",
      "Expenses",
      "Real G/L",
      "Unreal G/L",
      "Ending Balance",
    ];
    const csvLines = [headers.join(",")];

    rows.forEach((r) => {
      const fn = `"${getFundName(r.original).replace(/"/g, '""')}"`;
      const mv = getVal(r.original.beginningBalance);
      const cb = getVal(r.original.contributions);
      const rd = getVal(r.original.redemptions);
      const inc = getVal(r.original.income);
      const exp = getVal(r.original.expenses);
      const rgl = getVal(r.original.realGainLoss);
      const ugl = getVal(r.original.unrealGainLoss);
      const eb = getVal(r.original.endingBalance);
      csvLines.push([fn, mv, cb, rd, inc, exp, rgl, ugl, eb].join(","));
    });

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `fund_statement_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white p-2 sm:p-2 rounded-lg border border-slate-200/80 shadow-xs space-y-4">
      {/* Top Header: Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1">
        <div>
          <h4 className="text-md  sm:text-sm font-semibold text-slate-900 tracking-tight">
            Fund Statement
          </h4>
        </div>

        <div className="flex items-center gap-3">
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
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <Table containerClassName="max-h-[50vh] lg:max-h-[calc(100vh-320px)] overflow-y-auto relative">
          <TableHeader className="sticky top-0 z-30 bg-white shadow-2xs border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-200 bg-white">
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
                    className="h-44 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                      <span>Loading fund statement...</span>
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
  );
}
