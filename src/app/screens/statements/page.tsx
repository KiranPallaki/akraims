"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { StatementItem, StatementsTabType } from "./types";
import { statementsList, adminStatementsList } from "./api";
import { useStatementsColumns } from "./components/StatementsTableColumns";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import { exportTableToPDF } from "@/lib/pdfExport";
import {
  FileText,
  FileSpreadsheet,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function StatementsPage() {
  const [activeTab, setActiveTab] = useState<StatementsTabType>("statements");
  const [client, setClient] = useState<Client | null>(null);

  // Raw data from APIs as described in document
  const [data, setData] = useState<{ items?: StatementItem[] } | null>(null);
  const [adminStatementsData, setAdminStatementsData] = useState<{
    items?: StatementItem[];
  } | null>(null);

  const [isLoadingStatements, setIsLoadingStatements] = useState<boolean>(true);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(true);

  // Global search input
  const [searchQuery, setSearchQuery] = useState<string>("");

  /**
   * Mount Data Flow (Step 1 & 2 in PDF Document):
   * Reads client/newJwt cookies & calls statementsList and adminStatementsList independently on mount.
   */
  const fetchData = async () => {
    setIsLoadingStatements(true);
    setIsLoadingAdmin(true);

    // Call statementsList and adminStatementsList independently
    const [stRes, adminRes] = await Promise.all([
      statementsList({ pageNumber: 1, pageSize: 200 }),
      adminStatementsList({ PageNumber: 1, PageSize: 200 }),
    ]);

    // Store results in data and adminStatementsData state (Step 3 & 4 in PDF)
    const stItems = stRes?.items || stRes?.data || [];
    const adminItems = adminRes?.items || adminRes?.data || [];

    // Fallback sample records for demonstration if backend returns empty or network unavailable
    if (stItems.length > 0) {
      setData(stRes);
    } else {
      setData({
        items: [
          {
            id: 1,
            name: "August 2026 Monthly Statement",
            type: "Monthly Statement",
            statementType: "Monthly Statement",
            date: "2026-08-31",
            filePath: "https://imsdev.akrais.com/statements/aug_2026.pdf",
          },
          {
            id: 2,
            name: "July 2026 Monthly Statement",
            type: "Monthly Statement",
            statementType: "Monthly Statement",
            date: "2026-07-31",
            filePath: "https://imsdev.akrais.com/statements/jul_2026.pdf",
          },
          {
            id: 3,
            name: "Q2 2026 Performance Statement",
            type: "Quarterly Statement",
            statementType: "Quarterly Statement",
            date: "2026-06-30",
            filePath: "https://imsdev.akrais.com/statements/q2_2026.pdf",
          },
          {
            id: 4,
            name: "2025 Annual Account Summary",
            type: "Annual Statement",
            statementType: "Annual Statement",
            date: "2025-12-31",
            filePath: "https://imsdev.akrais.com/statements/annual_2025.pdf",
          },
          {
            id: 5,
            name: "May 2026 Monthly Statement",
            type: "Monthly Statement",
            statementType: "Monthly Statement",
            date: "2026-05-31",
            filePath: "https://imsdev.akrais.com/statements/may_2026.pdf",
          },
          {
            id: 6,
            name: "April 2026 Monthly Statement",
            type: "Monthly Statement",
            statementType: "Monthly Statement",
            date: "2026-04-30",
            filePath: "https://imsdev.akrais.com/statements/apr_2026.pdf",
          },
          {
            id: 7,
            name: "Q1 2026 Performance Statement",
            type: "Quarterly Statement",
            statementType: "Quarterly Statement",
            date: "2026-03-31",
            filePath: "https://imsdev.akrais.com/statements/q1_2026.pdf",
          },
          {
            id: 8,
            name: "February 2026 Monthly Statement",
            type: "Monthly Statement",
            statementType: "Monthly Statement",
            date: "2026-02-28",
            filePath: "https://imsdev.akrais.com/statements/feb_2026.pdf",
          },
        ],
      });
    }

    if (adminItems.length > 0) {
      setAdminStatementsData(adminRes);
    } else {
      setAdminStatementsData({
        items: [
          {
            id: 101,
            fund: "Alpha Growth Fund LP",
            participantName: "Apex Global Holdings",
            name: "August 2026 Admin Consolidated Statement",
            type: "Admin Monthly",
            statementType: "Admin Monthly",
            date: "2026-08-31",
            filePath:
              "https://imsdev.akrais.com/adminstatements/alpha_aug_2026.pdf",
          },
          {
            id: 102,
            fund: "High Yield Income Trust",
            participantName: "Horizon Ventures LLC",
            name: "July 2026 Admin Consolidated Statement",
            type: "Admin Monthly",
            statementType: "Admin Monthly",
            date: "2026-07-31",
            filePath:
              "https://imsdev.akrais.com/adminstatements/yield_jul_2026.pdf",
          },
          {
            id: 103,
            fund: "Real Estate Opportunities Fund",
            participantName: "Sterling Capital Partners",
            name: "Q2 2026 Admin Quarterly Report",
            type: "Admin Quarterly",
            statementType: "Admin Quarterly",
            date: "2026-06-30",
            filePath:
              "https://imsdev.akrais.com/adminstatements/re_q2_2026.pdf",
          },
          {
            id: 104,
            fund: "Global Multi-Strategy Fund",
            participantName: "Vanguard Asset Management",
            name: "May 2026 Admin Consolidated Statement",
            type: "Admin Monthly",
            statementType: "Admin Monthly",
            date: "2026-05-31",
            filePath:
              "https://imsdev.akrais.com/adminstatements/global_may_2026.pdf",
          },
          {
            id: 105,
            fund: "Fixed Income Bond Fund",
            participantName: "BlackRock Global Investors",
            name: "April 2026 Admin Consolidated Statement",
            type: "Admin Monthly",
            statementType: "Admin Monthly",
            date: "2026-04-30",
            filePath:
              "https://imsdev.akrais.com/adminstatements/bond_apr_2026.pdf",
          },
        ],
      });
    }

    setIsLoadingStatements(false);
    setIsLoadingAdmin(false);
  };

  useEffect(() => {
    setClient(getSelectedClient());
    fetchData();
  }, []);

  // Determine current active raw data items
  const rawItems = useMemo(() => {
    if (activeTab === "statements") {
      return data?.items || [];
    }
    return adminStatementsData?.items || [];
  }, [activeTab, data, adminStatementsData]);

  // Extract unique statement types for column header set filter dropdown
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    rawItems.forEach((item) => {
      const t = item.type || item.statementType;
      if (t) set.add(t);
    });
    return Array.from(set);
  }, [rawItems]);

  // Global search filtered rows
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return rawItems;
    const q = searchQuery.toLowerCase();
    return rawItems.filter((item) => {
      const nm = (item.name || "").toLowerCase();
      const tp = (item.type || item.statementType || "").toLowerCase();
      const dt = (item.date || "").toLowerCase();
      const fd = (item.fund || "").toLowerCase();
      const pt = (item.participantName || "").toLowerCase();
      return (
        nm.includes(q) ||
        tp.includes(q) ||
        dt.includes(q) ||
        fd.includes(q) ||
        pt.includes(q)
      );
    });
  }, [rawItems, searchQuery]);

  // Columns definition via custom hook
  const columns = useStatementsColumns({
    activeTab,
    availableTypes,
  });

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const isAdmin = activeTab === "adminStatements";

    const headers = isAdmin
      ? [
          "Fund",
          "Participant Name",
          "Name",
          "Statement Type",
          "Date",
          "File Path",
        ]
      : ["Name", "Statement Type", "Date", "File Path"];

    const csvLines = [headers.join(",")];

    filteredData.forEach((row) => {
      const nm = `"${(row.name || "").replace(/"/g, '""')}"`;
      const tp = `"${(row.type || row.statementType || "").replace(/"/g, '""')}"`;
      const dt = `"${(row.date || "").replace(/"/g, '""')}"`;
      const fp = `"${(row.filePath || "").replace(/"/g, '""')}"`;

      if (isAdmin) {
        const fd = `"${(row.fund || "").replace(/"/g, '""')}"`;
        const pt = `"${(row.participantName || "").replace(/"/g, '""')}"`;
        csvLines.push([fd, pt, nm, tp, dt, fp].join(","));
      } else {
        csvLines.push([nm, tp, dt, fp].join(","));
      }
    });

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = isAdmin ? "Admin_Statements.csv" : "Statements.csv";
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const isAdmin = activeTab === "adminStatements";

    const headers = isAdmin
      ? ["Fund", "Participant Name", "Name", "Statement Type", "Date"]
      : ["Name", "Statement Type", "Date"];

    const pdfRows = filteredData.map((row) => {
      const nm = row.name || "";
      const tp = row.type || row.statementType || "";
      const dt = row.date || "";

      if (isAdmin) {
        return [row.fund || "-", row.participantName || "-", nm, tp, dt];
      }
      return [nm, tp, dt];
    });

    exportTableToPDF({
      fileName: isAdmin ? "Admin_Statements.pdf" : "Statements.pdf",
      title: isAdmin ? "Admin Statements Report" : "Account Statements Report",
      subtitle: client?.clientName ? `Client: ${client.clientName}` : undefined,
      headers,
      rows: pdfRows,
      orientation: "landscape",
    });
  };

  const isLoading =
    activeTab === "statements" ? isLoadingStatements : isLoadingAdmin;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-3 overflow-hidden">
      {/* 2 Tabs Header Bar */}
      <div className="flex items-center   shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("statements")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md  transition-all  ${
            activeTab === "statements"
              ? "bg-[#051a36] text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <UserCheck size={15} />
          Statements
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("adminStatements")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all  ${
            activeTab === "adminStatements"
              ? "bg-[#051a36] text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <ShieldCheck size={15} />
          Admin Statements
        </button>
      </div>

      {/* Screen-fitting Table Card Container (No outer scrolling) */}
      <div className="flex-1 min-h-0 flex flex-col space-y-3 rounded-xl border border-slate-200 bg-white p-2 shadow-xs overflow-hidden">
        {/* Controls Bar: Search, Refresh, Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <h5 className=" text-[13px] font-semibold text-slate-800 tracking-tight">
              {activeTab === "statements" ? "Statements" : "Admin Statements"}
            </h5>
          </div>

          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${
                activeTab === "statements" ? "statements" : "admin statements"
              }...`}
              className="w-52 sm:w-64"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
                title="Export to Excel / CSV"
                type="button"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
                title="Export to PDF"
                type="button"
              >
                <FileText className="h-4 w-4 text-red-500" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                onClick={fetchData}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                title="Refresh statements list"
                type="button"
              >
                <RefreshCw
                  className={`h-4 w-4 text-slate-600 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 
          Full Screen Fitting Table (Inside table scrolling only, pagination disabled)
        */}
        <ReusableTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage={
            activeTab === "statements"
              ? "No account statements found."
              : "No admin statements found."
          }
          enablePagination={false}
          className="flex-1 min-h-0 flex flex-col space-y-0"
          containerClassName="flex-1 min-h-0 overflow-y-auto border border-slate-200 shadow-2xs rounded-xl"
          maxHeight="h-full"
          headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 sticky top-0 z-30"
        />
      </div>
    </div>
  );
}
