"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import PopoverSelect, {
  PopoverSelectOption,
} from "@/components/common/PopoverSelect";
import {
  fetchAllocTypes,
  fetchFunds,
  fetchTransactionCodesToAllocate,
  fetchAllocLastFundPriceDate,
  submitSaveAllocation,
  formatDateToMMDDYYYY,
} from "./api";
import {
  AllocTypeItem,
  FundItem,
  TransactionCodeToAllocateItem,
} from "./types";
import { formatAmountWithCommas } from "../transactions/utils/transactionUtils";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function AllocationsPage() {
  const [client, setClient] = useState<Client | null>(null);

  // Dynamic Form Field States initialized strictly from API responses
  const [selectedAllocType, setSelectedAllocType] = useState<string>("");
  const [selectedFundId, setSelectedFundId] = useState<string>("");
  const [lastFundPriceDate, setLastFundPriceDate] = useState<string>("");
  const [allocDate, setAllocDate] = useState<string>("");

  // Allocation Amounts state: map of transactionCode -> amount string
  const [allocAmounts, setAllocAmounts] = useState<Record<string, string>>({});

  // Feedback banner state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  const clientID = client?.clientID;

  // 1. Fetch Alloc Types from API
  const { data: allocTypes = [], isLoading: isLoadingAllocTypes } = useQuery<
    AllocTypeItem[]
  >({
    queryKey: ["allocTypes", clientID],
    queryFn: () => fetchAllocTypes(clientID),
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch Funds List from API
  const { data: funds = [], isLoading: isLoadingFunds } = useQuery<FundItem[]>({
    queryKey: ["funds", clientID],
    queryFn: () => fetchFunds(clientID),
    staleTime: 1000 * 60 * 5,
  });

  // 3. Fetch Transaction Codes To Allocate from API
  const { data: transactionCodes = [], isLoading: isLoadingCodes } = useQuery<
    TransactionCodeToAllocateItem[]
  >({
    queryKey: ["transactionCodesToAllocate", clientID],
    queryFn: () => fetchTransactionCodesToAllocate(clientID),
    staleTime: 1000 * 60 * 5,
  });

  // Set default selection for AllocType from API response
  useEffect(() => {
    if (allocTypes.length > 0 && !selectedAllocType) {
      const match =
        allocTypes.find((a) => a.allocType === "Semi Trial Data") ||
        allocTypes[0];
      const val =
        match.allocType ||
        match.allocTypeDesc ||
        String(match.allocTypeID ?? "");
      setSelectedAllocType(val);
    }
  }, [allocTypes, selectedAllocType]);

  // Set default selection for Fund from API response
  useEffect(() => {
    if (funds.length > 0 && !selectedFundId) {
      const firstId = String(funds[0].fundID ?? funds[0].fund ?? "");
      setSelectedFundId(firstId);
    }
  }, [funds, selectedFundId]);

  // 4. Fetch Last Fund Price Date and Next Alloc Date whenever selectedFundId changes
  useEffect(() => {
    if (!selectedFundId) return;
    let isMounted = true;
    fetchAllocLastFundPriceDate(selectedFundId, clientID).then((res) => {
      if (isMounted && res) {
        setLastFundPriceDate(formatDateToMMDDYYYY(res.lastFundPriceDate));
        setAllocDate(formatDateToMMDDYYYY(res.nextAllocDate));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedFundId, clientID]);

  // Transform Alloc Types into dropdown options showing allocType
  const allocTypeOptions: PopoverSelectOption[] = useMemo(() => {
    return allocTypes.map((item) => {
      const val =
        item.allocType || item.allocTypeDesc || String(item.allocTypeID ?? "");
      return {
        value: val,
        label: val,
        sublabel:
          item.allocTypeDesc && item.allocTypeDesc !== val
            ? item.allocTypeDesc
            : undefined,
      };
    });
  }, [allocTypes]);

  // Transform Funds into dropdown options showing "fund - fundName"
  const fundOptions: PopoverSelectOption[] = useMemo(() => {
    return funds.map((item) => {
      const id = String(item.fundID ?? item.fund ?? "");
      const code = item.fund || item.code || "";
      const name = item.fundName || item.name || "";
      const label = code && name ? `${code} - ${name}` : name || code || id;
      return {
        value: id,
        label: label,
      };
    });
  }, [funds]);

  // Table Visibility Condition (Section 4 & 15 of spec doc):
  // Shown ONLY IF selectedAllocType is set, selectedAllocType !== "Trial Data", and fund is selected
  const showAllocationTable =
    Boolean(selectedAllocType) &&
    selectedAllocType !== "Trial Data" &&
    Boolean(selectedFundId);

  // Initialize Alloc Amounts based on Alloc Type (Section 5, 6, 15):
  // - "Semi Trial Data": Pre-fill amount using amountToAlloacate formatted with currencyFormat (2 decimals & commas)
  // - "Manual" / Other Alloc Types: Amount inputs are empty ("") so user enters manually
  useEffect(() => {
    if (transactionCodes.length > 0) {
      const newAmounts: Record<string, string> = {};
      transactionCodes.forEach((item) => {
        const key =
          item.transactionCode ||
          String(
            item.transactionCodeID ?? item.id ?? item.transactionCodeDesc
          );
        if (key) {
          if (selectedAllocType === "Semi Trial Data") {
            const rawAmt =
              item.amountToAlloacate ??
              item.amountToAllocate ??
              item.amount ??
              0;
            newAmounts[key] = formatAmountWithCommas(String(rawAmt));
          } else {
            // When Alloc Type is Manual or non-Semi-Trial, amount inputs are empty
            newAmounts[key] = "";
          }
        }
      });
      setAllocAmounts(newAmounts);
    }
  }, [transactionCodes, selectedAllocType]);

  // Handle amount input change with 2 decimal places restriction (Section 7)
  const handleAmountChange = (key: string, rawVal: string) => {
    let cleanVal = rawVal.replace(/[^0-9.,]/g, "");
    if (cleanVal.includes(".")) {
      const parts = cleanVal.split(".");
      cleanVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    setAllocAmounts((prev) => ({
      ...prev,
      [key]: cleanVal,
    }));
  };

  // OnBlur formatting with currencyFormat for regular inputs (Section 7)
  const handleAmountBlur = (key: string) => {
    const val = allocAmounts[key];
    if (val && val.trim() !== "") {
      const formatted = formatAmountWithCommas(val);
      setAllocAmounts((prev) => ({
        ...prev,
        [key]: formatted,
      }));
    }
  };

  // Form Submit Handler (Section 12, 13, 14):
  // Loops through rows, builds allocateString "code:amount,code:amount", and calls addAllocations API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const pairs: string[] = [];
    transactionCodes.forEach((item) => {
      const key =
        item.transactionCode ||
        String(item.transactionCodeID ?? item.id ?? item.transactionCodeDesc);
      const code = item.transactionCode || item.transactionCodeDesc || key;
      const amtStr = (allocAmounts[key] || "0").replace(/,/g, "");
      const numAmt = parseFloat(amtStr);
      const formattedAmt = isNaN(numAmt) ? "0.00" : numAmt.toFixed(2);
      pairs.push(`${code}:${formattedAmt}`);
    });

    const allocateString = pairs.join(",");

    const payload = {
      sessionID: "test",
      date: allocDate,
      allocateString,
      allocType: selectedAllocType,
      fundId: selectedFundId,
    };

    const res = await submitSaveAllocation(payload, clientID);

    setIsSubmitting(false);
    if (res.ok) {
      setFeedback({
        type: "success",
        message: "Allocations submitted successfully!",
      });
    } else {
      setFeedback({
        type: "error",
        message: res.message || "Allocations updated locally.",
      });
    }
  };

  const handleCancel = () => {
    setFeedback(null);
    if (allocTypes.length > 0) {
      const match =
        allocTypes.find((a) => a.allocType === "Semi Trial Data") ||
        allocTypes[0];
      const defaultType =
        match.allocType ||
        match.allocTypeDesc ||
        String(match.allocTypeID ?? "");
      setSelectedAllocType(defaultType);
    }
    if (funds.length > 0) {
      setSelectedFundId(String(funds[0].fundID ?? funds[0].fund ?? ""));
    }
    if (transactionCodes.length > 0) {
      const resetMap: Record<string, string> = {};
      transactionCodes.forEach((item) => {
        const key =
          item.transactionCode ||
          String(
            item.transactionCodeID ?? item.id ?? item.transactionCodeDesc
          );
        if (key) {
          if (selectedAllocType === "Semi Trial Data") {
            const rawAmt =
              item.amountToAlloacate ?? item.amountToAllocate ?? item.amount ?? 0;
            resetMap[key] = formatAmountWithCommas(String(rawAmt));
          } else {
            resetMap[key] = "";
          }
        }
      });
      setAllocAmounts(resetMap);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] w-full overflow-hidden  bg-white  ">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col h-full justify-between overflow-hidden"
      >
        {/* Top Feedback Banner */}
        {feedback && (
          <div
            className={`shrink-0 mb-3 flex items-center gap-2.5 rounded-lg p-2.5 text-xs sm:text-sm font-semibold border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-amber-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Fields Section: 2 fields each row */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-w-4xl text-xs sm:text-sm">
          {/* Row 1 - Field 1: Alloc Type */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-semibold text-slate-700 w-36 shrink-0">
              Alloc Type
            </label>
            <div className="w-full flex-1">
              <PopoverSelect
                value={selectedAllocType}
                options={allocTypeOptions}
                placeholder={
                  isLoadingAllocTypes ? "Loading..." : "Select Alloc Type"
                }
                onChange={(val) => setSelectedAllocType(val)}
                disabled={isLoadingAllocTypes}
                className="h-9 border-slate-300"
              />
            </div>
          </div>

          {/* Row 1 - Field 2: Fund */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-semibold text-slate-700 w-36 shrink-0">
              Fund
            </label>
            <div className="w-full flex-1">
              <PopoverSelect
                value={selectedFundId}
                options={fundOptions}
                placeholder={isLoadingFunds ? "Loading..." : "Select Fund"}
                onChange={(val) => setSelectedFundId(val)}
                disabled={isLoadingFunds}
                className="h-9 border-slate-300"
              />
            </div>
          </div>

          {/* Row 2 - Field 1: Last Fund Price Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-semibold text-slate-700 w-36 shrink-0">
              Last Fund Price Date
            </label>
            <div className="w-full flex-1">
              <input
                type="text"
                readOnly
                value={lastFundPriceDate}
                placeholder="MM/DD/YYYY"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2 - Field 2: Alloc Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="font-semibold text-slate-700 w-36 shrink-0">
              Alloc Date
            </label>
            <div className="w-full flex-1">
              <input
                type="text"
                value={allocDate}
                onChange={(e) => setAllocDate(e.target.value)}
                placeholder="MM/DD/YYYY"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Transaction Code & Alloc Amount Section: Conditioned on showAllocationTable (Section 4 & 15) */}
        {showAllocationTable ? (
          <div className="flex-1 min-h-0 flex flex-col mt-3 max-w-4xl overflow-hidden">
            {/* Single Header Label Above Table (One Time) */}
            <div className="shrink-0 font-bold text-xs sm:text-sm text-slate-900 px-1 pb-1.5">
              Transaction Code & Alloc Amount
            </div>

            {/* Table Container (Expands dynamically to screen height) */}
            <div className="flex-1 min-h-0 bg-white shadow-2xs overflow-hidden flex flex-col">
              {/* Scrollable Body: 2 transaction items per row */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                {isLoadingCodes ? (
                  <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw
                      size={16}
                      className="animate-spin text-portal-navy"
                    />
                    Loading transaction codes...
                  </div>
                ) : transactionCodes.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No transaction codes found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs sm:text-sm">
                    {transactionCodes.map((item, idx) => {
                      const key =
                        item.transactionCode ||
                        String(
                          item.transactionCodeID ??
                            item.id ??
                            item.transactionCodeDesc,
                        );
                      const codeDesc =
                        item.transactionCodeDesc || item.transactionCode || "";
                      const amtValue = allocAmounts[key] ?? "";

                      return (
                        <div
                          key={key || idx}
                          className="flex items-center justify-between gap-5 rounded-md hover:bg-slate-50 transition-colors bg-white"
                        >
                          {/* Transaction Code */}
                          <div className="font-semibold text-slate-700 truncate min-w-0 flex-1">
                            {codeDesc}
                          </div>
                          {/* Alloc Amount Input */}
                          <div className="shrink-0 w-36">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={amtValue}
                              onChange={(e) =>
                                handleAmountChange(key, e.target.value)
                              }
                              onBlur={() => handleAmountBlur(key)}
                              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-normal text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none transition-colors"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center mt-3 max-w-4xl rounded-lg border border-slate-200 bg-slate-50/50 p-6 text-center text-xs sm:text-sm text-slate-500 font-medium">
            {selectedAllocType === "Trial Data"
              ? 'Allocation table is hidden for "Trial Data" allocation type.'
              : "Please select a Fund to display the allocation table."}
          </div>
        )}

        {/* Bottom Action Buttons: Pinned at bottom of screen */}
        <div className="shrink-0 flex items-center gap-4 pt-3 mt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#051a39] px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#051a36]/80 active:opacity-90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs sm:text-sm font-medium text-[#051a39] hover:text-[#051a39]/80 hover:underline transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
