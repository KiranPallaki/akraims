"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import {
  fetchFundPerformance,
  fetchPerfBalanceHistory,
  fetchHistoricalParticipantPerformance,
} from "@/app/screens/dashboard/api";
import { Client } from "@/types/client";
import PerfBalanceHistoryChart from "@/app/screens/dashboard/PerfBalanceHistoryChart";
import FundPerformanceTable from "@/app/screens/dashboard/FundPerformanceTable";
import ParticipantPerformanceTable from "@/app/screens/dashboard/ParticipantPerformanceTable";
import { LineChart as LineChartIcon, TrendingUp } from "lucide-react";

export default function FundPerformancePage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const selectedClient = getSelectedClient();
    setClient(selectedClient);
  }, []);

  const clientID = client?.clientID;

  // TanStack Queries for performance analytics data
  const { data: performanceData = [], isLoading: isPerfLoading } = useQuery({
    queryKey: ["fundPerformance", clientID],
    queryFn: () => fetchFundPerformance(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: perfHistory = [], isLoading: isPerfHistoryLoading } = useQuery({
    queryKey: ["perfHistory", clientID],
    queryFn: () => fetchPerfBalanceHistory(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: participantPerformanceData = [],
    isLoading: isParticipantPerfLoading,
  } = useQuery({
    queryKey: ["historicalParticipantPerformance", clientID],
    queryFn: () => fetchHistoricalParticipantPerformance(clientID),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <LineChartIcon size={18} /> Performance Analytics
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">
            Fund & Participant Performance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Historical net return rates and balance history across time horizons for{" "}
            <span className="font-semibold text-slate-700">
              {client?.clientName || "Selected Client"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200 self-start sm:self-auto">
          <TrendingUp size={16} /> Returns updated quarterly
        </div>
      </div>

      {/* Card 1: Performance & Balance History Chart */}
      <div>
        <PerfBalanceHistoryChart
          items={perfHistory}
          isLoading={isPerfHistoryLoading}
        />
      </div>

      {/* Card 2: Fund Performance Table */}
      <div>
        <FundPerformanceTable
          data={performanceData}
          isLoading={isPerfLoading}
        />
      </div>

      {/* Card 3: Historical Participant Performance Table */}
      <div>
        <ParticipantPerformanceTable
          data={participantPerformanceData}
          isLoading={isParticipantPerfLoading}
        />
      </div>
    </div>
  );
}
