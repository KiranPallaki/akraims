"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeftRight,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { RebalanceParticipantItem, TransferPayload } from "../types";
import { submitFundTransfer } from "../api";
import { formatLargeCurr, currencyFormat } from "../formatters";

interface FundTransferTabProps {
  data: RebalanceParticipantItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onShowMessage: (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => void;
}

export default function FundTransferTab({
  data,
  isLoading,
  onRefresh,
  onShowMessage,
}: FundTransferTabProps) {
  // Extract distinct participants
  const participants = useMemo(() => {
    const map = new Map<number, string>();
    data.forEach((item) => {
      if (!map.has(item.participantID)) {
        map.set(item.participantID, item.participantName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const [selectedParticipantID, setSelectedParticipantID] = useState<number>(0);

  useEffect(() => {
    if (participants.length > 0) {
      if (
        !selectedParticipantID ||
        !participants.some((p) => p.id === selectedParticipantID)
      ) {
        const preferred =
          participants.find((p) =>
            p.name.toLowerCase().includes("ak retirement"),
          ) ?? participants[0];
        setSelectedParticipantID(preferred.id);
      }
    }
  }, [participants, selectedParticipantID]);

  // Funds scoped to selected participant
  const participantFunds = useMemo(() => {
    return data.filter((d) => d.participantID === selectedParticipantID);
  }, [data, selectedParticipantID]);

  // Participant total balance calculation
  const participantTotalBalance = useMemo(() => {
    if (participantFunds.length === 0) return 0;
    const firstWithVal = participantFunds.find(
      (f) => f.participantMarketValue && f.participantMarketValue > 0,
    );
    if (firstWithVal?.participantMarketValue) {
      return firstWithVal.participantMarketValue;
    }
    return participantFunds.reduce((sum, f) => sum + (f.marketValue || 0), 0);
  }, [participantFunds]);

  // Source and Destination fund selections
  const [sourceFundID, setSourceFundID] = useState<number>(0);
  const [destFundID, setDestFundID] = useState<number>(0);

  // Sync default fund selections when participant or connected funds change
  useEffect(() => {
    if (participantFunds.length >= 2) {
      const fromFund = participantFunds[0].fundID;
      const toFund = participantFunds[1].fundID;
      setSourceFundID(fromFund);
      setDestFundID(toFund);
    } else if (participantFunds.length === 1) {
      setSourceFundID(participantFunds[0].fundID);
      setDestFundID(0);
    } else {
      setSourceFundID(0);
      setDestFundID(0);
    }
  }, [participantFunds]);

  // Destination fund options strictly exclude the chosen Source Fund
  const destinationFundOptions = useMemo(() => {
    return participantFunds.filter((f) => f.fundID !== sourceFundID);
  }, [participantFunds, sourceFundID]);

  // Ensure destFundID stays valid when sourceFundID changes
  useEffect(() => {
    if (destinationFundOptions.length > 0) {
      if (!destinationFundOptions.some((f) => f.fundID === destFundID)) {
        setDestFundID(destinationFundOptions[0].fundID);
      }
    } else {
      setDestFundID(0);
    }
  }, [destinationFundOptions, destFundID]);

  // Form Fields
  const [transferType, setTransferType] = useState<"amount" | "percent">(
    "amount",
  );
  const [amountValue, setAmountValue] = useState<string>("");
  const [percentValue, setPercentValue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Source and Destination row objects
  const sourceRow = useMemo(() => {
    return participantFunds.find((f) => f.fundID === sourceFundID);
  }, [participantFunds, sourceFundID]);

  const destRow = useMemo(() => {
    return participantFunds.find((f) => f.fundID === destFundID);
  }, [participantFunds, destFundID]);

  const sourceBalance = sourceRow?.marketValue ?? 0;
  const destBalance = destRow?.marketValue ?? 0;

  // Computed Transfer Amount
  const computedAmount = useMemo(() => {
    if (transferType === "amount") {
      const val = parseFloat(amountValue);
      return isNaN(val) ? 0 : Math.max(0, val);
    } else {
      const pct = parseFloat(percentValue);
      if (isNaN(pct) || pct <= 0) return 0;
      return Math.round(sourceBalance * (pct / 100) * 100) / 100;
    }
  }, [transferType, amountValue, percentValue, sourceBalance]);

  // Quick percentage selection
  const handleQuickPercent = (pct: number) => {
    if (transferType === "percent") {
      setPercentValue(String(pct));
    } else {
      const calculated = Math.round(sourceBalance * (pct / 100) * 100) / 100;
      setAmountValue(String(calculated));
    }
  };

  // Validation
  const validationError = useMemo(() => {
    if (!selectedParticipantID) return "Please select a participant.";
    if (!sourceFundID) return "Please select a source fund.";
    if (!destFundID) return "Please select a destination fund.";
    if (sourceFundID === destFundID)
      return "Source and destination funds must be distinct.";
    if (computedAmount <= 0)
      return "Please specify a positive transfer amount.";
    if (computedAmount > sourceBalance) {
      return `Transfer amount ($${computedAmount.toLocaleString()}) exceeds source fund available balance ($${sourceBalance.toLocaleString()}).`;
    }
    return null;
  }, [
    selectedParticipantID,
    sourceFundID,
    destFundID,
    computedAmount,
    sourceBalance,
  ]);

  const isValid = validationError === null;

  // Impact Preview
  const sourceAfterBalance = sourceBalance - computedAmount;
  const destAfterBalance = destBalance + computedAmount;

  // Submit Handler
  const handleExecuteTransfer = async () => {
    if (!isValid || !sourceRow || !destRow) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);

    // Step 1: Paired payload creation
    const fromPayload: TransferPayload = {
      fundID: sourceRow.fundID,
      participantID: sourceRow.participantID,
      notes: notes.trim() || `Transfer to ${destRow.fundName}`,
      transactionAmount: -Math.abs(computedAmount),
      transactionCode: "TO",
      transactionDate,
    };

    const toPayload: TransferPayload = {
      fundID: destRow.fundID,
      participantID: destRow.participantID,
      notes: notes.trim() || `Transfer from ${sourceRow.fundName}`,
      transactionAmount: Math.abs(computedAmount),
      transactionCode: "TI",
      transactionDate,
    };

    const result = await submitFundTransfer(fromPayload, toPayload);
    setIsSubmitting(false);

    if (result.ok) {
      onShowMessage("success", result.message);
      setAmountValue("");
      setPercentValue("");
      setNotes("");
      onRefresh();
    } else {
      onShowMessage("error", result.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Participant Selector Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="form-label mb-0 whitespace-nowrap font-semibold text-slate-700">
              Participant:
            </label>
            <select
              value={selectedParticipantID}
              onChange={(e) => setSelectedParticipantID(Number(e.target.value))}
              className="form-input-standard sm:w-80 font-medium"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Balance:
              </span>
              <span className="text-base font-extrabold text-portal-navy">
                {formatLargeCurr({ value: participantTotalBalance })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Connected Funds:
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {participantFunds.length} Funds
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Form */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ArrowLeftRight size={17} className="text-portal-navy" />
                Transfer Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Configure transfer source, destination, and amount
              </p>
            </div>

            {/* Transfer Mode Toggle ($ vs %) */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setTransferType("amount")}
                className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  transferType === "amount"
                    ? "bg-portal-navy text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <DollarSign size={13} /> Amount ($)
              </button>
              <button
                type="button"
                onClick={() => setTransferType("percent")}
                className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  transferType === "percent"
                    ? "bg-portal-navy text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Percent size={13} /> Percentage (%)
              </button>
            </div>
          </div>

          {/* Form Rows */}
          <div className="space-y-4">
            {/* Source Fund (From) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0 font-semibold text-slate-700">
                  Source Fund (Transfer From)
                </label>
                {sourceRow && (
                  <span className="text-xs text-slate-500 font-medium">
                    Available:{" "}
                    <strong className="text-slate-800">
                      ${currencyFormat(sourceBalance)}
                    </strong>
                  </span>
                )}
              </div>
              <select
                value={sourceFundID}
                onChange={(e) => {
                  setSourceFundID(Number(e.target.value));
                }}
                className="form-input-standard font-medium"
              >
                {participantFunds.map((fund) => (
                  <option key={fund.fundID} value={fund.fundID}>
                    {fund.fundName}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Fund (To) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0 font-semibold text-slate-700">
                  Destination Fund (Transfer To)
                </label>
                {destRow && (
                  <span className="text-xs text-slate-500 font-medium">
                    Current:{" "}
                    <strong className="text-slate-800">
                      ${currencyFormat(destBalance)}
                    </strong>
                  </span>
                )}
              </div>
              <select
                value={destFundID}
                onChange={(e) => setDestFundID(Number(e.target.value))}
                className="form-input-standard font-medium"
                disabled={destinationFundOptions.length === 0}
              >
                {destinationFundOptions.length === 0 ? (
                  <option value={0}>No remaining funds available</option>
                ) : (
                  destinationFundOptions.map((fund) => (
                    <option key={fund.fundID} value={fund.fundID}>
                      {fund.fundName}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Transfer Amount Input & Quick Buttons */}
            <div>
              <label className="form-label font-semibold text-slate-700">
                {transferType === "amount"
                  ? "Transfer Amount ($)"
                  : "Transfer Percentage (%)"}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-semibold text-xs">
                  {transferType === "amount" ? "$" : "%"}
                </div>
                <input
                  type="number"
                  step={transferType === "amount" ? "0.01" : "0.5"}
                  min="0"
                  max={transferType === "percent" ? 100 : sourceBalance}
                  value={transferType === "amount" ? amountValue : percentValue}
                  onChange={(e) => {
                    if (transferType === "amount") {
                      setAmountValue(e.target.value);
                    } else {
                      setPercentValue(e.target.value);
                    }
                  }}
                  placeholder={transferType === "amount" ? "0.00" : "0 to 100"}
                  className="form-input-standard pl-9 text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Quick Percentage Chips */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Quick Select:
                </span>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {pct === 100 ? "MAX (100%)" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label font-semibold text-slate-700">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="form-input-standard text-xs"
                />
              </div>

              <div>
                <label className="form-label font-semibold text-slate-700">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual allocation rebalance"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input-standard text-xs resize-y"
                />
              </div>
            </div>

            {/* Error Message Alert */}
            {validationError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAmountValue("");
                  setPercentValue("");
                  setNotes("");
                }}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isValid || isSubmitting}
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-1.5 rounded-md bg-portal-navy px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
                {isSubmitting ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Impact & Verification Preview */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-600" />
              Transfer Impact Preview
            </h3>
            <p className="text-xs text-slate-500">
              Live preview of before and after fund balances
            </p>
          </div>

          {/* Amount Hero Callout */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Calculated Transfer Amount
            </span>
            <div className="text-2xl font-black text-portal-navy mt-1">
              ${currencyFormat(computedAmount)}
            </div>
            {transferType === "percent" && (
              <span className="text-xs text-slate-500 font-medium">
                ({percentValue || 0}% of {sourceRow?.fundName || "source fund"})
              </span>
            )}
          </div>

          {/* Before & After Cards */}
          <div className="space-y-3">
            {/* Source Fund Impact */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                  {sourceRow?.fundName || "Source Fund"}
                </span>
                <span className="rounded bg-red-50 text-red-700 px-1.5 py-0.5 text-[10px] font-bold">
                  Code: TO (-Out)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <div className="text-slate-500">
                  Current:{" "}
                  <strong className="text-slate-700">
                    ${currencyFormat(sourceBalance)}
                  </strong>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
                <div className="text-red-700 font-semibold">
                  After:{" "}
                  <strong>
                    ${currencyFormat(Math.max(0, sourceAfterBalance))}
                  </strong>
                </div>
              </div>
            </div>

            {/* Destination Fund Impact */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                  {destRow?.fundName || "Destination Fund"}
                </span>
                <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold">
                  Code: TI (+In)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <div className="text-slate-500">
                  Current:{" "}
                  <strong className="text-slate-700">
                    ${currencyFormat(destBalance)}
                  </strong>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
                <div className="text-emerald-700 font-semibold">
                  After: <strong>${currencyFormat(destAfterBalance)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Checklist */}
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Safety Verification
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={13}
                className={
                  sourceFundID && destFundID && sourceFundID !== destFundID
                    ? "text-emerald-600"
                    : "text-slate-300"
                }
              />
              <span className="text-slate-600">
                Distinct source & destination funds
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={13}
                className={
                  computedAmount > 0 ? "text-emerald-600" : "text-slate-300"
                }
              />
              <span className="text-slate-600">Positive transfer amount</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={13}
                className={
                  computedAmount <= sourceBalance && computedAmount > 0
                    ? "text-emerald-600"
                    : "text-slate-300"
                }
              />
              <span className="text-slate-600">
                Sufficient source fund liquidity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && sourceRow && destRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-portal-navy/10 text-portal-navy">
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Confirm Fund Transfer
                </h3>
                <p className="text-xs text-slate-500">
                  Review paired transactions before posting
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Participant:</span>
                <span className="font-semibold text-slate-800">
                  {sourceRow.participantName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">From Fund:</span>
                <span className="font-semibold text-slate-800">
                  {sourceRow.fundName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">To Fund:</span>
                <span className="font-semibold text-slate-800">
                  {destRow.fundName}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">Transfer Amount:</span>
                <span className="text-portal-navy text-sm font-bold">
                  ${currencyFormat(computedAmount)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              This action will sequentially record two transactions: a Transfer
              Out (&quot;TO&quot;) on {sourceRow.fundName} and a Transfer In
              (&quot;TI&quot;) on {destRow.fundName}.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteTransfer}
                className="flex items-center gap-1.5 rounded-lg bg-portal-navy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Executing..." : "Confirm & Execute"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
