"use client";

import React, { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import PopoverSelect, {
  PopoverSelectOption,
} from "@/components/common/PopoverSelect";
import {
  fetchTransactionCodeList,
  fetchParticipantFundBalances,
  fetchRecipientList,
} from "../api";
import {
  TransactionFormValues,
  TransactionCodeItem,
  ParticipantFundBalanceItem,
  RecipientItem,
} from "../types";
import {
  calculateTransactionUnits,
  formatAmountWithCommas,
} from "../utils/transactionUtils";
import { Info, AlertCircle } from "lucide-react";

export interface AddTransactionFormProps {
  initialValues?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  apiErrorMessage?: string | null;
}

export default function AddTransactionForm({
  initialValues,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  apiErrorMessage,
}: AddTransactionFormProps) {
  const clientID = getSelectedClient()?.clientID;

  // React TanStack Query for Dynamic Dropdowns matching API payloads
  const { data: transactionCodeList = [] } = useQuery<TransactionCodeItem[]>({
    queryKey: ["transactionCodeList", clientID],
    queryFn: () => fetchTransactionCodeList(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: participantFundBalances = [] } = useQuery<
    ParticipantFundBalanceItem[]
  >({
    queryKey: ["participantFundBalances", clientID],
    queryFn: () => fetchParticipantFundBalances(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: recipientList = [] } = useQuery<RecipientItem[]>({
    queryKey: ["recipientList", clientID],
    queryFn: () => fetchRecipientList(clientID),
    staleTime: 1000 * 60 * 5,
  });

  // Extract unique participant list
  const participantOptions = useMemo(() => {
    if (!participantFundBalances || participantFundBalances.length === 0)
      return [];
    const uniqueNames = new Set<string>();
    const list: ParticipantFundBalanceItem[] = [];
    participantFundBalances.forEach((item) => {
      if (item.participantName && !uniqueNames.has(item.participantName)) {
        uniqueNames.add(item.participantName);
        list.push(item);
      }
    });
    return list;
  }, [participantFundBalances]);

  const form = useForm({
    defaultValues: {
      participantName: initialValues?.participantName || "",
      participantID: initialValues?.participantID as number | undefined,
      fund: initialValues?.fund || "",
      fundID: initialValues?.fundID as number | undefined,
      transactionCodeDesc: initialValues?.transactionCodeDesc || "",
      transactionCode: initialValues?.transactionCode as string | undefined,
      fundPrice: initialValues?.fundPrice || "$0.00",
      transactionDate:
        initialValues?.transactionDate || new Date().toISOString().slice(0, 10),
      hasFee: initialValues?.hasFee || false,
      amount: formatAmountWithCommas(initialValues?.amount || ""),
      reEnterAmount: formatAmountWithCommas(
        initialValues?.reEnterAmount || initialValues?.amount || ""
      ),
      units: calculateTransactionUnits(
        initialValues?.amount || "",
        initialValues?.fundPrice || "0"
      ),
      balance: initialValues?.balance || "$0.00",
      notes: initialValues?.notes || "",
      feeAmount: initialValues?.feeAmount || "0",
      recipientID: initialValues?.recipientID || "",
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <form.Subscribe
      selector={(state) => [
        state.values.participantName,
        state.values.amount,
        state.values.reEnterAmount,
        state.values.transactionCodeDesc,
        state.values.hasFee,
        state.values.fundPrice,
      ]}
      children={([
        participantName,
        amount,
        reEnterAmount,
        transactionCodeDesc,
        hasFee,
        fundPriceStr,
      ]) => {
        // PDF Section 3 Validation: Participant & Amount are both required
        const strParticipant = typeof participantName === "string" ? participantName : String(participantName ?? "");
        const strAmount = typeof amount === "string" ? amount : String(amount ?? "");
        const strReEnterAmount = typeof reEnterAmount === "string" ? reEnterAmount : String(reEnterAmount ?? "");
        const strFundPrice = typeof fundPriceStr === "string" ? fundPriceStr : String(fundPriceStr ?? "");

        const isParticipantMissing = !strParticipant.trim();
        const isAmountMissing = !strAmount.trim();
        const showGuidanceBanner = isParticipantMissing || isAmountMissing;

        // PDF Section 4 & 8: Amount Confirmation Condition (ignoring formatting commas)
        const cleanAmount = strAmount.replace(/,/g, "").trim();
        const cleanReEnterAmount = strReEnterAmount.replace(/,/g, "").trim();
        const isAmountFilled = Boolean(cleanAmount && cleanReEnterAmount);
        const validateAmount =
          isAmountFilled && cleanAmount !== cleanReEnterAmount;

        // PDF Section 4: Submit button is disabled if validateAmount is true OR required fields missing
        const isSubmitDisabled =
          isLoading ||
          isParticipantMissing ||
          isAmountMissing ||
          Boolean(validateAmount);

        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isSubmitDisabled) {
                form.handleSubmit();
              }
            }}
            className="space-y-3 text-slate-700 text-xs sm:text-sm"
          >
            {/* API Error Response Banner */}
            {apiErrorMessage && (
              <div className="flex items-start gap-2.5 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs sm:text-sm text-rose-800 shadow-2xs">
                <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-semibold leading-relaxed whitespace-pre-wrap">
                  {apiErrorMessage}
                </div>
              </div>
            )}

            {/* PDF Page 3 Info/Guidance Banner: "Please Enter The Details Below" */}
            {showGuidanceBanner && (
              <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800">
                <Info size={16} className="shrink-0 text-blue-600" />
                <span className="font-medium">
                  Please Enter The Details Below
                </span>
              </div>
            )}

            {/* Amount Mismatch Validation Warning Banner Only */}
            {validateAmount && (
              <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span className="font-semibold">
                  Amount and Re-enter Amount should be same
                </span>
              </div>
            )}

            {/* 2-Column Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* LEFT COLUMN */}
              <div className="space-y-3">
                {/* Participant Dropdown */}
                <form.Field
                  name="participantName"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Participant is required" : undefined,
                  }}
                  children={(field) => {
                    const options: PopoverSelectOption[] =
                      participantOptions.length > 0
                        ? participantOptions.map((item) => ({
                            value: item.participantName,
                            label: item.participantName,
                            sublabel: item.participantNumber
                              ? `#${item.participantNumber}`
                              : undefined,
                          }))
                        : [];

                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                          Participant <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex-1 min-w-0 w-full">
                          <PopoverSelect
                            value={field.state.value}
                            options={options}
                            placeholder="Select Participant"
                            onChange={(selectedPart) => {
                              field.handleChange(selectedPart);

                              // Auto-update available funds & fund price for selected participant
                              const matchingFunds =
                                participantFundBalances.filter(
                                  (item) => item.participantName === selectedPart
                                );
                              if (matchingFunds.length > 0) {
                                if (matchingFunds[0].participantID) {
                                  form.setFieldValue("participantID", matchingFunds[0].participantID);
                                }
                                if (matchingFunds[0].fundID) {
                                  form.setFieldValue("fundID", matchingFunds[0].fundID);
                                }
                                const firstFund =
                                  matchingFunds[0].fundName ||
                                  matchingFunds[0].fund ||
                                  "";
                                form.setFieldValue("fund", firstFund);
                                const price = matchingFunds[0].fundPrice;
                                if (price !== undefined) {
                                  form.setFieldValue(
                                    "fundPrice",
                                    `$${price}`
                                  );
                                  const currentAmt = form.getFieldValue("amount");
                                  if (currentAmt) {
                                    form.setFieldValue(
                                      "units",
                                      calculateTransactionUnits(currentAmt, price)
                                    );
                                  }
                                }
                                if (matchingFunds[0].balance !== undefined) {
                                  form.setFieldValue(
                                    "balance",
                                    matchingFunds[0].balance.toLocaleString(
                                      "en-US",
                                      {
                                        style: "currency",
                                        currency: "USD",
                                      }
                                    )
                                  );
                                }
                              }
                            }}
                            onBlur={field.handleBlur}
                          />
                          {field.state.meta.errors ? (
                            <em className="text-[11px] text-rose-500 mt-0.5 block">
                              {field.state.meta.errors.join(", ")}
                            </em>
                          ) : null}
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Fund Dropdown */}
                <form.Field
                  name="fund"
                  children={(field) => {
                    const filteredFunds = participantFundBalances.filter(
                      (item) => item.participantName === participantName
                    );
                    const options: PopoverSelectOption[] =
                      filteredFunds.length > 0
                        ? filteredFunds.map((f) => ({
                            value: f.fundName || f.fund || "",
                            label: f.fundName || f.fund || "",
                            sublabel:
                              f.fund && f.fundName && f.fund !== f.fundName
                                ? f.fund
                                : undefined,
                          }))
                        : [];

                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                          Fund
                        </label>
                        <div className="flex-1 min-w-0 w-full">
                          <PopoverSelect
                            value={field.state.value}
                            options={options}
                            placeholder="Select Fund"
                            onChange={(selectedFundName) => {
                              field.handleChange(selectedFundName);

                              const matchingItem = participantFundBalances.find(
                                (item) =>
                                  item.participantName === participantName &&
                                  (item.fundName === selectedFundName ||
                                    item.fund === selectedFundName)
                              );
                              if (matchingItem) {
                                if (matchingItem.participantID) {
                                  form.setFieldValue("participantID", matchingItem.participantID);
                                }
                                if (matchingItem.fundID) {
                                  form.setFieldValue("fundID", matchingItem.fundID);
                                }
                                const price = matchingItem.fundPrice;
                                if (price !== undefined) {
                                  form.setFieldValue(
                                    "fundPrice",
                                    `$${price}`
                                  );
                                  const currentAmt = form.getFieldValue("amount");
                                  if (currentAmt) {
                                    form.setFieldValue(
                                      "units",
                                      calculateTransactionUnits(currentAmt, price)
                                    );
                                  }
                                }
                                if (matchingItem.balance !== undefined) {
                                  form.setFieldValue(
                                    "balance",
                                    matchingItem.balance.toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    })
                                  );
                                }
                              }
                            }}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Transcode Dropdown */}
                <form.Field
                  name="transactionCodeDesc"
                  children={(field) => {
                    const options: PopoverSelectOption[] =
                      transactionCodeList.length > 0
                        ? transactionCodeList.map((item) => ({
                            value: item.transactionCodeDesc || item.transactionCode,
                            label: item.transactionCodeDesc || item.transactionCode,
                            sublabel:
                              item.transactionCode &&
                              item.transactionCodeDesc !== item.transactionCode
                                ? item.transactionCode
                                : undefined,
                          }))
                        : [];

                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                        <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                          Transcode
                        </label>
                        <div className="flex-1 min-w-0 w-full">
                          <PopoverSelect
                            value={field.state.value}
                            options={options}
                            placeholder="Select Transcode"
                            onChange={(val) => {
                              field.handleChange(val);
                              const codeItem = transactionCodeList.find(
                                (item) => (item.transactionCodeDesc || item.transactionCode) === val
                              );
                              if (codeItem) {
                                form.setFieldValue("transactionCode", codeItem.transactionCode);
                              }
                            }}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      </div>
                    );
                  }}
                />

                {/* PDF Page 6 Constraint: Recipient is ONLY displayed when transactionCode has been selected */}
                {Boolean(transactionCodeDesc) && (
                  <form.Field
                    name="recipientID"
                    children={(field) => {
                      const options: PopoverSelectOption[] = recipientList.map(
                        (item) => ({
                          value: String(item.recipientID),
                          label: item.recipientName,
                        })
                      );

                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                          <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                            Recipient
                          </label>
                          <div className="flex-1 min-w-0 w-full">
                            <PopoverSelect
                              value={field.state.value || ""}
                              options={options}
                              placeholder="Select Recipient / Beneficiary"
                              onChange={(val) => field.handleChange(val)}
                              onBlur={field.handleBlur}
                            />
                          </div>
                        </div>
                      );
                    }}
                  />
                )}

                {/* Fund Price */}
                <form.Field
                  name="fundPrice"
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Fund Price
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <input
                          type="text"
                          readOnly
                          value={field.state.value}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                />

                {/* Transaction Date */}
                <form.Field
                  name="transactionDate"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Transaction Date is required" : undefined,
                  }}
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Transaction Date
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <input
                          type="date"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none"
                        />
                        {field.state.meta.errors ? (
                          <em className="text-[11px] text-rose-500 mt-0.5 block">
                            {field.state.meta.errors.join(", ")}
                          </em>
                        ) : null}
                      </div>
                    </div>
                  )}
                />

                {/* PDF Page 5: Has Fees Checkbox */}
                <form.Field
                  name="hasFee"
                  children={(field) => (
                    <div className="flex items-center gap-3 pt-1 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Has Fee
                      </label>
                      <input
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-portal-navy focus:ring-portal-navy cursor-pointer"
                      />
                    </div>
                  )}
                />
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-3">
                {/* Transaction Amount with US Comma Formatting */}
                <form.Field
                  name="amount"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Amount is required" : undefined,
                  }}
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Amount <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <input
                          type="text"
                          inputMode="decimal"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => {
                            const formattedVal = formatAmountWithCommas(e.target.value);
                            field.handleChange(formattedVal);

                            // PDF Page 4: Calculate Units (6 decimals & US commas)
                            const calculatedUnits = calculateTransactionUnits(
                              formattedVal,
                              strFundPrice
                            );
                            form.setFieldValue("units", calculatedUnits);
                          }}
                          onBlur={field.handleBlur}
                          placeholder="Transaction Amount"
                          className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none ${
                            field.state.meta.errors
                              ? "border-rose-300 bg-rose-50/20"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                        {field.state.meta.errors ? (
                          <em className="text-[11px] text-rose-500 mt-0.5 block">
                            {field.state.meta.errors.join(", ")}
                          </em>
                        ) : null}
                      </div>
                    </div>
                  )}
                />

                {/* Re-enter Amount with US Comma Formatting & Top Banner Only */}
                <form.Field
                  name="reEnterAmount"
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Re-enter Amount <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <input
                          type="text"
                          inputMode="decimal"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => {
                            const formattedVal = formatAmountWithCommas(e.target.value);
                            field.handleChange(formattedVal);
                          }}
                          onBlur={field.handleBlur}
                          placeholder="Re-enter Amount"
                          className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none ${
                            validateAmount
                              ? "border-amber-400 bg-amber-50/20 focus:border-amber-500"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                />

                {/* Units (Calculated, 6 decimal places with US Commas) */}
                <form.Field
                  name="units"
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Units
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <input
                          type="text"
                          readOnly
                          name={field.name}
                          value={field.state.value}
                          placeholder="0.000000"
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                />

                {/* Balance */}
                <form.Field
                  name="balance"
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Balance
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <input
                          type="text"
                          readOnly
                          value={field.state.value}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                />

                {/* Notes */}
                <form.Field
                  name="notes"
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0 pt-2">
                        Notes
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <textarea
                          rows={3}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Notes"
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                />

                {/* PDF Page 5: Fee Amount (Disabled unless Has Fee is checked) */}
                <form.Field
                  name="feeAmount"
                  children={(field) => (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                      <label className="font-medium text-[12px] text-slate-700 w-32 shrink-0">
                        Fee Amount
                      </label>
                      <div className="flex-1 min-w-0 w-full">
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={!hasFee}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(formatAmountWithCommas(e.target.value))}
                          onBlur={field.handleBlur}
                          placeholder="Fee Amount"
                          className={`w-full rounded-md border px-3 py-2 text-xs sm:text-sm transition-colors ${
                            hasFee
                              ? "border-slate-300 bg-white text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none"
                              : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* BOTTOM ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-md border border-portal-navy bg-white px-5 py-2 text-xs sm:text-sm font-semibold text-portal-navy hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              >
                Cancel
              </button>

              {/* PDF Page 4: disabled={validateAmount} */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`rounded-md px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all ${
                  isSubmitDisabled
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-portal-navy hover:bg-portal-navy-hover active:opacity-90"
                }`}
              >
                {isLoading
                  ? isEditing
                    ? "Updating..."
                    : "Submitting..."
                  : isEditing
                  ? "Update"
                  : "Submit"}
              </button>
            </div>
          </form>
        );
      }}
    />
  );
}
