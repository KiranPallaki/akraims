"use client";

import React, { useState, useEffect } from "react";
import {
  TaskMetadata,
  CreateMetaDataPayload,
  CreateParameterPayload,
  RoleOption,
} from "../types";
import {
  CreateMetaData,
  updateMetaData,
  CreateNewParamenter,
  fetchSPNames,
  getRoles,
  fetchTaskParameters,
} from "../api";
import ConstantMessageBanner from "@/components/common/ConstantMessageBanner";
import PopoverSelect from "@/components/common/PopoverSelect";
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, X, RefreshCw } from "lucide-react";

export interface CreateMetaDataFormProps {
  initialTask?: TaskMetadata | null;
  onClose: () => void;
  onSuccess: (savedTask: TaskMetadata) => void;
  clientID?: number;
}

const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const EXECUTION_METHOD_OPTIONS = [
  { value: "SP", label: "SP (Stored Procedure)" },
  { value: "REST", label: "REST API Endpoint" },
];

const RETURN_TYPE_OPTIONS = [
  { value: "dataset", label: "Data Set" },
  { value: "dataprocess", label: "Data Process" },
];

const DB_TYPE_OPTIONS = [
  { value: "int", label: "int" },
  { value: "varchar", label: "varchar" },
  { value: "smalldatetime", label: "smalldatetime" },
  { value: "datetime", label: "datetime" },
  { value: "decimal", label: "decimal" },
  { value: "bit", label: "bit" },
];

const INPUT_TYPE_OPTIONS = [
  { value: "Number", label: "Number" },
  { value: "Date", label: "Date" },
  { value: "Text", label: "Text" },
  { value: "Select", label: "Select" },
];

const PARAMETER_TYPE_OPTIONS = [
  { value: "IN", label: "IN" },
  { value: "OUT", label: "OUT" },
];

export default function CreateMetaDataForm({
  initialTask,
  onClose,
  onSuccess,
  clientID,
}: CreateMetaDataFormProps) {
  const isEditing = Boolean(initialTask);
  const [activeTab, setActiveTab] = useState<"metadata" | "parameters">("metadata");

  // Roles list
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Meta Data Form State (Matching Image 1)
  const [metaData, setMetaData] = useState<CreateMetaDataPayload>({
    name: initialTask?.name || "",
    label: initialTask?.label || initialTask?.name || "",
    description: initialTask?.description || "",
    schemaName: initialTask?.schemaName || "dbo",
    executionMethod: initialTask?.executionMethod || "SP",
    spName: initialTask?.spName || "",
    resourceUrl: initialTask?.resourceUrl || "",
    httpMethod: initialTask?.httpMethod || "POST",
    returnType: initialTask?.returnType || "dataset",
    submitButtonText: initialTask?.submitButtonText || "Download",
    cancelButtonText: initialTask?.cancelButtonText || "Cancel",
    allowExecute: initialTask?.allowExecute !== false,
    allowExcelExport: initialTask?.allowExcelExport !== false,
    allowPdfExport: initialTask?.allowPdfExport === true,
    allowCsvExport: initialTask?.allowCsvExport !== false,
    active: initialTask?.active !== false,
    isDataExtract: initialTask?.isDataExtract !== false,
    roleId: initialTask?.roleId || "Admin",
  });

  // Parameters Form State (Matching Images 2, 3, 4)
  const [parameters, setParameters] = useState<CreateParameterPayload[]>([
    {
      name: "FundID",
      parameterType: "IN",
      dbType: "int",
      type: "int",
      position: 1,
      isNullable: false,
      defaultValue: "",
      length: 0,
      precision: 0,
      scale: 0,
      inputType: "Number",
      label: "FundID",
      placeHolder: "FundID",
      tooltip: "FundID",
      InputDataSource: [],
      options: [],
      active: true,
      pattern: "",
    },
    {
      name: "ParticipantID",
      parameterType: "IN",
      dbType: "int",
      type: "int",
      position: 2,
      isNullable: false,
      defaultValue: "",
      length: 0,
      precision: 0,
      scale: 0,
      inputType: "Number",
      label: "ParticipantID",
      placeHolder: "ParticipantID",
      tooltip: "ParticipantID",
      InputDataSource: [],
      options: [],
      active: true,
      pattern: "",
    },
    {
      name: "OpenDate",
      parameterType: "IN",
      dbType: "smalldatetime",
      type: "smalldatetime",
      position: 3,
      isNullable: false,
      defaultValue: "",
      length: 0,
      precision: 0,
      scale: 0,
      inputType: "Date",
      label: "OpenDate",
      placeHolder: "OpenDate",
      tooltip: "OpenDate",
      InputDataSource: [],
      options: [],
      active: true,
      pattern: "",
    },
  ]);

  // Status and feedback banner
  const [statusType, setStatusType] = useState<"info" | "error" | "success">("info");
  const [statusMessage, setStatusMessage] = useState<string>(
    isEditing
      ? `Editing task "${initialTask?.name}". Update configuration and parameter bindings.`
      : "Please configure metadata details and parameter schemas below."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscoveringSP, setIsDiscoveringSP] = useState(false);

  // Load roles and initial parameters on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRoles(true);
    getRoles(undefined, clientID)
      .then((data) => {
        if (isMounted && data.length > 0) {
          setRoles(data);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingRoles(false);
      });

    if (initialTask?.id) {
      fetchTaskParameters(initialTask.id, clientID).then((paramList) => {
        if (isMounted && paramList && paramList.length > 0) {
          const mapped: CreateParameterPayload[] = paramList.map((p, idx) => ({
            name: p.parameterName || `Param${idx + 1}`,
            parameterType: (p.parameterType || "IN").toUpperCase(),
            dbType: p.dbType || "varchar",
            type: p.dbType || "varchar",
            position: idx + 1,
            isNullable: false,
            defaultValue: p.defaultValue || "",
            length: 50,
            precision: 0,
            scale: 0,
            inputType: p.inputType === "date" ? "Date" : p.inputType === "select" ? "Select" : "Text",
            label: p.parameterName,
            placeHolder: p.parameterName,
            tooltip: p.parameterName,
            InputDataSource: [],
            options: [],
            active: true,
            pattern: "",
          }));
          setParameters(mapped);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [clientID, initialTask]);

  // When spName changes and user leaves input or clicks discover, fetch SP parameter definitions
  const handleDiscoverParameters = async (sp: string) => {
    if (!sp.trim()) return;
    setIsDiscoveringSP(true);
    try {
      const discovered = await fetchSPNames(undefined, clientID, "SPParameters", sp.trim());
      if (discovered && discovered.length > 0) {
        const mapped: CreateParameterPayload[] = discovered.map((p: any, idx: number) => ({
          name: p.name || p.parameterName || `Param${idx + 1}`,
          parameterType: (p.parameterType || "IN").toUpperCase(),
          dbType: p.dbType || "varchar",
          type: p.type || p.dbType || "varchar",
          position: p.position ?? idx + 1,
          isNullable: p.isNullable === true || p.isNullable === "YES",
          defaultValue: p.defaultValue || "",
          length: p.length || 0,
          precision: p.precision || 0,
          scale: p.scale || 0,
          inputType: p.inputType || "Text",
          label: p.label || p.name || "",
          placeHolder: p.placeHolder || p.name || "",
          tooltip: p.tooltip || p.name || "",
          InputDataSource: p.InputDataSource || [],
          options: p.options || [],
          active: p.active !== false && p.active !== "NO",
          pattern: p.pattern || "",
        }));
        setParameters(mapped);
        setStatusType("info");
        setStatusMessage(`Auto-discovered ${mapped.length} parameters from stored procedure "${sp}".`);
      }
    } catch (err) {
      console.warn("Failed to discover parameters:", err);
    } finally {
      setIsDiscoveringSP(false);
    }
  };

  // Add parameter card
  const handleAddParameter = () => {
    const nextPos = parameters.length + 1;
    const newParam: CreateParameterPayload = {
      name: `NewParam${nextPos}`,
      parameterType: "IN",
      dbType: "varchar",
      type: "varchar",
      position: nextPos,
      isNullable: false,
      defaultValue: "",
      length: 50,
      precision: 0,
      scale: 0,
      inputType: "Text",
      label: `NewParam${nextPos}`,
      placeHolder: `NewParam${nextPos}`,
      tooltip: `NewParam${nextPos}`,
      InputDataSource: [],
      options: [],
      active: true,
      pattern: "",
    };
    setParameters((prev) => [...prev, newParam]);
  };

  // Remove parameter card
  const handleRemoveParameter = (index: number) => {
    setParameters((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update specific parameter field
  const handleUpdateParameter = (index: number, field: keyof CreateParameterPayload, value: any) => {
    setParameters((prev) =>
      prev.map((param, idx) => {
        if (idx !== index) return param;
        const updated = { ...param, [field]: value };
        // Keep parameterName/label/placeholder synced with Name if they match
        if (field === "name") {
          updated.label = value;
          updated.placeHolder = value;
          updated.tooltip = value;
        }
        return updated;
      })
    );
    if (statusType === "error") {
      setStatusType("info");
      setStatusMessage("Please configure metadata details and parameter schemas below.");
    }
  };

  // Validate Meta Data Tab
  const validateMetaData = (): boolean => {
    if (!metaData.name.trim()) {
      setStatusType("error");
      setStatusMessage("Task Name is required.");
      setActiveTab("metadata");
      return false;
    }
    if (!metaData.spName.trim() && metaData.executionMethod === "SP") {
      setStatusType("error");
      setStatusMessage("Stored Procedure Name (spName) is required when Execution Method is SP.");
      setActiveTab("metadata");
      return false;
    }
    return true;
  };

  // Validate Parameters Tab
  const validateParameters = (): boolean => {
    for (let i = 0; i < parameters.length; i++) {
      const p = parameters[i];
      if (!p.name.trim()) {
        setStatusType("error");
        setStatusMessage(`Parameter Data ${i + 1}: Name cannot be empty.`);
        return false;
      }
    }
    return true;
  };

  // Proceed to Next Tab
  const handleNext = () => {
    if (!validateMetaData()) return;
    setActiveTab("parameters");
    setStatusType("info");
    setStatusMessage("Review and configure parameter definitions for this task.");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMetaData()) return;
    if (!validateParameters()) return;

    setIsSubmitting(true);
    setStatusType("info");
    setStatusMessage("Saving task metadata and parameters...");

    try {
      const payload: CreateMetaDataPayload = {
        ...metaData,
        label: metaData.label || metaData.name,
      };

      let metaId = initialTask?.id;

      if (isEditing && metaId) {
        // Update Metadata
        const res = await updateMetaData(metaId, payload, undefined, clientID);
        if (!res.ok) {
          setIsSubmitting(false);
          setStatusType("error");
          setStatusMessage(res.message || "Failed to update metadata record.");
          return;
        }
      } else {
        // Create Metadata
        const res = await CreateMetaData(payload, undefined, clientID);
        if (!res.ok) {
          setIsSubmitting(false);
          setStatusType("error");
          setStatusMessage(res.message || "Failed to create metadata record.");
          return;
        }
        metaId = res.id;
      }

      // Persist Bulk Parameters if metaId exists
      if (metaId && parameters.length > 0) {
        await CreateNewParamenter(metaId, parameters, undefined, clientID);
      }

      setIsSubmitting(false);
      setStatusType("success");
      setStatusMessage(`Task "${metaData.name}" saved successfully!`);

      const savedTask: TaskMetadata = {
        id: metaId || `meta-${Date.now()}`,
        name: metaData.name,
        spName: metaData.spName,
        description: metaData.description,
        returnType: metaData.returnType as any,
        allowExecute: metaData.allowExecute,
        allowExcelExport: metaData.allowExcelExport,
        allowPdfExport: metaData.allowPdfExport,
        allowCsvExport: metaData.allowCsvExport,
        active: metaData.active,
      };

      setTimeout(() => {
        onSuccess(savedTask);
      }, 700);
    } catch (err) {
      setIsSubmitting(false);
      setStatusType("error");
      setStatusMessage(err instanceof Error ? err.message : "Error saving task metadata.");
    }
  };

  const roleOptions =
    roles.length > 0
      ? roles.map((r) => ({ value: String(r.id || r.name), label: r.name || String(r.id) }))
      : [
          { value: "Admin", label: "Admin" },
          { value: "User", label: "User" },
          { value: "Manager", label: "Manager" },
        ];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 text-xs">
      {/* Top Header matching Screenshot 1 */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50/80">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {isEditing ? `Edit Task: ${initialTask?.name}` : "Create Task / Metadata"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure metadata execution parameters, export flags, and stored procedure schemas
          </p>
        </div>

        {/* Top actions: Close button matching portal branding and X close */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="rounded-md bg-portal-navy hover:bg-portal-navy-hover active:opacity-90 text-white font-semibold px-4 py-1.5 text-xs shadow-2xs transition-colors"
          >
            Close
          </button>
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs Switcher matching Screenshot 1 */}
      <div className="border-b border-slate-200 bg-white px-6 pt-3 flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab("metadata")}
          className={`px-4 py-2 text-xs font-semibold transition-all rounded-t-lg border-b-2 ${
            activeTab === "metadata"
              ? "border-portal-navy text-portal-navy bg-white shadow-2xs"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Meta Data
        </button>
        <button
          type="button"
          onClick={() => {
            if (validateMetaData()) {
              setActiveTab("parameters");
            }
          }}
          className={`px-4 py-2 text-xs font-semibold transition-all rounded-t-lg border-b-2 ${
            activeTab === "parameters"
              ? "border-portal-navy text-portal-navy bg-white shadow-2xs"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          Parameter Data
        </button>
      </div>

      {/* Constant Message Banner */}
      <div className="px-6 pt-4">
        <ConstantMessageBanner
          type={statusType}
          message={statusMessage}
        />
      </div>

      {/* Form Content Area */}
      <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* ================= TAB 1: META DATA (Screenshot 1) ================= */}
        {activeTab === "metadata" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* 2-Column Grid Layout matching Screenshot 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* COLUMN 1 */}
              <div className="space-y-3.5">
                {/* Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Name <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={metaData.name}
                    onChange={(e) => {
                      setMetaData((prev) => ({
                        ...prev,
                        name: e.target.value,
                        label: prev.label === prev.name ? e.target.value : prev.label,
                      }));
                    }}
                    placeholder="Name"
                    className="flex-1 form-input-standard h-8 text-xs"
                    required
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0 pt-1.5">
                    Description:
                  </label>
                  <textarea
                    rows={3}
                    value={metaData.description}
                    onChange={(e) =>
                      setMetaData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="description"
                    className="flex-1 form-input-standard text-xs py-1.5"
                  />
                </div>

                {/* Execution Method */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Execution Method:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.executionMethod}
                      onChange={(val) =>
                        setMetaData((prev) => ({ ...prev, executionMethod: val }))
                      }
                      options={EXECUTION_METHOD_OPTIONS}
                      placeholder="Select Method"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* returnType */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    returnType:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.returnType}
                      onChange={(val) =>
                        setMetaData((prev) => ({ ...prev, returnType: val as any }))
                      }
                      options={RETURN_TYPE_OPTIONS}
                      placeholder="Select Return Type"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Cancel Button Text */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Cancel Button Text:
                  </label>
                  <input
                    type="text"
                    value={metaData.cancelButtonText}
                    onChange={(e) =>
                      setMetaData((prev) => ({
                        ...prev,
                        cancelButtonText: e.target.value,
                      }))
                    }
                    placeholder="Cancel"
                    className="flex-1 form-input-standard h-8 text-xs"
                  />
                </div>

                {/* IsDataExtract */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    IsDataExtract:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.isDataExtract ? "Yes" : "No"}
                      onChange={(val) =>
                        setMetaData((prev) => ({
                          ...prev,
                          isDataExtract: val === "Yes",
                        }))
                      }
                      options={YES_NO_OPTIONS}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Allow Pdf Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Allow Pdf Export:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.allowPdfExport ? "Yes" : "No"}
                      onChange={(val) =>
                        setMetaData((prev) => ({
                          ...prev,
                          allowPdfExport: val === "Yes",
                        }))
                      }
                      options={YES_NO_OPTIONS}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Active */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Active:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.active ? "Yes" : "No"}
                      onChange={(val) =>
                        setMetaData((prev) => ({
                          ...prev,
                          active: val === "Yes",
                        }))
                      }
                      options={YES_NO_OPTIONS}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* COLUMN 2 */}
              <div className="space-y-3.5">
                {/* Label */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Label:
                  </label>
                  <input
                    type="text"
                    value={metaData.label}
                    onChange={(e) =>
                      setMetaData((prev) => ({ ...prev, label: e.target.value }))
                    }
                    placeholder="Label"
                    className="flex-1 form-input-standard h-8 text-xs"
                  />
                </div>

                {/* Schema Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Schema Name:
                  </label>
                  <input
                    type="text"
                    value={metaData.schemaName}
                    onChange={(e) =>
                      setMetaData((prev) => ({ ...prev, schemaName: e.target.value }))
                    }
                    placeholder="dbo"
                    className="flex-1 form-input-standard h-8 text-xs"
                  />
                </div>

                {/* spName + Auto-discovery */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    spName <span className="text-rose-500">*</span>:
                  </label>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={metaData.spName}
                      onChange={(e) =>
                        setMetaData((prev) => ({ ...prev, spName: e.target.value }))
                      }
                      onBlur={() => {
                        if (metaData.spName.trim()) {
                          handleDiscoverParameters(metaData.spName.trim());
                        }
                      }}
                      placeholder="spName"
                      className="w-full form-input-standard h-8 text-xs pr-8"
                      required
                    />
                    {isDiscoveringSP && (
                      <RefreshCw
                        size={14}
                        className="animate-spin text-portal-navy absolute right-2.5"
                      />
                    )}
                  </div>
                </div>

                {/* Submit Button Text */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Submit Button Text:
                  </label>
                  <input
                    type="text"
                    value={metaData.submitButtonText}
                    onChange={(e) =>
                      setMetaData((prev) => ({
                        ...prev,
                        submitButtonText: e.target.value,
                      }))
                    }
                    placeholder="Download"
                    className="flex-1 form-input-standard h-8 text-xs"
                  />
                </div>

                {/* Allow Execute */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Allow Execute:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.allowExecute ? "Yes" : "No"}
                      onChange={(val) =>
                        setMetaData((prev) => ({
                          ...prev,
                          allowExecute: val === "Yes",
                        }))
                      }
                      options={YES_NO_OPTIONS}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Allow Excel Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Allow Excel Export:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.allowExcelExport ? "Yes" : "No"}
                      onChange={(val) =>
                        setMetaData((prev) => ({
                          ...prev,
                          allowExcelExport: val === "Yes",
                        }))
                      }
                      options={YES_NO_OPTIONS}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Allow Csv Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Allow Csv Export:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.allowCsvExport ? "Yes" : "No"}
                      onChange={(val) =>
                        setMetaData((prev) => ({
                          ...prev,
                          allowCsvExport: val === "Yes",
                        }))
                      }
                      options={YES_NO_OPTIONS}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Select Role */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                    Select Role:
                  </label>
                  <div className="flex-1">
                    <PopoverSelect
                      value={metaData.roleId}
                      onChange={(val) =>
                        setMetaData((prev) => ({ ...prev, roleId: val }))
                      }
                      options={roleOptions}
                      placeholder={isLoadingRoles ? "Loading roles..." : "Admin"}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Left Buttons matching Screenshot 1 */}
            <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-1.5 text-xs shadow-2xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-md bg-portal-navy hover:bg-portal-navy-hover active:opacity-90 text-white font-semibold px-5 py-1.5 text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PARAMETER DATA (Screenshots 2, 3, 4) ================= */}
        {activeTab === "parameters" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Top Toolbar for parameters */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Stored Procedure Parameters ({parameters.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Configure parameter names, data types, nullability, and input controls
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddParameter}
                className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 text-xs shadow-2xs transition-colors"
              >
                <Plus size={14} /> Add Parameter
              </button>
            </div>

            {/* Parameter Cards List matching Screenshots 2, 3, 4 */}
            <div className="space-y-6">
              {parameters.map((param, index) => {
                const paramNumber = index + 1;
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-5 shadow-2xs space-y-4"
                  >
                    {/* Header: "Parameter Data X" */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <h4 className="font-bold text-slate-800 text-sm tracking-tight">
                        Parameter Data {paramNumber}
                      </h4>
                      {parameters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove Parameter"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* 2-Column Parameter Grid matching Screenshots 2, 3, 4 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
                      {/* LEFT COLUMN */}
                      <div className="space-y-3">
                        {/* Name */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Name:
                          </label>
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) =>
                              handleUpdateParameter(index, "name", e.target.value)
                            }
                            placeholder="Name"
                            className="flex-1 form-input-standard h-8 text-xs bg-white"
                          />
                        </div>

                        {/* DB Type */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            DB Type:
                          </label>
                          <div className="flex-1">
                            <PopoverSelect
                              value={param.dbType}
                              onChange={(val) =>
                                handleUpdateParameter(index, "dbType", val)
                              }
                              options={DB_TYPE_OPTIONS}
                              placeholder="Select DB Type"
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        </div>

                        {/* isNullable */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            isNullable:
                          </label>
                          <div className="flex-1">
                            <PopoverSelect
                              value={param.isNullable ? "YES" : "NO"}
                              onChange={(val) =>
                                handleUpdateParameter(
                                  index,
                                  "isNullable",
                                  val === "YES"
                                )
                              }
                              options={[
                                { value: "NO", label: "NO" },
                                { value: "YES", label: "YES" },
                              ]}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        </div>

                        {/* Parameter Name (Read-only gray field matching screenshot) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Parameter Name:
                          </label>
                          <input
                            type="text"
                            value={param.name}
                            readOnly
                            className="flex-1 form-input-standard h-8 text-xs bg-slate-100 text-slate-600 cursor-not-allowed"
                          />
                        </div>

                        {/* Tooltip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Tooltip:
                          </label>
                          <input
                            type="text"
                            value={param.tooltip || ""}
                            onChange={(e) =>
                              handleUpdateParameter(index, "tooltip", e.target.value)
                            }
                            placeholder="Tooltip"
                            className="flex-1 form-input-standard h-8 text-xs bg-white"
                          />
                        </div>

                        {/* Pattern */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Pattern:
                          </label>
                          <input
                            type="text"
                            value={param.pattern || ""}
                            onChange={(e) =>
                              handleUpdateParameter(index, "pattern", e.target.value)
                            }
                            placeholder="Pattern"
                            className="flex-1 form-input-standard h-8 text-xs bg-white"
                          />
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="space-y-3">
                        {/* Parameter Type */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Parameter Type:
                          </label>
                          <div className="flex-1">
                            <PopoverSelect
                              value={param.parameterType}
                              onChange={(val) =>
                                handleUpdateParameter(index, "parameterType", val)
                              }
                              options={PARAMETER_TYPE_OPTIONS}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        </div>

                        {/* Position */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Position:
                          </label>
                          <input
                            type="number"
                            value={param.position}
                            onChange={(e) =>
                              handleUpdateParameter(
                                index,
                                "position",
                                Number(e.target.value) || 1
                              )
                            }
                            className="flex-1 form-input-standard h-8 text-xs bg-white"
                          />
                        </div>

                        {/* Default Value */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Default Value:
                          </label>
                          <input
                            type="text"
                            value={param.defaultValue || ""}
                            onChange={(e) =>
                              handleUpdateParameter(
                                index,
                                "defaultValue",
                                e.target.value
                              )
                            }
                            placeholder=""
                            className="flex-1 form-input-standard h-8 text-xs bg-white"
                          />
                        </div>

                        {/* PlaceHolder */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            PlaceHolder:
                          </label>
                          <input
                            type="text"
                            value={param.placeHolder || ""}
                            onChange={(e) =>
                              handleUpdateParameter(
                                index,
                                "placeHolder",
                                e.target.value
                              )
                            }
                            placeholder="PlaceHolder"
                            className="flex-1 form-input-standard h-8 text-xs bg-white"
                          />
                        </div>

                        {/* Active */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Active:
                          </label>
                          <div className="flex-1">
                            <PopoverSelect
                              value={param.active ? "Yes" : "NO"}
                              onChange={(val) =>
                                handleUpdateParameter(
                                  index,
                                  "active",
                                  val === "Yes"
                                )
                              }
                              options={[
                                { value: "Yes", label: "Yes" },
                                { value: "NO", label: "NO" },
                              ]}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        </div>

                        {/* Input Type */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="font-semibold text-xs text-slate-700 w-36 shrink-0">
                            Input Type:
                          </label>
                          <div className="flex-1">
                            <PopoverSelect
                              value={param.inputType}
                              onChange={(val) =>
                                handleUpdateParameter(index, "inputType", val)
                              }
                              options={INPUT_TYPE_OPTIONS}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("metadata")}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ArrowLeft size={14} /> Back to Meta Data
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-1.5 text-xs shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-portal-navy hover:bg-portal-navy-hover active:opacity-90 text-white font-semibold px-6 py-1.5 text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving Task...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      {isEditing ? "Save Changes" : "Create Task"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
