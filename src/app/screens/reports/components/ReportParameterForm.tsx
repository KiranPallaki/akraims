"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import {
  ReportItem,
  ReportParameter,
  FundOption,
  ParticipantOption,
  ReportPayload,
  DynamicFormData,
} from "../types";
import { fetchFundList, fetchParticipantList, generateReport } from "../api";
import { getSelectedClient, getSavedUserSession } from "@/stores/authStore";
import StandardDatePicker from "@/components/common/StandardDatePicker";
import PopoverSelect, {
  PopoverSelectOption,
} from "@/components/common/PopoverSelect";
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

interface ReportParameterFormProps {
  report: ReportItem;
  parameters: ReportParameter[];
  onPreviewReport: (
    blob: Blob,
    fileType: "pdf" | "xlsx",
    reportName: string,
  ) => void;
}

export default function ReportParameterForm({
  report,
  parameters,
  onPreviewReport,
}: ReportParameterFormProps) {
  const [funds, setFunds] = useState<FundOption[]>([]);
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  // Form State
  const [formData, setFormData] = useState<DynamicFormData>({
    FundID: "",
    ParticipantID: "0",
    YearStartDate: "",
    BeginDate: "",
    EndDate: "",
  });

  const [outputFormat, setOutputFormat] = useState<"pdf" | "xlsx">("pdf");
  const [showValidate, setShowValidate] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  const [, startTransition] = useTransition();

  const fundOptions: PopoverSelectOption[] = useMemo(() => {
    return funds.map((f) => ({
      value: String(f.fundID),
      label: f.fund || f.fundName || `Fund #${f.fundID}`,
    }));
  }, [funds]);

  const participantOptions: PopoverSelectOption[] = useMemo(() => {
    return [
      { value: "0", label: "-- Select Participant --" },
      ...participants.map((p) => ({
        value: String(p.participantID),
        label:
          p.participantName ||
          p.participant ||
          `Participant #${p.participantID}`,
      })),
    ];
  }, [participants]);

  // Compute default dates based on Section 6 logic
  const computeDefaultDates = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed (0=Jan, 9=Oct)

    // YearStartDate: January 1 of current year
    const yearStartStr = `${currentYear}-01-01`;

    // Calculate previous month's first and last day per Section 6
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }

    const prevMonthPadded = String(prevMonth + 1).padStart(2, "0");
    const beginDateStr = `${prevYear}-${prevMonthPadded}-01`;

    // Last day of previous month
    const lastDayObj = new Date(prevYear, prevMonth + 1, 0);
    const lastDayPadded = String(lastDayObj.getDate()).padStart(2, "0");
    const endDateStr = `${prevYear}-${prevMonthPadded}-${lastDayPadded}`;

    return {
      YearStartDate: yearStartStr,
      BeginDate: beginDateStr,
      EndDate: endDateStr,
    };
  };

  // Load dropdown data and initialize defaults
  useEffect(() => {
    let isMounted = true;
    async function loadDropdowns() {
      setIsLoadingDropdowns(true);
      const client = getSelectedClient();

      const [fundData, participantData] = await Promise.all([
        fetchFundList(client?.clientID),
        fetchParticipantList(client?.clientID),
      ]);

      if (!isMounted) return;

      setFunds(fundData);
      setParticipants(participantData);

      const defaults = computeDefaultDates();

      // Initial Fund selection: first fund if available
      const initialFundId =
        fundData.length > 0 ? String(fundData[0].fundID) : "";

      // Build initial form state for all parameters of this report
      const newFormState: DynamicFormData = {
        FundID: initialFundId,
        ParticipantID: "0",
        YearStartDate: defaults.YearStartDate,
        BeginDate: defaults.BeginDate,
        EndDate: defaults.EndDate,
      };

      // Populate other custom integer/string parameters
      parameters.forEach((param) => {
        if (!newFormState[param.parameterName]) {
          newFormState[param.parameterName] =
            param.parameterType === "int" ? "0" : "";
        }
      });

      setFormData(newFormState);
      setShowValidate(false);
      setValidationMessage("");
      setIsLoadingDropdowns(false);
    }

    loadDropdowns();
    return () => {
      isMounted = false;
    };
  }, [report.reportID, parameters]);

  // Handle Input Changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (showValidate && field === "ParticipantID" && value !== "0") {
      setShowValidate(false);
      setValidationMessage("");
    }
  };

  // Check date type formatting boolean (Section 6)
  const hasSmallDateTime = parameters.some(
    (p) =>
      p.parameterType === "smalldatetime" &&
      (p.parameterName === "BeginDate" || p.parameterName === "EndDate"),
  );

  // Validate form fields (Section 7 Participant Validation & Date bounds)
  const validateForm = (): boolean => {
    const hasParticipantParam = parameters.some(
      (p) => p.parameterName === "ParticipantID",
    );

    if (hasParticipantParam && formData.ParticipantID === "0") {
      setShowValidate(true);
      setValidationMessage("Please Select ParticipantID");
      return false;
    }

    // Date range validation
    if (formData.BeginDate && formData.EndDate) {
      if (new Date(formData.BeginDate) > new Date(formData.EndDate)) {
        setShowValidate(true);
        setValidationMessage("Begin Date cannot be later than End Date");
        return false;
      }
    }

    setShowValidate(false);
    setValidationMessage("");
    return true;
  };

  // Build API Report Payload matching Section 7 spec
  const buildReportPayload = (format: "pdf" | "xlsx"): ReportPayload => {
    const client = getSelectedClient();
    const session = getSavedUserSession() as any;

    const formattedParameters: Array<{ Name: string; Value: string }> = [];

    parameters.forEach((param) => {
      let val = formData[param.parameterName] ?? "";

      // Apply Section 6 date formatting
      if (param.parameterType === "smalldatetime" && val) {
        if (!hasSmallDateTime) {
          // Format as YYYY-MM-DDTHH:mm:ss if not smalldatetime flag
          val = `${val}T00:00:00`;
        }
      }

      formattedParameters.push({
        Name: param.parameterName,
        Value: String(val),
      });
    });

    // Append ClientID and SessionID per Section 7 payload structure
    formattedParameters.push({
      Name: "ClientID",
      Value: String(client?.clientID || "123"),
    });

    formattedParameters.push({
      Name: "SessionID",
      Value: session?.sessionID || session?.session_id || "testSession",
    });

    return {
      type: "activereport",
      fileType: format,
      aciveReport: {
        reportId: String(report.reportID),
        Parameters: formattedParameters,
      },
    };
  };

  // Section 8: View / Preview Handler
  const handlePreviewClick = async () => {
    if (!validateForm()) return;

    setIsViewLoading(true);
    try {
      const payload = buildReportPayload(outputFormat);
      const res = await generateReport(payload);

      if (res.ok && res.blob) {
        onPreviewReport(res.blob, outputFormat, report.reportName);
      } else {
        setShowValidate(true);
        setValidationMessage(res.error || "Failed to generate report preview.");
      }
    } catch (err) {
      setShowValidate(true);
      setValidationMessage(
        err instanceof Error ? err.message : "Error generating report preview",
      );
    } finally {
      setIsViewLoading(false);
    }
  };

  // Section 8: Download Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsDownloadLoading(true);
    try {
      const payload = buildReportPayload(outputFormat);
      const res = await generateReport(payload);

      if (res.ok && res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement("a");
        a.href = url;
        const reportClass =
          report.reportClassName || report.reportName.replace(/\s+/g, "");
        a.download = `${reportClass}_${formData.BeginDate || "report"}.${outputFormat}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setShowValidate(true);
        setValidationMessage(res.error || "Failed to download report.");
      }
    } catch (err) {
      setShowValidate(true);
      setValidationMessage(
        err instanceof Error ? err.message : "Error downloading report",
      );
    } finally {
      setIsDownloadLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Form Title Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between ">
        <div className="flex items-center gap-2 font-medium text-[12px] text-slate-700 tracking-wider">
          <SlidersHorizontal size={14} /> Report Parameters
        </div>
        <h5 className="text-[12px] font-medium text-slate-800">
          {report.reportName}
        </h5>
      </div>

      {/* Dynamic Parameters Controls Form */}
      <form
        onSubmit={handleSubmit}
        className="p-5 space-y-4 flex-1 flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* Validation Alert Box */}
          {showValidate && validationMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-[12px] text-red-700 font-medium animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{validationMessage}</span>
            </div>
          )}

          {isLoadingDropdowns ? (
            <div className="py-8 text-center text-slate-500 text-[12px] font-medium flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Loading report options...</span>
            </div>
          ) : (
            parameters.map((param) => {
              const {
                parameterName,
                parameterType,
                reportParameterID,
                parameterNotes,
              } = param;

              // 1. FundID Dropdown (Section 5)
              if (parameterName === "FundID") {
                return (
                  <div
                    key={reportParameterID}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                      <label className="text-[12px] font-medium text-slate-700 flex items-center gap-0.5">
                        Target Fund <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] font-medium text-slate-700">
                        :
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <PopoverSelect
                        value={formData.FundID}
                        onChange={(val) => handleInputChange("FundID", val)}
                        options={fundOptions}
                        placeholder="Select Target Fund"
                      />
                      {parameterNotes && (
                        <p className="text-[11px] text-slate-400 mt-1 font-normal">
                          {parameterNotes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              // 2. ParticipantID Dropdown (Section 5)
              if (parameterName === "ParticipantID") {
                return (
                  <div
                    key={reportParameterID}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                      <label className="text-[12px] font-medium text-slate-700 flex items-center gap-0.5">
                        Participant <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] font-medium text-slate-700">
                        :
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <PopoverSelect
                        value={formData.ParticipantID}
                        onChange={(val) =>
                          handleInputChange("ParticipantID", val)
                        }
                        options={participantOptions}
                        placeholder="-- Select Participant --"
                        className={
                          showValidate && formData.ParticipantID === "0"
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }
                      />
                      {parameterNotes && (
                        <p className="text-[11px] text-slate-400 mt-1 font-normal">
                          {parameterNotes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              // 3. YearStartDate (Section 5 & MM/DD/YYYY Date Picker)
              if (
                parameterType === "smalldatetime" &&
                parameterName === "YearStartDate"
              ) {
                return (
                  <div
                    key={reportParameterID}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                      <label className="text-[12px] font-medium   text-slate-700 flex items-center gap-0.5">
                        Year Start Date <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] font-medium text-slate-700">
                        :
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <StandardDatePicker
                        value={formData.YearStartDate}
                        onChange={(val) =>
                          handleInputChange("YearStartDate", val)
                        }
                        required
                      />
                    </div>
                  </div>
                );
              }

              // 4. BeginDate (Section 5 & MM/DD/YYYY Date Picker)
              if (
                parameterType === "smalldatetime" &&
                parameterName === "BeginDate"
              ) {
                return (
                  <div
                    key={reportParameterID}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                      <label className="text-[12px] font-medium text-slate-700 flex items-center gap-0.5">
                        Begin Date <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] font-medium text-slate-700">
                        :
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <StandardDatePicker
                        value={formData.BeginDate}
                        onChange={(val) => handleInputChange("BeginDate", val)}
                        required
                      />
                    </div>
                  </div>
                );
              }

              // 5. EndDate (Section 5 & MM/DD/YYYY Date Picker)
              if (
                parameterType === "smalldatetime" &&
                parameterName === "EndDate"
              ) {
                return (
                  <div
                    key={reportParameterID}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                      <label className="text-[12px] font-medium text-slate-700 flex items-center gap-0.5">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] font-medium text-slate-700">
                        :
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <StandardDatePicker
                        value={formData.EndDate}
                        onChange={(val) => handleInputChange("EndDate", val)}
                        required
                      />
                    </div>
                  </div>
                );
              }

              // 6. Generic SmallDateTime Field
              if (parameterType === "smalldatetime") {
                return (
                  <div
                    key={reportParameterID}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                      <label className="text-[12px] font-medium text-slate-700 flex items-center gap-0.5">
                        {parameterName} <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] font-medium text-slate-700">
                        :
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <StandardDatePicker
                        value={formData[parameterName] || ""}
                        onChange={(val) =>
                          handleInputChange(parameterName, val)
                        }
                        required
                      />
                    </div>
                  </div>
                );
              }

              // 7. Other Integer Parameters (Section 5)
              if (parameterType === "int") {
                return (
                  <div
                    key={reportParameterID}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                      <label className="text-[12px] font-medium text-slate-700 flex items-center gap-0.5">
                        {parameterName} <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[12px] font-medium text-slate-700">
                        :
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="number"
                        value={formData[parameterName] || "0"}
                        onChange={(e) =>
                          handleInputChange(parameterName, e.target.value)
                        }
                        className="w-full h-8 px-3 rounded-lg border border-slate-300 text-[12px] font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>
                );
              }

              // Fallback default input
              return (
                <div
                  key={reportParameterID}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
                    <label className="text-[12px] font-medium text-slate-700 flex items-center gap-0.5">
                      {parameterName}
                    </label>
                    <span className="text-[12px] font-medium text-slate-700">
                      :
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={formData[parameterName] || ""}
                      onChange={(e) =>
                        handleInputChange(parameterName, e.target.value)
                      }
                      className="w-full h-8 px-3 rounded-lg border border-slate-300 text-[12px] font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Output Format Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="sm:w-36 shrink-0 flex items-center justify-between pr-1">
              <label className="text-[12px] font-medium text-slate-700">
                Output Format
              </label>
              <span className="text-[12px] font-medium text-slate-700">:</span>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutputFormat("pdf")}
                className={`flex items-center justify-center gap-2 text-[12px] font-medium transition-all ${
                  outputFormat === "pdf" ? "text-[#051a36]" : "text-slate-600"
                }`}
              >
                <FileText className="h-4 w-4 text-red-600" />
              </button>

              <button
                type="button"
                onClick={() => setOutputFormat("xlsx")}
                className={`flex items-center justify-center gap-2 text-[12px] font-medium transition-all ${
                  outputFormat === "xlsx" ? "text-[#051a36]" : "text-slate-600"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Form Action Buttons (View Preview & Download) */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handlePreviewClick}
            disabled={isViewLoading || isDownloadLoading || isLoadingDropdowns}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-300 text-[12px] font-medium transition-all disabled:opacity-50"
          >
            {isViewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Eye className="h-4 w-4 text-blue-600" />
            )}
            <span>Preview (View)</span>
          </button>

          <button
            type="submit"
            disabled={isViewLoading || isDownloadLoading || isLoadingDropdowns}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#051a36] text-white hover:bg-[#092b57] shadow-sm text-[12px] font-medium transition-all disabled:opacity-50"
          >
            {isDownloadLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Download className="h-4 w-4 text-white" />
            )}
            <span>Download Report</span>
          </button>
        </div>
      </form>
    </div>
  );
}
