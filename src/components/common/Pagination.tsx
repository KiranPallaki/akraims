"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Table as TanStackTable } from "@tanstack/react-table";

export interface PaginationProps<TData = any> {
  table?: TanStackTable<TData>;
  totalRows?: number;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  showPageSizeSelector?: boolean;
}

export default function Pagination<TData = any>({
  table,
  totalRows: totalRowsProp,
  pageIndex: pageIndexProp,
  pageSize: pageSizeProp,
  pageCount: pageCountProp,
  canPreviousPage: canPreviousPageProp,
  canNextPage: canNextPageProp,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  className = "",
  showPageSizeSelector = true,
}: PaginationProps<TData>) {
  const totalRows =
    totalRowsProp ?? table?.getFilteredRowModel().rows.length ?? 0;
  const pageIndex =
    pageIndexProp ?? table?.getState().pagination.pageIndex ?? 0;
  const pageSize =
    pageSizeProp ?? table?.getState().pagination.pageSize ?? 10;
  const pageCount =
    pageCountProp ??
    table?.getPageCount() ??
    (totalRows > 0 ? Math.ceil(totalRows / pageSize) : 1);
  const canPreviousPage =
    canPreviousPageProp ??
    table?.getCanPreviousPage() ??
    pageIndex > 0;
  const canNextPage =
    canNextPageProp ??
    table?.getCanNextPage() ??
    pageIndex < pageCount - 1;

  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  const handleFirstPage = () => {
    if (table) {
      table.setPageIndex(0);
    } else if (onPageChange) {
      onPageChange(0);
    }
  };

  const handlePreviousPage = () => {
    if (table) {
      table.previousPage();
    } else if (onPageChange) {
      onPageChange(Math.max(0, pageIndex - 1));
    }
  };

  const handleNextPage = () => {
    if (table) {
      table.nextPage();
    } else if (onPageChange) {
      onPageChange(Math.min(pageCount - 1, pageIndex + 1));
    }
  };

  const handleLastPage = () => {
    const lastIdx = Math.max(0, pageCount - 1);
    if (table) {
      table.setPageIndex(lastIdx);
    } else if (onPageChange) {
      onPageChange(lastIdx);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (table) {
      table.setPageSize(newSize);
    } else if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100 text-xs text-slate-600 font-medium min-w-full ${className}`}
    >
      {/* Row Count & Page Size Selector */}
      <div className="flex items-center gap-4">
        <div className="text-slate-800 font-bold">
          <span className="font-extrabold text-slate-900">{startRow}</span> to{" "}
          <span className="font-extrabold text-slate-900">{endRow}</span> of{" "}
          <span className="font-extrabold text-slate-900">{totalRows}</span>
        </div>

        {showPageSizeSelector && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Navigation Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleFirstPage}
          disabled={!canPreviousPage}
          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <button
          onClick={handlePreviousPage}
          disabled={!canPreviousPage}
          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-slate-800 px-1 font-medium">
          Page{" "}
          <span className="font-bold text-slate-900">{pageIndex + 1}</span> of{" "}
          <span className="font-bold text-slate-900">{pageCount || 1}</span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={!canNextPage}
          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={handleLastPage}
          disabled={!canNextPage}
          className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
