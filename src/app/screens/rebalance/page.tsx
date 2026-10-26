"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scale, ArrowLeftRight, Sliders } from "lucide-react";
import { getSelectedClient } from "@/stores/authStore";
import ConstantMessageBanner from "@/components/common/ConstantMessageBanner";
import UpdateTargetsTab from "./components/UpdateTargetsTab";
import FundTransferTab from "./components/FundTransferTab";
import FundRebalanceTab from "./components/FundRebalanceTab";
import CountryRebalanceTab from "./components/CountryRebalanceTab";
import {
  fetchRebalanceData,
  fetchRebalanceParticipants,
  fetchCountryRebalance,
  fetchCountryRebalanceTrades,
} from "./api";
import { RebalanceTabType, RebalanceFeedbackBanner } from "./types";

export default function RebalancePage() {
  const selectedClient = getSelectedClient();
  const clientID = selectedClient?.clientID;

  // Active Tab state
  const [activeTab, setActiveTab] = useState<RebalanceTabType>("targets");
  const [feedbackBanner, setFeedbackBanner] =
    useState<RebalanceFeedbackBanner | null>(null);

  // ── Update Targets tab: RequestType "RebalanceData" ────────────────────────
  const {
    data: rebalanceData = [],
    isLoading: isRebalanceDataLoading,
    refetch: refetchRebalanceData,
  } = useQuery({
    queryKey: ["rebalanceData", clientID],
    queryFn: () => fetchRebalanceData(clientID),
  });

  // ── Fund Transfer & Fund Rebalance tabs: RequestParamType "RebalanceParticipant" ──
  const {
    data: participantData = [],
    isLoading: isParticipantsLoading,
    refetch: refetchParticipants,
  } = useQuery({
    queryKey: ["rebalanceParticipants", clientID],
    queryFn: () => fetchRebalanceParticipants(clientID),
  });

  // ── Country Rebalance (hidden, preserved for future use) ──────────────────
  const {
    data: countryData = [],
    isLoading: isCountryLoading,
    refetch: refetchCountry,
  } = useQuery({
    queryKey: ["countryRebalance", clientID],
    queryFn: () => fetchCountryRebalance(clientID),
  });

  const {
    data: tradesData = [],
    isLoading: isTradesLoading,
    refetch: refetchTrades,
  } = useQuery({
    queryKey: ["countryRebalanceTrades", clientID],
    queryFn: () => fetchCountryRebalanceTrades(clientID),
  });

  const handleShowMessage = (
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) => {
    setFeedbackBanner({ type, message });
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
              Portfolio Rebalance &amp; Transfers
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Target allocations, inter-fund transfers, and participant
              rebalance calculations
            </p>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-5">
            {/* Update Targets */}
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="rebalanceOperation"
                value="targets"
                checked={activeTab === "targets"}
                onChange={() => setActiveTab("targets")}
                className="h-4 w-4 accent-[#172554]"
              />
              <Sliders size={16} className="text-slate-500" />
              <span>Update Targets</span>
            </label>

            {/* Fund Transfer */}
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="rebalanceOperation"
                value="transfer"
                checked={activeTab === "transfer"}
                onChange={() => setActiveTab("transfer")}
                className="h-4 w-4 accent-[#172554]"
              />
              <ArrowLeftRight size={16} className="text-slate-500" />
              <span>Fund Transfer</span>
            </label>

            {/* Fund Rebalance */}
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="rebalanceOperation"
                value="rebalance"
                checked={activeTab === "rebalance"}
                onChange={() => setActiveTab("rebalance")}
                className="h-4 w-4 accent-[#172554]"
              />
              <Scale size={16} className="text-slate-500" />
              <span>Fund Rebalance</span>
            </label>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackBanner && (
        <ConstantMessageBanner
          type={feedbackBanner.type}
          message={feedbackBanner.message}
          onClose={() => setFeedbackBanner(null)}
        />
      )}

      {/* ── Update Targets tab (uses RebalanceData) ─────────────────────────── */}
      {activeTab === "targets" && (
        <UpdateTargetsTab
          data={rebalanceData}
          isLoading={isRebalanceDataLoading}
          onRefresh={refetchRebalanceData}
          onShowMessage={handleShowMessage}
        />
      )}

      {/* ── Fund Transfer tab (uses RebalanceParticipant) ─────────────────── */}
      {activeTab === "transfer" && (
        <FundTransferTab
          data={participantData}
          isLoading={isParticipantsLoading}
          onRefresh={refetchParticipants}
          onShowMessage={handleShowMessage}
        />
      )}

      {/* ── Fund Rebalance tab (uses RebalanceParticipant) ────────────────── */}
      {activeTab === "rebalance" && (
        <FundRebalanceTab
          data={participantData}
          isLoading={isParticipantsLoading}
          onRefresh={refetchParticipants}
          onShowMessage={handleShowMessage}
        />
      )}

      {/* Country Rebalance panel — hidden (no tab), preserved for future use:
      {activeTab === "country" && (
        <CountryRebalanceTab
          countryData={countryData}
          tradesData={tradesData}
          isLoading={isCountryLoading || isTradesLoading}
          onRefresh={() => { refetchCountry(); refetchTrades(); }}
          onShowMessage={handleShowMessage}
        />
      )} */}
    </div>
  );
}
