"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ReportItem } from "../types";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import { FileText, CheckCircle2 } from "lucide-react";

interface ReportListingTableProps {
  reports: ReportItem[];
  isLoading: boolean;
  selectedReport: ReportItem | null;
  onSelectReport: (report: ReportItem) => void;
}

export default function ReportListingTable({
  reports,
  isLoading,
  selectedReport,
  onSelectReport,
}: ReportListingTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter reports based on search query
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const query = searchQuery.toLowerCase().trim();
    return reports.filter(
      (r) =>
        String(r.reportID).toLowerCase().includes(query) ||
        r.reportName.toLowerCase().includes(query) ||
        (r.reportDesc && r.reportDesc.toLowerCase().includes(query)),
    );
  }, [reports, searchQuery]);

  // Define columns per PDF specification section 2 (Report ID, Report Name, Report Desc)
  const columns = useMemo<ColumnDef<ReportItem>[]>(
    () => [
      {
        accessorKey: "reportID",
        header: () => (
          <span className="font-medium text-[14px] text-slate-700">
            Report ID
          </span>
        ),
        cell: ({ row }) => (
          <span className="font-normal text-slate-600 px-1">
            {row.original.reportID}
          </span>
        ),
      },
      {
        accessorKey: "reportName",
        header: () => (
          <span className="font-medium text-[14px] text-slate-700">
            Report Name
          </span>
        ),
        cell: ({ row }) => {
          const isSelected = selectedReport?.reportID === row.original.reportID;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectReport(row.original);
              }}
              className={`text-left font-normal text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-2 ${
                isSelected ? "font-semibold text-blue-700" : ""
              }`}
            >
              <span>{row.original.reportName}</span>
            </button>
          );
        },
      },
      {
        accessorKey: "reportDesc",
        header: () => (
          <span className="font-medium text-[14px] text-slate-700">
            Report Desc
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-slate-600 font-normal">
            {row.original.reportDesc || "N/A"}
          </span>
        ),
      },
    ],
    [selectedReport, onSelectReport],
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2 font-medium text-xs">
          <FileText className="h-5 w-5 " />
          <h5 className=" text-slate-800 ">Available Reports</h5>
        </div>

        <div className="w-full sm:w-76">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search report name or ID..."
          />
        </div>
      </div>

      <ReusableTable
        columns={columns}
        data={filteredReports}
        isLoading={isLoading}
        emptyMessage="No reports found matching your criteria."
        initialPageSize={20}
        enablePagination={false}
        onRowClick={(row) => onSelectReport(row)}
        rowClassName="hover:bg-blue-50/40 transition-colors"
      />
    </div>
  );
}
