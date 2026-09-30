"use client";

import React, { useState } from "react";
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
} from "@tanstack/react-table";
import {
  GLOBAL_TABLE_CONFIG,
  TableDensity,
  getMergedTableConfig,
  DENSITY_PADDING_MAP,
} from "@/config/tableConfig";
import Pagination from "@/components/common/Pagination";
import { cn } from "@/lib/utils";

export interface ReusableTableProps<TData> {
  /** Columns definition array */
  columns: ColumnDef<TData, any>[];
  /** Array of data items */
  data: TData[];
  /** Loading state indicator */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Global density preset override */
  density?: TableDensity;
  /** Row padding Tailwind class override */
  padding?: string;
  /** Font size Tailwind class override */
  fontSize?: string;
  /** Header font size Tailwind class override */
  headerFontSize?: string;
  /** Container CSS class name prop */
  containerClassName?: string;
  /** Table element CSS class name prop */
  tableClassName?: string;
  /** Header row CSS class name prop */
  headerClassName?: string;
  /** Header cell CSS class name prop */
  headerCellClassName?: string;
  /** Body row CSS class name prop */
  rowClassName?: string;
  /** Body cell CSS class name prop */
  cellClassName?: string;
  /** Additional general wrapper class name prop */
  className?: string;
  /** Callback when a row is clicked */
  onRowClick?: (row: TData, index: number) => void;
  /** Enable or disable pagination */
  enablePagination?: boolean;
  /** Initial page size */
  initialPageSize?: number;
  /** Selected row index */
  selectedIndex?: number | null;
}

export default function ReusableTable<TData>({
  columns,
  data = [],
  isLoading = false,
  emptyMessage,
  density,
  padding,
  fontSize,
  headerFontSize,
  containerClassName,
  tableClassName,
  headerClassName,
  headerCellClassName,
  rowClassName,
  cellClassName,
  className,
  onRowClick,
  enablePagination = true,
  initialPageSize = 10,
  selectedIndex,
}: ReusableTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Resolve merged config (Global defaults overridden by component props)
  const resolvedConfig = getMergedTableConfig({
    density: density || GLOBAL_TABLE_CONFIG.density,
    rowPadding: padding || (density ? DENSITY_PADDING_MAP[density] : GLOBAL_TABLE_CONFIG.rowPadding),
    fontSize: fontSize || GLOBAL_TABLE_CONFIG.fontSize,
    headerFontSize: headerFontSize || GLOBAL_TABLE_CONFIG.headerFontSize,
    emptyMessage: emptyMessage || GLOBAL_TABLE_CONFIG.emptyMessage,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination: enablePagination ? pagination : undefined,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          resolvedConfig.containerClass,
          containerClassName
        )}
      >
        <div className="w-full overflow-x-auto">
          <table className={cn("w-full text-left border-collapse", resolvedConfig.fontSize, tableClassName)}>
            <thead className={cn(resolvedConfig.headerBg, headerClassName)}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        resolvedConfig.rowPadding,
                        resolvedConfig.headerFontSize,
                        "align-middle select-none",
                        headerCellClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className={cn("text-center py-12", resolvedConfig.fontSize)}
                  >
                    <div className="flex items-center justify-center gap-2.5 text-slate-500 font-medium">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className={cn(
                      "text-center py-10 text-slate-500 font-medium",
                      resolvedConfig.fontSize
                    )}
                  >
                    {resolvedConfig.emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(row.original, idx)}
                      className={cn(
                        resolvedConfig.hoverBg,
                        isSelected && resolvedConfig.selectedBg,
                        onRowClick && "cursor-pointer",
                        rowClassName
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn(
                            resolvedConfig.rowPadding,
                            "align-middle text-slate-700",
                            cellClassName
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {enablePagination && table.getRowModel().rows.length > 0 && (
        <Pagination
          pageIndex={table.getState().pagination.pageIndex}
          pageSize={table.getState().pagination.pageSize}
          totalRows={table.getFilteredRowModel().rows.length}
          pageCount={table.getPageCount()}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPageChange={(page) => table.setPageIndex(page)}
          onPageSizeChange={(size) => table.setPageSize(size)}
          className="border border-slate-200 bg-white rounded-xl shadow-xs"
        />
      )}
    </div>
  );
}
