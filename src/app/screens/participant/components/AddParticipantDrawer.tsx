"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ParticipantItem, ParticipantFormValues, AssociatedFundItem } from "../types";
import PopoverSelect from "@/components/common/PopoverSelect";
import StandardDatePicker from "@/components/common/StandardDatePicker";
import SearchBar from "@/components/common/SearchBar";
import { X, AlertCircle, CheckSquare, Square } from "lucide-react";

interface AddParticipantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    values: ParticipantFormValues,
    initialFundIds: (number | string)[]
  ) => Promise<boolean>;
  initialData?: ParticipantItem | null;
  fundOptions: AssociatedFundItem[];
  isSubmitting?: boolean;
  apiError?: string | null;
}

const PARTICIPANT_TYPE_OPTIONS = [
  { value: "Plan", label: "Plan" },
  { value: "Trust", label: "Trust" },
  { value: "Individual", label: "Individual" },
  { value: "Foundation", label: "Foundation" },
  { value: "Corporate", label: "Corporate" },
  { value: "Endowment", label: "Endowment" },
];

export default function AddParticipantDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  fundOptions,
  isSubmitting = false,
  apiError,
}: AddParticipantDrawerProps) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<ParticipantFormValues>({
    participantNumber: "",
    participantName: "",
    participantType: "Plan",
    isActive: true,
    openDate: new Date().toISOString().slice(0, 10),
    closeDate: "",
    selectedFundIds: [],
  });

  const [initialFundIds, setInitialFundIds] = useState<(number | string)[]>([]);
  const [fundSearch, setFundSearch] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const fundIds = initialData.fundID || [];
      setFormData({
        participantNumber: initialData.participantNumber || String(initialData.participantID),
        participantName: initialData.participantName || "",
        participantType: initialData.participantType || "Plan",
        isActive: (initialData.status || "Active").toLowerCase() === "active",
        openDate: initialData.openDate || new Date().toISOString().slice(0, 10),
        closeDate: initialData.closeDate || "",
        selectedFundIds: [...fundIds],
      });
      setInitialFundIds([...fundIds]);
    } else {
      setFormData({
        participantNumber: `PART-${Math.floor(100 + Math.random() * 900)}`,
        participantName: "",
        participantType: "Plan",
        isActive: true,
        openDate: new Date().toISOString().slice(0, 10),
        closeDate: "",
        selectedFundIds: fundOptions.length > 0 ? [fundOptions[0].fundID] : [],
      });
      setInitialFundIds([]);
    }
    setFundSearch("");
    setValidationErrors({});
  }, [initialData, isOpen, fundOptions]);

  // Filter available funds
  const filteredFunds = useMemo(() => {
    if (!fundSearch.trim()) return fundOptions;
    const q = fundSearch.toLowerCase();
    return fundOptions.filter(
      (f) =>
        f.fundName.toLowerCase().includes(q) ||
        f.fund.toLowerCase().includes(q) ||
        f.fundType.toLowerCase().includes(q)
    );
  }, [fundOptions, fundSearch]);

  if (!isOpen) return null;

  const toggleFundSelection = (fundId: number | string) => {
    setFormData((prev) => {
      const exists = prev.selectedFundIds.includes(fundId);
      const updated = exists
        ? prev.selectedFundIds.filter((id) => id !== fundId)
        : [...prev.selectedFundIds, fundId];
      return { ...prev, selectedFundIds: updated };
    });
  };

  const handleSelectAllFunds = () => {
    if (formData.selectedFundIds.length === fundOptions.length) {
      setFormData((prev) => ({ ...prev, selectedFundIds: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedFundIds: fundOptions.map((f) => f.fundID),
      }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.participantName.trim()) {
      errors.participantName = "Participant name is required";
    }
    if (!formData.openDate) {
      errors.openDate = "Open date is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData, initialFundIds);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {isEditing ? "Edit Participant" : "Add Participant"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? `Update details and fund associations for ${initialData?.participantName}`
                  : "Register a participant and associate investment funds"}
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5">
            {apiError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">{apiError}</span>
              </div>
            )}

            {/* Row 1: Participant Number & Participant Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Participant Number</label>
                <input
                  type="text"
                  value={formData.participantNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, participantNumber: e.target.value }))
                  }
                  placeholder="e.g. PART-101"
                  className="form-input-standard"
                  disabled={isEditing}
                />
              </div>

              <div>
                <label className="form-label">
                  Participant Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.participantName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, participantName: e.target.value }))
                  }
                  placeholder="e.g. Alex West Retirement Plan"
                  className="form-input-standard"
                  required
                />
                {validationErrors.participantName && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {validationErrors.participantName}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Participant Type & Is Active */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="form-label">
                  Participant Type <span className="text-rose-500">*</span>
                </label>
                <PopoverSelect
                  value={formData.participantType}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, participantType: val }))
                  }
                  options={PARTICIPANT_TYPE_OPTIONS}
                  placeholder="Select Participant Type"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <label className="relative flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-portal-navy focus:ring-portal-navy"
                  />
                  <span>Is Active</span>
                </label>
                {formData.isActive ? (
                  <span className="badge-status-active text-[10px]">Active</span>
                ) : (
                  <span className="badge-status-inactive text-[10px]">Inactive</span>
                )}
              </div>
            </div>

            {/* Row 3: Open Date & Close Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Open Date <span className="text-rose-500">*</span>
                </label>
                <StandardDatePicker
                  value={formData.openDate}
                  onChange={(val) => setFormData((prev) => ({ ...prev, openDate: val }))}
                  placeholder="dd-mm-yyyy"
                  required
                />
                {validationErrors.openDate && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {validationErrors.openDate}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Close Date</label>
                <StandardDatePicker
                  value={formData.closeDate}
                  onChange={(val) => setFormData((prev) => ({ ...prev, closeDate: val }))}
                  placeholder="dd-mm-yyyy (Optional)"
                />
              </div>
            </div>

            {/* Associated Funds Table (Screenshot 3 & Document Section 4) */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Associated Funds
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign and associate funds with this participant portfolio.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {formData.selectedFundIds.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllFunds}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {formData.selectedFundIds.length === fundOptions.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>

              {/* Fund search inside form */}
              <SearchBar
                value={fundSearch}
                onChange={setFundSearch}
                placeholder="Filter funds by name or type..."
                size="sm"
                className="w-full"
              />

              {/* Funds Selection Grid */}
              <div className="rounded-lg border border-slate-200 max-h-56 overflow-y-auto overflow-x-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Fund Name</th>
                      <th className="py-2 px-3">Fund Type</th>
                      <th className="py-2 px-3 text-right">Associate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFunds.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-slate-400">
                          No funds match filter.
                        </td>
                      </tr>
                    ) : (
                      filteredFunds.map((fund) => {
                        const isSelected = formData.selectedFundIds.includes(fund.fundID);
                        return (
                          <tr
                            key={fund.fundID}
                            onClick={() => toggleFundSelection(fund.fundID)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-sky-50/60 hover:bg-sky-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-2 px-3">
                              <span className="font-medium text-slate-800">
                                {fund.fundName}
                              </span>
                              <span className="ml-1.5 text-[11px] text-slate-400">
                                ({fund.fund})
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{fund.fundType}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFundSelection(fund.fundID);
                                }}
                                className="text-slate-500 hover:text-portal-navy"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-portal-navy" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-300" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-md bg-portal-navy hover:bg-portal-navy-hover text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
