"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { ReportItem, ReportParameter } from "./types";
import { fetchReportsList, fetchReportParameters } from "./api";
import ReportListingTable from "./components/ReportListingTable";
import ReportParameterForm from "./components/ReportParameterForm";
import ReportViewerIframe from "./components/ReportViewerIframe";
import { Table, FileText, ArrowLeft, RefreshCw, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);

  // Reports data state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [parameters, setParameters] = useState<ReportParameter[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Iframe Preview State
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewFileType, setPreviewFileType] = useState<"pdf" | "xlsx">("pdf");
  const [previewReportName, setPreviewReportName] = useState<string>("");

  useEffect(() => {
    setClient(getSelectedClient());

    async function loadInitialData() {
      setIsLoading(true);
      setErrorMsg(null);

      const clientObj = getSelectedClient();

      const [reportsRes, paramsRes] = await Promise.all([
        fetchReportsList(clientObj?.clientID),
        fetchReportParameters(clientObj?.clientID),
      ]);

      if (reportsRes.ok && reportsRes.data) {
        setReports(reportsRes.data);
        // Default to first report if available
        if (reportsRes.data.length > 0) {
          setSelectedReport(reportsRes.data[0]);
        }
      } else {
        setErrorMsg(reportsRes.error || "Failed to load reports listing");
      }

      if (paramsRes.ok && paramsRes.data) {
        setParameters(paramsRes.data);
      }

      setIsLoading(false);
    }

    loadInitialData();
  }, []);

  // Filter parameter definitions for selected report ID (Section 4)
  const currentReportParameters = useMemo(() => {
    if (!selectedReport) return [];
    const targetId = Number(selectedReport.reportID);
    return parameters.filter((p) => Number(p.reportID) === targetId);
  }, [selectedReport, parameters]);

  const handleSelectReport = (report: ReportItem) => {
    setSelectedReport(report);
  };

  const handlePreviewReport = (
    blob: Blob,
    fileType: "pdf" | "xlsx",
    reportName: string,
  ) => {
    setPreviewBlob(blob);
    setPreviewFileType(fileType);
    setPreviewReportName(reportName);
  };

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Left = Report Listing Table, Right = Dynamic Report Parameter Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Report Listing Table (7 cols) */}
        <div className="lg:col-span-7">
          <ReportListingTable
            reports={reports}
            isLoading={isLoading}
            selectedReport={selectedReport}
            onSelectReport={handleSelectReport}
          />
        </div>

        {/* Right Column: Dynamic Form Parameters (5 cols) */}
        <div className="lg:col-span-5">
          {selectedReport ? (
            <ReportParameterForm
              key={selectedReport.reportID}
              report={selectedReport}
              parameters={currentReportParameters}
              onPreviewReport={handlePreviewReport}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No Report Selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Select a report from the table to configure parameters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report Preview Modal Iframe (PDF / Excel Blob Viewer per Section 8) */}
      {previewBlob && (
        <ReportViewerIframe
          blob={previewBlob}
          reportName={previewReportName}
          fileType={previewFileType}
          onClose={() => setPreviewBlob(null)}
        />
      )}
    </div>
  );
}
