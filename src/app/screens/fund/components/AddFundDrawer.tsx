"use client";

import React, { useState, useEffect } from "react";
import { FundItem, FundFormValues } from "../types";
import PopoverSelect from "@/components/common/PopoverSelect";
import StandardDatePicker from "@/components/common/StandardDatePicker";
import { X, AlertCircle } from "lucide-react";

interface AddFundDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FundFormValues) => Promise<boolean>;
  initialData?: FundItem | null;
  isSubmitting?: boolean;
  apiError?: string | null;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "Endowment", label: "Endowment" },
  { value: "Operating", label: "Operating" },
  { value: "Pension", label: "Pension" },
  { value: "Trust", label: "Trust" },
  { value: "Custodial", label: "Custodial" },
];

const PRICE_SCHEDULE_OPTIONS = [
  { value: "Daily", label: "Daily" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Annual", label: "Annual" },
];

const FUND_TYPE_OPTIONS = [
  { value: "Pool", label: "Pool" },
  { value: "Equity", label: "Equity" },
  { value: "Fixed Income", label: "Fixed Income" },
  { value: "Balanced", label: "Balanced" },
  { value: "Money Market", label: "Money Market" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
];

export default function AddFundDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  apiError,
}: AddFundDrawerProps) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<FundFormValues>({
    fund: "",
    fundName: "",
    amount: "",
    accountType: "Endowment",
    priceSchedule: "Monthly",
    openDate: new Date().toISOString().slice(0, 10),
    fundType: "Pool",
    baseCurrency: "USD",
    clientFundCode: "",
    fundRefCode: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fund: initialData.fund || "",
        fundName: initialData.fundName || "",
        amount: initialData.amount ? String(initialData.amount) : "",
        accountType: initialData.accountType || "Endowment",
        priceSchedule: initialData.priceSchedule || "Monthly",
        openDate: initialData.openDate || initialData.fundOpenDate || new Date().toISOString().slice(0, 10),
        fundType: initialData.fundType || "Pool",
        baseCurrency: initialData.baseCurrency || "USD",
        clientFundCode: initialData.clientFundCode || "",
        fundRefCode: initialData.fundRefCode || "",
      });
    } else {
      setFormData({
        fund: "",
        fundName: "",
        amount: "",
        accountType: "Endowment",
        priceSchedule: "Monthly",
        openDate: new Date().toISOString().slice(0, 10),
        fundType: "Pool",
        baseCurrency: "USD",
        clientFundCode: "",
        fundRefCode: "",
      });
    }
    setValidationErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fund.trim()) errors.fund = "Fund code is required";
    if (!formData.fundName.trim()) errors.fundName = "Fund name is required";
    if (!formData.openDate) errors.openDate = "Open date is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {isEditing ? "Edit Fund" : "Add Fund"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? `Update configuration for fund ${initialData?.fund}`
                  : "Create and register a new fund portfolio"}
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
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
            {apiError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">{apiError}</span>
              </div>
            )}

            {/* Fund Code & Fund Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Fund Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fund}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fund: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. HNF01"
                  className="form-input-standard"
                  required
                />
                {validationErrors.fund && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.fund}</p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Fund Type <span className="text-rose-500">*</span>
                </label>
                <PopoverSelect
                  value={formData.fundType}
                  onChange={(val) => setFormData((prev) => ({ ...prev, fundType: val }))}
                  options={FUND_TYPE_OPTIONS}
                  placeholder="Select Fund Type"
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                Fund Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fundName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fundName: e.target.value }))
                }
                placeholder="e.g. HNF Institutions Fund"
                className="form-input-standard"
                required
              />
              {validationErrors.fundName && (
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.fundName}</p>
              )}
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Initial Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  className="form-input-standard"
                />
              </div>

              <div>
                <label className="form-label">Base Currency</label>
                <PopoverSelect
                  value={formData.baseCurrency}
                  onChange={(val) => setFormData((prev) => ({ ...prev, baseCurrency: val }))}
                  options={CURRENCY_OPTIONS}
                  placeholder="Select Currency"
                />
              </div>
            </div>

            {/* Account Type & Price Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Account Type</label>
                <PopoverSelect
                  value={formData.accountType}
                  onChange={(val) => setFormData((prev) => ({ ...prev, accountType: val }))}
                  options={ACCOUNT_TYPE_OPTIONS}
                  placeholder="Select Account Type"
                />
              </div>

              <div>
                <label className="form-label">Price Schedule</label>
                <PopoverSelect
                  value={formData.priceSchedule}
                  onChange={(val) => setFormData((prev) => ({ ...prev, priceSchedule: val }))}
                  options={PRICE_SCHEDULE_OPTIONS}
                  placeholder="Select Price Schedule"
                />
              </div>
            </div>

            {/* Open Date */}
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
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.openDate}</p>
              )}
            </div>

            {/* Client Fund Code & Ref Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Client Fund Code</label>
                <input
                  type="text"
                  value={formData.clientFundCode || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientFundCode: e.target.value }))
                  }
                  placeholder="Optional code"
                  className="form-input-standard"
                />
              </div>

              <div>
                <label className="form-label">Reference Code</label>
                <input
                  type="text"
                  value={formData.fundRefCode || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fundRefCode: e.target.value }))
                  }
                  placeholder="Optional reference"
                  className="form-input-standard"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
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
