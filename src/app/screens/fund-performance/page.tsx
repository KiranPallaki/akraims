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
