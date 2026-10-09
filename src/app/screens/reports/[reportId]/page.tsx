"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { ReportItem, ReportParameter } from "../types";
import { fetchReportsList, fetchReportParameters } from "../api";
import ReportParameterForm from "../components/ReportParameterForm";
import ReportViewerIframe from "../components/ReportViewerIframe";
import { Table, FileText, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportIdParam = params?.reportId as string;

  const [client, setClient] = useState<Client | null>(null);
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

    async function loadReportDetail() {
      setIsLoading(true);
      setErrorMsg(null);

      const clientObj = getSelectedClient();

      const [reportsRes, paramsRes] = await Promise.all([
        fetchReportsList(clientObj?.clientID),
        fetchReportParameters(clientObj?.clientID),
      ]);

      if (reportsRes.ok && reportsRes.data) {
        setReports(reportsRes.data);
        const targetId = Number(reportIdParam);
        const found = reportsRes.data.find(
          (r) => Number(r.reportID) === targetId || String(r.reportID) === reportIdParam
        );

        if (found) {
          setSelectedReport(found);
        } else {
          // If not found in API response, create fallback item with current report ID
          setSelectedReport({
            reportID: reportIdParam,
            reportName: `Report #${reportIdParam}`,
            reportDesc: `Report detail configuration for ID #${reportIdParam}`,
          });
        }
      } else {
        setErrorMsg(reportsRes.error || "Failed to load report definition");
      }

      if (paramsRes.ok && paramsRes.data) {
        setParameters(paramsRes.data);
      }

      setIsLoading(false);
    }

    if (reportIdParam) {
      loadReportDetail();
    }
  }, [reportIdParam]);

  // Filter parameter definitions for selected report ID (Section 4)
  const currentReportParameters = useMemo(() => {
    if (!reportIdParam) return [];
    const targetId = Number(reportIdParam);
    return parameters.filter((p) => Number(p.reportID) === targetId);
  }, [reportIdParam, parameters]);

  const handlePreviewReport = (
    blob: Blob,
    fileType: "pdf" | "xlsx",
    reportName: string
  ) => {
    setPreviewBlob(blob);
    setPreviewFileType(fileType);
    setPreviewReportName(reportName);
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/screens/reports"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-2xs transition-all"
        >
          <ArrowLeft size={16} />
          <span>Back to All Reports</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
            <Table size={16} /> Report Detail View
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">
            {selectedReport?.reportName || `Report #${reportIdParam}`}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {selectedReport?.reportDesc || "Configure report parameters and view/download payload output."}
          </p>
        </div>

        <div className="text-right">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
            Report ID: #{reportIdParam}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading report parameters and options...</p>
        </div>
      ) : selectedReport ? (
        <div className="max-w-2xl mx-auto">
          <ReportParameterForm
            report={selectedReport}
            parameters={currentReportParameters}
            onPreviewReport={handlePreviewReport}
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          <p className="font-semibold text-sm">Report Not Found</p>
          <p className="text-xs text-slate-400 mt-1">
            Could not locate report definition for ID #{reportIdParam}.
          </p>
        </div>
      )}

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
