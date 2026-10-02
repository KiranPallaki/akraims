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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import TextFilterPopover, {
  TextFilterValue,
} from "@/components/common/TextFilterPopover";
import { FileSpreadsheet, FileText, EllipsisVertical } from "lucide-react";
import { exportTableToPDF } from "@/lib/pdfExport";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ParticipantStatementTableProps {
  data: ParticipantStatementItem[];
  isLoading?: boolean;
  maxHeight?: string;
  className?: string;
}

// Accessor functions
function truncateText(str: string, maxLen: number = 40): string {
  if (!str || str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}...`;
}

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
  maxHeight = "max-h-[30vh] xl:max-h-[calc(100vh-290px)]",
  className,
}: ParticipantStatementTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [activePopoverCol, setActivePopoverCol] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
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
        cell: ({ row }) => {
          const name = getItemName(row.original);
          return (
            <span
              className="font-medium text-[13px] text-slate-700 hover:text-blue-600 cursor-pointer block truncate max-w-[260px] pl-4"
              title={name}
            >
              {truncateText(name, 40)}
            </span>
          );
        },
      },
      {
        id: "mtd",
        accessorFn: (row) => getMTD(row),
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
                className={`font-bold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
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

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              <button
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`font-bold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
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
    if (rows.length === 0 && !beginningBalanceItem && !endingBalanceItem)
      return;

    const headers = ["Activity Item", "MTD", "YTD"];
    const csvLines = [headers.join(",")];

    if (beginningBalanceItem) {
      const item = `"${getItemName(beginningBalanceItem).replace(/"/g, '""')}"`;
      const mtd = getMTD(beginningBalanceItem);
      const ytd = getYTD(beginningBalanceItem);
      csvLines.push([item, mtd, ytd].join(","));
    }

    rows.forEach((r) => {
      const item = `"${getItemName(r.original).replace(/"/g, '""')}"`;
      const mtd = getMTD(r.original);
      const ytd = getYTD(r.original);
      csvLines.push([item, mtd, ytd].join(","));
    });

    if (endingBalanceItem) {
      const item = `"${getItemName(endingBalanceItem).replace(/"/g, '""')}"`;
      const mtd = getMTD(endingBalanceItem);
      const ytd = getYTD(endingBalanceItem);
      csvLines.push([item, mtd, ytd].join(","));
    }

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
    const rows = table.getFilteredRowModel().rows;
    const headers = ["Activity Item", "MTD", "YTD"];
    const pdfRows: (string | number)[][] = [];

    const formatVal = (val: number | string) =>
      typeof val === "number"
        ? val.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : String(val);

    if (beginningBalanceItem) {
      pdfRows.push([
        getItemName(beginningBalanceItem),
        formatVal(getMTD(beginningBalanceItem)),
        formatVal(getYTD(beginningBalanceItem)),
      ]);
    }

    rows.forEach((r) => {
      pdfRows.push([
        getItemName(r.original),
        formatVal(getMTD(r.original)),
        formatVal(getYTD(r.original)),
      ]);
    });

    if (endingBalanceItem) {
      pdfRows.push([
        getItemName(endingBalanceItem),
        formatVal(getMTD(endingBalanceItem)),
        formatVal(getYTD(endingBalanceItem)),
      ]);
    }

    if (pdfRows.length === 0) return;

    exportTableToPDF({
      fileName: `portfolio_statement_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "Participant Portfolio Statement",
      subtitle: "AKRA IMS - Portfolio Statement",
      headers,
      rows: pdfRows,
      orientation: "portrait",
    });
  };

  return (
    <div
      className={cn(
        "bg-white p-2 sm:p-2 rounded-lg border border-slate-200/80 shadow-xs flex flex-col justify-between h-full space-y-4",
        className,
      )}
    >
      {/* Main Table Container */}
      <div className="bg-white  shadow-xs overflow-hidden flex-1 flex flex-col justify-between">
        <Table containerClassName={cn("overflow-y-auto relative", maxHeight)}>
          <TableHeader className="sticky top-0 z-30 bg-white border-b border-slate-200">
            {/* Header Row: Card Title ("Portfolio Statement"), MTD, YTD & Ellipsis Vertical Export Menu */}
            <TableRow className="hover:bg-transparent border-b border-slate-200 bg-white">
              {/* Activity Header removed; Card Title placed in left header cell */}
              <TableHead className="bg-white py-2.5">
                <h4 className="text-md sm:text-sm font-semibold text-slate-900 tracking-tight">
                  Portfolio Statement
                </h4>
              </TableHead>

              {/* MTD Header aligned on same card header row */}
              <TableHead className="bg-white py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      const col = table.getColumn("mtd");
                      if (!col) return;
                      const isSorted = col.getIsSorted();
                      if (!isSorted) col.toggleSorting(false);
                      else if (isSorted === "asc") col.toggleSorting(true);
                      else col.clearSorting();
                    }}
                    className={`font-bold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                      table.getColumn("mtd")?.getIsSorted()
                        ? "text-blue-600 font-bold"
                        : "text-slate-900 hover:text-blue-600"
                    }`}
                    title="Sort MTD (3-step: asc, desc, normal)"
                  >
                    MTD{" "}
                    {table.getColumn("mtd")?.getIsSorted() === "asc"
                      ? "↑"
                      : table.getColumn("mtd")?.getIsSorted() === "desc"
                        ? "↓"
                        : ""}
                  </button>
                </div>
              </TableHead>

              {/* YTD Header & Ellipsis Vertical Popover Menu aligned on same card header row */}
              <TableHead className="bg-white py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      const col = table.getColumn("ytd");
                      if (!col) return;
                      const isSorted = col.getIsSorted();
                      if (!isSorted) col.toggleSorting(false);
                      else if (isSorted === "asc") col.toggleSorting(true);
                      else col.clearSorting();
                    }}
                    className={`font-bold text-xs sm:text-[12px] tracking-wider transition-colors cursor-pointer select-none py-0.5 rounded ${
                      table.getColumn("ytd")?.getIsSorted()
                        ? "text-blue-600 font-bold"
                        : "text-slate-900 hover:text-blue-600"
                    }`}
                    title="Sort YTD (3-step: asc, desc, normal)"
                  >
                    YTD{" "}
                    {table.getColumn("ytd")?.getIsSorted() === "asc"
                      ? "↑"
                      : table.getColumn("ytd")?.getIsSorted() === "desc"
                        ? "↓"
                        : ""}
                  </button>

                  <Popover open={isExportOpen} onOpenChange={setIsExportOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="p-1 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer translate-x-3"
                        title="Export options"
                      >
                        <EllipsisVertical className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-44 p-1.5 shadow-md border-slate-200"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            handleExportPDF();
                            setIsExportOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors w-full text-left cursor-pointer"
                        >
                          <FileText className="h-4 w-4 text-red-500" />
                          <span>Export to PDF</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExportCSV();
                            setIsExportOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors w-full text-left cursor-pointer"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          <span>Export to Excel</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
            </TableRow>

            {/* Static Top Row: Beginning Balance */}
            {beginningBalanceItem && (
              <TableRow className=" font-bold border-b-1.5  transition-colors">
                <TableCell className="font-bold text-[13px] text-slate-900 py-2.5 ">
                  {getItemName(beginningBalanceItem)}
                </TableCell>
                <TableCell className="text-right text-[13px] font-bold py-2.5 ">
                  {renderFormattedCurrency(getMTD(beginningBalanceItem))}
                </TableCell>
                <TableCell className="text-right text-[13px] font-bold py-2.5 ">
                  {renderFormattedCurrency(getYTD(beginningBalanceItem))}
                </TableCell>
              </TableRow>
            )}
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
                    <span>Loading statement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-slate-500 text-xs font-medium"
                >
                  No activity items
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, idx) => {
                const isSelected = selectedRowIndex === idx;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedRowIndex(idx)}
                    className={`cursor-pointer border-0  ${
                      isSelected ? " font-medium pl-1" : ""
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

          {/* Static Bottom Row: Ending Balance */}
          {endingBalanceItem && (
            <TableFooter className="sticky bottom-0 z-30  bg-slate-100 border-t-2 ">
              <TableRow className="hover:bg-transparent font-bold ">
                <TableCell className="font-bold text-[13px] text-slate-900 py-2.5 ">
                  {getItemName(endingBalanceItem)}
                </TableCell>
                <TableCell className="text-right text-[13px] font-bold py-2.5 ">
                  {renderFormattedCurrency(getMTD(endingBalanceItem))}
                </TableCell>
                <TableCell className="text-right text-[13px] font-bold py-2.5 ">
                  {renderFormattedCurrency(getYTD(endingBalanceItem))}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
