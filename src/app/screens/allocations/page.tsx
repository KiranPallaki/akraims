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
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parse, isValid } from "date-fns";

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

const getCategoryForCode = (
  code: string,
  desc: string,
): "Income" | "Expenses" | "Gain/Loss" | "Other" => {
  const c = (code || "").toUpperCase();
  const d = (desc || "").toLowerCase();

  if (
    c === "AI" ||
    c === "DI" ||
    c === "DIQ" ||
    c === "ID" ||
    c === "II" ||
    c === "OI" ||
    c === "WDFI" ||
    d.includes("income") ||
    d.includes("dividend")
  ) {
    return "Income";
  }

  if (
    c === "AE" ||
    c === "EXP" ||
    c === "IE" ||
    c === "OE" ||
    d.includes("expense") ||
    d.includes("audit")
  ) {
    return "Expenses";
  }

  if (
    c === "CGD" ||
    c === "LG" ||
    c === "RG" ||
    c === "SG" ||
    c === "URG" ||
    d.includes("gain") ||
    d.includes("loss")
  ) {
    return "Gain/Loss";
  }

  return "Other";
};

export default function AllocationsPage() {
  const [client, setClient] = useState<Client | null>(null);

  // Dynamic Form Field States initialized strictly from API responses
  const [selectedAllocType, setSelectedAllocType] = useState<string>("");
  const [selectedFundId, setSelectedFundId] = useState<string>("");
  const [lastFundPriceDate, setLastFundPriceDate] = useState<string>("");
  const [allocDate, setAllocDate] = useState<string>("");

  // Popover calendar visibility states
  const [isLastPriceCalendarOpen, setIsLastPriceCalendarOpen] = useState(false);
  const [isAllocDateCalendarOpen, setIsAllocDateCalendarOpen] = useState(false);

  // Allocation Amounts state: map of transactionCode -> amount string
  const [allocAmounts, setAllocAmounts] = useState<Record<string, string>>({});

  // Feedback banner state (always constant display)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: "success" | "error";
    message: string | undefined;
  } | null>(null);

  const handleAllocTypeChange = (val: string) => {
    setSelectedAllocType(val);
    setSubmitFeedback(null);
  };

  const handleFundChange = (val: string) => {
    setSelectedFundId(val);
    setSubmitFeedback(null);
  };

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

  // Derived active feedback message for constant display
  const activeFeedback = useMemo(() => {
    // 1. After submit state: show API response message
    if (submitFeedback) {
      return submitFeedback;
    }

    // 2. Initial state: when allocation type or fund is missing
    if (!selectedAllocType || !selectedFundId) {
      return {
        type: "info" as const,
        message: "select allocation type and fund type",
      };
    }

    // 3. After selection state: show what the user selected
    const selectedFundOption = fundOptions.find(
      (opt) => opt.value === selectedFundId,
    );
    const fundLabel = selectedFundOption
      ? selectedFundOption.label
      : selectedFundId;

    return {
      type: "info" as const,
      message: ` ${selectedAllocType}- ${fundLabel}`,
    };
  }, [submitFeedback, selectedAllocType, selectedFundId, fundOptions]);

  // Group transaction codes into Income, Expenses, Gain/Loss, and Other
  const groupedTransactionCodes = useMemo(() => {
    const groups: Record<
      "Income" | "Expenses" | "Gain/Loss" | "Other",
      TransactionCodeToAllocateItem[]
    > = {
      Income: [],
      Expenses: [],
      "Gain/Loss": [],
      Other: [],
    };

    transactionCodes.forEach((item) => {
      const code = item.transactionCode || "";
      const desc = item.transactionCodeDesc || code;
      const category = getCategoryForCode(code, desc);
      groups[category].push(item);
    });

    return groups;
  }, [transactionCodes]);

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
          String(item.transactionCodeID ?? item.id ?? item.transactionCodeDesc);
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
    setSubmitFeedback(null);

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
      setSubmitFeedback({
        type: "success",
        message: res.message,
      });
    } else {
      setSubmitFeedback({
        type: "error",
        message: res.message,
      });
    }
  };

  const handleCancel = () => {
    setSubmitFeedback(null);
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
          String(item.transactionCodeID ?? item.id ?? item.transactionCodeDesc);
        if (key) {
          if (selectedAllocType === "Semi Trial Data") {
            const rawAmt =
              item.amountToAlloacate ??
              item.amountToAllocate ??
              item.amount ??
              0;
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
    <div className="h-[calc(100vh-6rem)] w-full overflow-hidden bg-white">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col h-full justify-between overflow-hidden w-full"
      >
        {/* Top Constant Feedback Banner */}
        <div
          className={`shrink-0 mb-3 flex items-center gap-2.5 rounded-lg p-2.5 text-12px sm:text-[12px] border transition-colors ${
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

        {/* Allocation Details Card */}
        <div className="shrink-0 w-full max-w-full bg-white border border-slate-200 rounded-xl overflow-hidden p-3 shadow-xs">
          {/* Form Fields Grid: 20% Allocation Type, 40% Fund, 20% Last Fund Price Date, 20% Allocation Date */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
            {/* Field 1: Alloc Type (20%) */}
            <div className="md:col-span-3 flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-slate-700 truncate">
                Allocation Type
              </label>
              <div className="w-full min-w-0">
                <PopoverSelect
                  value={selectedAllocType}
                  options={allocTypeOptions}
                  placeholder={
                    isLoadingAllocTypes ? "Loading..." : "Select Alloc Type"
                  }
                  onChange={(val) => handleAllocTypeChange(val)}
                  disabled={isLoadingAllocTypes}
                  className="h-7 w-full border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Field 2: Fund (40%) */}
            <div className="md:col-span-4 flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-slate-700 truncate">
                Fund
              </label>
              <div className="w-full min-w-0">
                <PopoverSelect
                  value={selectedFundId}
                  options={fundOptions}
                  placeholder={isLoadingFunds ? "Loading..." : "Select Fund"}
                  onChange={(val) => handleFundChange(val)}
                  disabled={isLoadingFunds}
                  className="h-7 w-full border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Field 3: Last Fund Price Date (20%) */}
            <div className="md:col-span-3 flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-slate-700 truncate">
                Last Fund Price Date
              </label>
              <div className="w-full min-w-0">
                <Popover
                  open={isLastPriceCalendarOpen}
                  onOpenChange={setIsLastPriceCalendarOpen}
                >
                  <div className="relative flex items-center w-full">
                    <input
                      type="text"
                      readOnly
                      value={lastFundPriceDate}
                      placeholder="MM/DD/YYYY"
                      onClick={() => setIsLastPriceCalendarOpen(true)}
                      className="w-full h-7 rounded-lg border border-slate-200 bg-slate-50/80 pl-3 pr-8 text-xs text-slate-600 focus:outline-none cursor-pointer"
                    />
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center p-0.5"
                        title="Open calendar"
                      >
                        <CalendarIcon size={14} />
                      </button>
                    </PopoverTrigger>
                  </div>
                  <PopoverContent
                    className="w-auto p-0 border border-slate-200 shadow-md bg-white"
                    align="end"
                  >
                    <Calendar
                      mode="single"
                      selected={parseDateString(lastFundPriceDate)}
                      defaultMonth={
                        parseDateString(lastFundPriceDate) || new Date()
                      }
                      onSelect={(date) => {
                        if (date) {
                          setLastFundPriceDate(formatDateString(date));
                          setIsLastPriceCalendarOpen(false);
                        }
                      }}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Field 4: Alloc Date (20%) */}
            <div className="md:col-span-2 flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-slate-700 truncate">
                Allocation Date
              </label>
              <div className="w-full min-w-0">
                <Popover
                  open={isAllocDateCalendarOpen}
                  onOpenChange={setIsAllocDateCalendarOpen}
                >
                  <div className="relative flex items-center w-full">
                    <input
                      type="text"
                      value={allocDate}
                      onChange={(e) => setAllocDate(e.target.value)}
                      placeholder="MM/DD/YYYY"
                      className="w-full h-7 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none"
                    />
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center p-0.5"
                        title="Open calendar"
                      >
                        <CalendarIcon size={14} />
                      </button>
                    </PopoverTrigger>
                  </div>
                  <PopoverContent
                    className="w-auto p-0 border border-slate-200 shadow-md bg-white"
                    align="end"
                  >
                    <Calendar
                      mode="single"
                      selected={parseDateString(allocDate)}
                      defaultMonth={parseDateString(allocDate) || new Date()}
                      onSelect={(date) => {
                        if (date) {
                          setAllocDate(formatDateString(date));
                          setIsAllocDateCalendarOpen(false);
                        }
                      }}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Code & Alloc Amount Section: Conditioned on showAllocationTable */}
        {showAllocationTable ? (
          <div className="flex-1 min-h-0 flex flex-col mt-4 w-full overflow-hidden">
            {/* Scrollable Container with 2 Categorized Section Cards Per Row */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {isLoadingCodes ? (
                <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl">
                  <RefreshCw
                    size={16}
                    className="animate-spin text-portal-navy"
                  />
                  Loading transaction codes...
                </div>
              ) : transactionCodes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
                  No transaction codes found.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2">
                  {(["Income", "Expenses", "Gain/Loss", "Other"] as const).map(
                    (category) => {
                      const items = groupedTransactionCodes[category];
                      if (items.length === 0) return null;

                      return (
                        <div
                          key={category}
                          className="bg-white border border-slate-200 rounded-xl  shadow-2xs px-4 py-2 flex flex-col justify-between"
                        >
                          {/* border border-slate-200 rounded-xl */}
                          <div>
                            <h3 className="text-[14px] font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                              {category}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
                              {items.map((item, idx) => {
                                const key =
                                  item.transactionCode ||
                                  String(
                                    item.transactionCodeID ??
                                      item.id ??
                                      item.transactionCodeDesc,
                                  );
                                const codeDesc =
                                  item.transactionCodeDesc ||
                                  item.transactionCode ||
                                  "";
                                const amtValue = allocAmounts[key] ?? "";

                                return (
                                  <div
                                    key={key || idx}
                                    className="flex flex-col gap-1"
                                  >
                                    {/* Label: 14px font size, stacked above input */}
                                    <label
                                      className="text-[12px] font-medium  text-slate-700 truncate"
                                      title={codeDesc}
                                    >
                                      {codeDesc}
                                    </label>
                                    {/* Input: 12px font size */}
                                    <div className="w-full">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={amtValue}
                                        onChange={(e) =>
                                          handleAmountChange(
                                            key,
                                            e.target.value,
                                          )
                                        }
                                        onBlur={() => handleAmountBlur(key)}
                                        className="w-full h-7 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-normal text-slate-800 shadow-2xs focus:border-portal-navy focus:outline-none transition-colors"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center mt-3 w-full rounded-lg border border-slate-200 bg-slate-50/50 p-6 text-center text-xs sm:text-sm text-slate-500 font-medium">
            {selectedAllocType === "Trial Data"
              ? 'Allocation table is hidden for "Trial Data" allocation type.'
              : "Please select a Fund to display the allocation table."}
          </div>
        )}

        {/* Bottom Action Buttons: Pinned at bottom of screen, aligned to right end */}
        <div className="shrink-0 flex items-center justify-end gap-4 pt-3 mt-3 border-t border-slate-100 w-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-portal-navy px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs sm:text-sm font-medium text-portal-navy hover:underline transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
