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

export interface AddTransactionFormProps {
  initialValues?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function AddTransactionForm({
  initialValues,
  onSubmit,
  onCancel,
  isEditing = false,
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
      fund: initialValues?.fund || "",
      transactionCodeDesc: initialValues?.transactionCodeDesc || "",
      fundPrice: initialValues?.fundPrice || "$0.00",
      transactionDate:
        initialValues?.transactionDate || new Date().toISOString().slice(0, 10),
      hasFee: initialValues?.hasFee || false,
      amount: initialValues?.amount || "",
      reEnterAmount:
        initialValues?.reEnterAmount || initialValues?.amount || "",
      units: initialValues?.units || "0",
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-2 text-slate-700 text-xs sm:text-sm"
    >
      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* LEFT COLUMN */}
        <div className="space-y-2">
          {/* Participant Dropdown via Shadcn Popover */}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-medium text-[12px] text-slate-700 min-w-[120px]">
                    Participant
                  </label>
                  <div className="flex-1 w-full">
                    <PopoverSelect
                      value={field.state.value}
                      options={options}
                      placeholder="Select Participant"
                      onChange={(selectedPart) => {
                        field.handleChange(selectedPart);

                        // Auto-update available funds for selected participant
                        const matchingFunds = participantFundBalances.filter(
                          (item) => item.participantName === selectedPart,
                        );
                        if (matchingFunds.length > 0) {
                          const firstFund =
                            matchingFunds[0].fundName ||
                            matchingFunds[0].fund ||
                            "";
                          form.setFieldValue("fund", firstFund);
                          if (matchingFunds[0].fundPrice) {
                            form.setFieldValue(
                              "fundPrice",
                              `$${matchingFunds[0].fundPrice}`,
                            );
                          }
                          if (matchingFunds[0].balance !== undefined) {
                            form.setFieldValue(
                              "balance",
                              matchingFunds[0].balance.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              }),
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

          {/* Fund Dropdown via Shadcn Popover */}
          <form.Subscribe
            selector={(state) => [state.values.participantName]}
            children={([selectedParticipant]) => (
              <form.Field
                name="fund"
                children={(field) => {
                  const filteredFunds = participantFundBalances.filter(
                    (item) => item.participantName === selectedParticipant,
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-medium text-[12px] text-slate-700 min-w-[120px]">
                        Fund
                      </label>
                      <div className="flex-1 w-full">
                        <PopoverSelect
                          value={field.state.value}
                          options={options}
                          placeholder="Select Fund"
                          onChange={(selectedFundName) => {
                            field.handleChange(selectedFundName);

                            const matchingItem = participantFundBalances.find(
                              (item) =>
                                item.participantName === selectedParticipant &&
                                (item.fundName === selectedFundName ||
                                  item.fund === selectedFundName),
                            );
                            if (matchingItem) {
                              if (matchingItem.fundPrice !== undefined) {
                                form.setFieldValue(
                                  "fundPrice",
                                  `$${matchingItem.fundPrice}`,
                                );
                                const currentAmt =
                                  parseFloat(
                                    form.getFieldValue("amount") || "0",
                                  ) || 0;
                                if (currentAmt > 0 && matchingItem.fundPrice) {
                                  form.setFieldValue(
                                    "units",
                                    (
                                      currentAmt / matchingItem.fundPrice
                                    ).toFixed(6),
                                  );
                                }
                              }
                              if (matchingItem.balance !== undefined) {
                                form.setFieldValue(
                                  "balance",
                                  matchingItem.balance.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                  }),
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
            )}
          />

          {/* Transcode Dropdown via Shadcn Popover */}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                    Transcode
                  </label>
                  <div className="flex-1 w-full">
                    <PopoverSelect
                      value={field.state.value}
                      options={options}
                      placeholder="Select Transcode"
                      onChange={(val) => field.handleChange(val)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                </div>
              );
            }}
          />

          {/* Recipient Dropdown via Shadcn Popover */}
          {recipientList.length > 0 && (
            <form.Field
              name="recipientID"
              children={(field) => {
                const options: PopoverSelectOption[] = recipientList.map(
                  (item) => ({
                    value: String(item.recipientID),
                    label: item.recipientName,
                  }),
                );

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                      Recipient
                    </label>
                    <div className="flex-1 w-full">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                  Fund Price
                </label>
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    readOnly
                    value={field.state.value}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                  Transaction Date
                </label>
                <div className="flex-1 w-full">
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

          {/* Has Fee */}
          <form.Field
            name="hasFee"
            children={(field) => (
              <div className="flex items-center gap-3 pt-2">
                <label className="font-medium text-slate-700 min-w-[120px]">
                  Has Fee
                </label>
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-portal-navy focus:ring-portal-navy"
                />
              </div>
            )}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-2">
          {/* Amount */}
          <form.Field
            name="amount"
            validators={{
              onChange: ({ value }) =>
                !value ? "Amount is required" : undefined,
            }}
            children={(field) => (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                  Amount
                </label>
                <div className="flex-1 w-full">
                  <input
                    type="number"
                    step="0.01"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.handleChange(val);

                      // Calculate Units automatically if fundPrice is available
                      const priceStr = form
                        .getFieldValue("fundPrice")
                        .replace(/[^0-9.]/g, "");
                      const price = parseFloat(priceStr) || 0;
                      const numVal = parseFloat(val) || 0;
                      if (price > 0 && numVal > 0) {
                        form.setFieldValue(
                          "units",
                          (numVal / price).toFixed(6),
                        );
                      }
                    }}
                    onBlur={field.handleBlur}
                    placeholder="Amount"
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

          {/* Re-enter Amount */}
          <form.Field
            name="reEnterAmount"
            validators={{
              onChangeListenTo: ["amount"],
              onChange: ({ value, fieldApi }) => {
                const amountVal = fieldApi.form.getFieldValue("amount");
                if (value && amountVal && value !== amountVal) {
                  return "Amounts do not match";
                }
                return undefined;
              },
            }}
            children={(field) => (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                  Re-enter Amount
                </label>
                <div className="flex-1 w-full">
                  <input
                    type="number"
                    step="0.01"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Re-enter Amount"
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

          {/* Units */}
          <form.Field
            name="units"
            children={(field) => (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                  Units
                </label>
                <div className="flex-1 w-full">
                  <input
                    type="number"
                    step="0.000001"
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="0"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none"
                  />
                </div>
              </div>
            )}
          />

          {/* Balance */}
          <form.Field
            name="balance"
            children={(field) => (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-medium text-slate-700 min-w-[120px]">
                  Balance
                </label>
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    readOnly
                    value={field.state.value}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700"
                  />
                </div>
              </div>
            )}
          />

          {/* Notes */}
          <form.Field
            name="notes"
            children={(field) => (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <label className="font-medium  text-[12px] text-slate-700 min-w-[120px] pt-2">
                  Notes
                </label>
                <div className="flex-1 w-full">
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

          {/* Fee Amount */}
          <form.Subscribe
            selector={(state) => [state.values.hasFee]}
            children={([hasFee]) => (
              <form.Field
                name="feeAmount"
                children={(field) => (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-medium  text-[12px] text-slate-700 min-w-[120px]">
                      Fee Amount
                    </label>
                    <div className="flex-1 w-full">
                      <input
                        type="number"
                        step="0.01"
                        disabled={!hasFee}
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Fee Amount"
                        className={`w-full rounded-md border px-2 py-2 text-xs sm:text-[12px] transition-colors ${
                          hasFee
                            ? "border-slate-300 bg-white text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none"
                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      />
                    </div>
                  </div>
                )}
              />
            )}
          />
        </div>
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-portal-navy bg-white px-5 py-2 text-xs sm:text-sm font-semibold text-portal-navy hover:bg-slate-50 transition-colors shadow-2xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-portal-navy px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-portal-navy-hover transition-colors"
        >
          {isEditing ? "Update" : "Submit"}
        </button>
      </div>
    </form>
  );
}
