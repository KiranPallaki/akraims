"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TaskMetadata,
  TaskParameter,
  TaskReturnType,
  FundLookupItem,
  ParticipantLookupItem,
} from "../types";
import PopoverSelect, {
  PopoverSelectOption,
} from "@/components/common/PopoverSelect";
import {
  Calendar as CalendarIcon,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";

export interface TaskFormProps {
  metadataList: TaskMetadata[];
  isLoadingMetadata?: boolean;
  fundList: FundLookupItem[];
  isLoadingFunds?: boolean;
  participantList: ParticipantLookupItem[];
  isLoadingParticipants?: boolean;
  parameters: TaskParameter[];
  isLoadingParameters?: boolean;
  selectedTask: TaskMetadata | null;
  onSelectTask: (task: TaskMetadata | null) => void;
  onReturnTypeChange: (returnType: TaskReturnType) => void;
  onSubmit: (
    formData: Record<string, any>,
    downloadType?: string,
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  apiError?: string | null;
  feedbackBanner?: {
    type: "success" | "error" | "info";
    message: string;
  } | null;
}

const parseDateString = (dateStr: string): Date | undefined => {
  if (!dateStr || !dateStr.trim()) return undefined;
  let parsed = parse(dateStr.trim(), "MM/dd/yyyy", new Date());
  if (isValid(parsed)) return parsed;
  parsed = parse(dateStr.trim(), "yyyy-MM-dd", new Date());
  if (isValid(parsed)) return parsed;
  const d = new Date(dateStr);
  return isValid(d) ? d : undefined;
};

const formatDateString = (date: Date): string => {
  return format(date, "MM/dd/yyyy");
};

export default function TaskForm({
  metadataList,
  isLoadingMetadata = false,
  fundList = [],
  isLoadingFunds = false,
  participantList = [],
  isLoadingParticipants = false,
  parameters = [],
  isLoadingParameters = false,
  selectedTask,
  onSelectTask,
  onReturnTypeChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  apiError = null,
  feedbackBanner = null,
}: TaskFormProps) {
  // Radio selection: "dataset" (Data Views) vs "dataprocess" (Data Process)
  const [returnType, setReturnType] = useState<TaskReturnType>("dataset");

  // Dynamic form input values map
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Download selection format (for Data Views)
  const [downloadOption, setDownloadOption] = useState<string>("excel");

  // Validation error message (e.g. BeginDate > EndDate)
  const [validationError, setValidationError] = useState<string | null>(null);

  // Derived active feedback message for constant top display (matching Allocations screen)
  const activeFeedback = useMemo(() => {
    // 1. Submit feedback or API error or validation error
    if (feedbackBanner) return feedbackBanner;
    if (apiError) return { type: "error" as const, message: apiError };
    if (validationError)
      return { type: "error" as const, message: validationError };

    // 2. Initial state: when task is not selected
    if (!selectedTask) {
      return {
        type: "info" as const,
        message: "select Data Views or Data Process and choose a task",
      };
    }

    // 3. Active selection state: show selected task
    const viewLabel = returnType === "dataset" ? "Data Views" : "Data Process";
    return {
      type: "info" as const,
      message: `${viewLabel} - ${selectedTask.name}`,
    };
  }, [feedbackBanner, apiError, validationError, selectedTask, returnType]);

  // Calendar popover open states map
  const [calendarOpenMap, setCalendarOpenMap] = useState<
    Record<string, boolean>
  >({});

  // Filter tasks matching current returnType
  const filteredTasks = useMemo(() => {
    return metadataList.filter((m) => m.returnType === returnType);
  }, [metadataList, returnType]);

  // Options for Task dropdown
  const taskOptions: PopoverSelectOption[] = useMemo(() => {
    return filteredTasks.map((t) => ({
      value: String(t.id),
      label: t.name,
      sublabel: t.description || t.spName,
    }));
  }, [filteredTasks]);

  // Options for Fund dropdown (Displayed format: "FUND226- FUND demo3 name")
  const fundOptions: PopoverSelectOption[] = useMemo(() => {
    return fundList.map((f) => {
      const code = f.fund || "";
      const name = f.fundName || "";
      const label =
        code && name ? `${code}- ${name}` : name || code || String(f.fundID);
      return {
        value: String(f.fundID),
        label,
      };
    });
  }, [fundList]);

  // Options for Participant dropdown (Displayed format: "P025 - First Presbyterian Church")
  const participantOptions: PopoverSelectOption[] = useMemo(() => {
    return participantList.map((p) => {
      const num = p.participantNumber || "";
      const name = p.participantName || "";
      const label =
        num && name
          ? `${num} - ${name}`
          : name || num || String(p.participantID);
      return {
        value: String(p.participantID),
        label,
      };
    });
  }, [participantList]);

  // Handle radio option switch between Data Views & Data Process
  const handleRadioChange = (type: TaskReturnType) => {
    setReturnType(type);
    onReturnTypeChange(type);
    onSelectTask(null);
    setFormValues({});
    setValidationError(null);
  };

  // Filter input parameters eligible to render (parameterType = IN, exclude system ClientID/SessionID)
  const inParameters = useMemo(() => {
    return parameters.filter((p) => {
      const typeMatch = p.parameterType === "IN";
      const nameUpper = (p.parameterName || "").toUpperCase();
      // Allow FundID, ParticipantID, EndDate, BeginDate, Date, AllocateString etc.
      // Auto-filled ClientID / SessionID are handled in submit if present in parameters
      return typeMatch && nameUpper !== "CLIENTID" && nameUpper !== "SESSIONID";
    });
  }, [parameters]);

  // Initialize form default values when selectedTask or parameters change
  useEffect(() => {
    const initial: Record<string, string> = {};
    inParameters.forEach((p) => {
      const nameUpper = p.parameterName.toUpperCase();
      if (nameUpper.includes("FUND") && fundList.length > 0) {
        initial[p.parameterName] = String(fundList[0].fundID);
      } else if (
        nameUpper.includes("PARTICIPANT") &&
        participantList.length > 0
      ) {
        initial[p.parameterName] = String(participantList[0].participantID);
      } else if (nameUpper.includes("DATE")) {
        initial[p.parameterName] = format(new Date(), "MM/dd/yyyy");
      } else if (nameUpper.includes("ALLOCATESTRING")) {
        initial[p.parameterName] = "AllocateString";
      } else {
        initial[p.parameterName] = "";
      }
    });
    setFormValues(initial);
    setValidationError(null);
  }, [selectedTask, parameters, fundList, participantList]);

  // Field change handler
  const handleFieldChange = (paramName: string, val: string) => {
    setFormValues((prev) => ({
      ...prev,
      [paramName]: val,
    }));
    setValidationError(null);
  };

  // Date range validation (Section 15 of spec doc)
  const validateDates = (): boolean => {
    const beginStr = formValues["BeginDate"] || formValues["beginDate"];
    const endStr = formValues["EndDate"] || formValues["endDate"];

    if (beginStr && endStr) {
      const beginDate = parseDateString(beginStr);
      const endDate = parseDateString(endStr);
      if (beginDate && endDate && beginDate > endDate) {
        setValidationError("Begin Date cannot exceed End Date.");
        return false;
      }
    }
    return true;
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!validateDates()) return;

    await onSubmit(
      formValues,
      returnType === "dataset" ? downloadOption : undefined,
    );
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      {/* Top Constant Feedback Banner (matching Allocations screen) */}
      <div
        className={`shrink-0 flex items-center gap-2.5 rounded-lg p-2.5 text-xs sm:text-[12px] border transition-colors ${
          activeFeedback.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : activeFeedback.type === "error"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-blue-50 text-blue-900 border-blue-200"
        }`}
      >
        {activeFeedback.type === "success" ? (
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
        ) : activeFeedback.type === "error" ? (
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
        ) : (
          <Info size={18} className="shrink-0 text-blue-600" />
        )}
        <span>{activeFeedback.message}</span>
      </div>

      {/* Main Task Form Card */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Top Radio Selector: Select: (o) Data Views ( ) Data Process */}
          <div className="grid grid-cols-[120px_12px_1fr] sm:grid-cols-[130px_12px_1fr] items-center gap-1 sm:gap-2 border-b border-slate-100 pb-4">
            <span className="text-sm font-semibold text-slate-800 truncate">
              Select
            </span>
            <span className="text-sm font-semibold text-slate-800 text-center">
              :
            </span>
            <div className="flex items-center space-x-6">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm  text-slate-800">
                <input
                  type="radio"
                  name="taskReturnType"
                  value="dataset"
                  checked={returnType === "dataset"}
                  onChange={() => handleRadioChange("dataset")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                Data Views
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-800">
                <input
                  type="radio"
                  name="taskReturnType"
                  value="dataprocess"
                  checked={returnType === "dataprocess"}
                  onChange={() => handleRadioChange("dataprocess")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                Data Process
              </label>
            </div>
          </div>

          {/* Task Selection Dropdown: Task: [ Select... v ] */}
          <div className="grid grid-cols-[120px_12px_1fr] sm:grid-cols-[130px_12px_1fr] items-center gap-1 sm:gap-2">
            <span className="text-sm font-semibold text-slate-800 truncate">
              Task
            </span>
            <span className="text-sm font-semibold text-slate-800 text-center">
              :
            </span>
            <div className="flex-1 min-w-0 max-w-sm">
              <div className="relative flex items-center w-full">
                <PopoverSelect
                  value={selectedTask ? String(selectedTask.id) : ""}
                  options={taskOptions}
                  placeholder={
                    isLoadingMetadata ? "Loading tasks..." : "Select..."
                  }
                  onChange={(val) => {
                    const match = metadataList.find(
                      (m) => String(m.id) === val,
                    );
                    onSelectTask(match || null);
                  }}
                  disabled={isLoadingMetadata}
                  className="h-8 w-full border-slate-300 rounded-lg text-sm bg-white shadow-2xs pr-8"
                />
                {selectedTask && (
                  <button
                    type="button"
                    onClick={() => onSelectTask(null)}
                    className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors rounded-md shrink-0"
                    title="Clear selection"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Parameter Input Fields (Rendered when Task is selected) */}
          {selectedTask && (
            <div className="space-y-3 pt-2  border-slate-100 animate-in fade-in-50 duration-200">
              {isLoadingParameters ? (
                <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-blue-600" />
                  Loading task parameters...
                </div>
              ) : inParameters.length === 0 ? (
                <div className="py-4 text-xs text-slate-500 italic text-center bg-slate-50 rounded-lg border border-slate-100">
                  No input parameters required for this task.
                </div>
              ) : (
                inParameters.map((param) => {
                  const nameUpper = param.parameterName.toUpperCase();
                  const isFund = nameUpper.includes("FUND");
                  const isParticipant = nameUpper.includes("PARTICIPANT");
                  const isDate =
                    nameUpper.includes("DATE") ||
                    param.inputType === "date" ||
                    param.dbType === "smalldatetime";
                  const isSelect =
                    param.inputType === "select" && !isFund && !isParticipant;

                  return (
                    <div
                      key={param.parameterID}
                      className="grid grid-cols-[120px_12px_1fr] sm:grid-cols-[130px_12px_1fr] items-center gap-1 sm:gap-2"
                    >
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {param.parameterName}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 text-center">
                        :
                      </span>
                      <div className="flex-1 min-w-0 max-w-sm">
                        {/* 1. FundID Special Lookup Field */}
                        {isFund ? (
                          <PopoverSelect
                            value={formValues[param.parameterName] || ""}
                            options={fundOptions}
                            placeholder={
                              isLoadingFunds
                                ? "Loading funds..."
                                : "Select Fund"
                            }
                            onChange={(val) =>
                              handleFieldChange(param.parameterName, val)
                            }
                            disabled={isLoadingFunds}
                            className="h-8 w-full border-slate-300 rounded-lg text-sm bg-white shadow-2xs"
                          />
                        ) : /* 2. ParticipantID Special Lookup Field */
                        isParticipant ? (
                          <PopoverSelect
                            value={formValues[param.parameterName] || ""}
                            options={participantOptions}
                            placeholder={
                              isLoadingParticipants
                                ? "Loading participants..."
                                : "Select Participant"
                            }
                            onChange={(val) =>
                              handleFieldChange(param.parameterName, val)
                            }
                            disabled={isLoadingParticipants}
                            className="h-8 w-full border-slate-300 rounded-lg text-sm bg-white shadow-2xs"
                          />
                        ) : /* 3. Date / SmallDateTime Field with Calendar Picker */
                        isDate ? (
                          <Popover
                            open={Boolean(calendarOpenMap[param.parameterName])}
                            onOpenChange={(open) =>
                              setCalendarOpenMap((prev) => ({
                                ...prev,
                                [param.parameterName]: open,
                              }))
                            }
                          >
                            <div className="relative flex items-center w-full">
                              <input
                                type="text"
                                value={formValues[param.parameterName] || ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    param.parameterName,
                                    e.target.value,
                                  )
                                }
                                placeholder="MM/DD/YYYY"
                                className="w-full h-8 rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-[12px] text-slate-800 shadow-2xs focus:border-blue-600 focus:outline-none"
                              />
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                                  title="Open calendar"
                                >
                                  <CalendarIcon size={16} />
                                </button>
                              </PopoverTrigger>
                            </div>
                            <PopoverContent
                              className="w-auto p-0 border border-slate-200 shadow-md bg-white"
                              align="end"
                            >
                              <Calendar
                                mode="single"
                                selected={parseDateString(
                                  formValues[param.parameterName] || "",
                                )}
                                defaultMonth={
                                  parseDateString(
                                    formValues[param.parameterName] || "",
                                  ) || new Date()
                                }
                                onSelect={(date) => {
                                  if (date) {
                                    handleFieldChange(
                                      param.parameterName,
                                      formatDateString(date),
                                    );
                                    setCalendarOpenMap((prev) => ({
                                      ...prev,
                                      [param.parameterName]: false,
                                    }));
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        ) : /* 4. Generic Select Field */
                        isSelect ? (
                          <select
                            value={formValues[param.parameterName] || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                param.parameterName,
                                e.target.value,
                              )
                            }
                            className="w-full h-8 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-2xs focus:border-blue-600 focus:outline-none"
                          >
                            <option value="">Select...</option>
                            {param.options?.map((opt) => (
                              <option
                                key={String(opt.value)}
                                value={String(opt.value)}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          /* 5. Regular Text / Input Field */
                          <input
                            type="text"
                            value={formValues[param.parameterName] || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                param.parameterName,
                                e.target.value,
                              )
                            }
                            placeholder={param.parameterName}
                            className="w-full h-8 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-2xs focus:border-blue-600 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Download Option Field (For Data Views / dataset) */}
              {returnType === "dataset" && (
                <div className="grid grid-cols-[120px_12px_1fr] sm:grid-cols-[130px_12px_1fr] items-center gap-1 sm:gap-2">
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    Download
                  </span>
                  <span className="text-sm font-semibold text-slate-800 text-center">
                    :
                  </span>
                  <div className="flex-1 min-w-0 max-w-sm">
                    <select
                      value={downloadOption}
                      onChange={(e) => setDownloadOption(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-300 bg-white px-3 text-[12px] text-slate-800 shadow-2xs focus:border-blue-600 focus:outline-none"
                    >
                      {selectedTask.allowExcelExport !== false && (
                        <option value="excel">Excel</option>
                      )}
                      {selectedTask.allowCsvExport !== false && (
                        <option value="csv">CSV</option>
                      )}
                      {selectedTask.allowPdfExport !== false && (
                        <option value="pdf">PDF</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Action Buttons: [ Cancel ] [ Submit ] */}
          <div className="flex items-center gap-4 justify-end   border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-bold text-slate-800 hover:underline transition-colors px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTask || isSubmitting}
              className="rounded-xl bg-portal-navy px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
