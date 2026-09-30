"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient, getSavedUserSession } from "@/stores/authStore";
import {
  fetchDashboardNetActivity,
  fetchFundBalances,
  fetchParticipantBalances,
  fetchParticipantStatement,
  fetchFundPerformance,
  fetchFundStatementValues,
  fetchPerfBalanceHistory,
} from "@/app/screens/dashboard/api";
import { Client } from "@/types/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import FundBalancesPieChart from "@/app/screens/dashboard/FundBalancesPieChart";
import PerfBalanceHistoryChart from "@/app/screens/dashboard/PerfBalanceHistoryChart";
import ParticipantBalancesTable from "@/app/screens/dashboard/ParticipantBalancesTable";
import ParticipantStatementTable from "@/app/screens/dashboard/ParticipantStatementTable";
import FundPerformanceTable from "@/app/screens/dashboard/FundPerformanceTable";
import FundStatementTable from "@/app/screens/dashboard/FundStatementTable";
import { Activity, DollarSign, Percent, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    const selected = getSelectedClient();
    setClient(selected);

    const userSession = getSavedUserSession() as any;
    if (userSession) {
      const name =
        userSession.firstName ||
        userSession.FirstName ||
        userSession.name ||
        userSession.email ||
        "User";
      setUserName(name);
    }
  }, []);

  const clientID = client?.clientID;

  // TanStack React Query Hooks for Dashboard data
  const { data: netActivity, isLoading: isNetLoading } = useQuery({
    queryKey: ["dashboard", "netActivity", clientID],
    queryFn: () => fetchDashboardNetActivity(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: fundBalances = [], isLoading: isBalancesLoading } = useQuery({
    queryKey: ["dashboard", "fundBalances", clientID],
    queryFn: () => fetchFundBalances(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: participantBalances = [], isLoading: isParticipantLoading } = useQuery({
    queryKey: ["dashboard", "participantBalances", clientID],
    queryFn: () => fetchParticipantBalances(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: participantStatements = [], isLoading: isStatementLoading } = useQuery({
    queryKey: ["dashboard", "participantStatement", clientID],
    queryFn: () => fetchParticipantStatement(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: fundPerformance = [], isLoading: isPerfLoading } = useQuery({
    queryKey: ["dashboard", "fundPerformance", clientID],
    queryFn: () => fetchFundPerformance(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: fundStatements = [], isLoading: isFundStatementLoading } = useQuery({
    queryKey: ["dashboard", "fundStatements", clientID],
    queryFn: () => fetchFundStatementValues(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: perfHistory = [], isLoading: isPerfHistoryLoading } = useQuery({
    queryKey: ["dashboard", "perfHistory", clientID],
    queryFn: () => fetchPerfBalanceHistory(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const isMetricsLoading =
    isNetLoading ||
    isBalancesLoading ||
    isParticipantLoading ||
    isStatementLoading ||
    isPerfLoading ||
    isFundStatementLoading ||
    isPerfHistoryLoading;

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatPercent = (val?: number) => {
    if (val === undefined || val === null) return "0.00%";
    return `${val.toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Welcome Header with User Name & Matrix Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Welcome, {userName}!
            </h2>
          </div>
          {netActivity?.endDate && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto border border-slate-200">
              As of {new Date(netActivity.endDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* 4 Matrix Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3.5">
          {/* Card 1: Balance */}
          <Card className="gap-1.5 border-l-4 border-l-[var(--color-portal-accent,#051a36)] py-2.5 sm:py-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-md bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-0">
              <CardTitle className="font-semibold text-slate-600 text-xs sm:text-sm">
                Balance
              </CardTitle>
              <DollarSign
                aria-hidden="true"
                className="h-4 w-4 text-[var(--color-portal-accent,#051a36)]"
              />
            </CardHeader>
            <CardContent className="px-4 py-0">
              {isMetricsLoading ? (
                <div className="h-6 w-28 bg-slate-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="font-bold text-slate-900 text-lg sm:text-xl">
                    {formatCurrency(netActivity?.marketValue)}
                  </div>
                  <p className="font-medium text-[11px] text-slate-500 mt-0.5">
                    YTD Begin: {formatCurrency(netActivity?.ytdBeginBalance)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Net Activity */}
          <Card className="gap-1.5 border-l-4 border-l-[var(--color-portal-accent,#051a36)] py-2.5 sm:py-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-md bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-0">
              <CardTitle className="font-semibold text-slate-600 text-xs sm:text-sm">
                Net Activity
              </CardTitle>
              <Activity
                aria-hidden="true"
                className="h-4 w-4 text-[var(--color-portal-accent,#051a36)]"
              />
            </CardHeader>
            <CardContent className="px-4 py-0">
              {isMetricsLoading ? (
                <div className="h-6 w-28 bg-slate-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="font-bold text-slate-900 text-lg sm:text-xl">
                    {formatCurrency(netActivity?.activity)}
                  </div>
                  <p className="font-medium text-[11px] text-slate-500 mt-0.5">
                    Net Contributions & Redemptions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Gain / Loss */}
          <Card className="gap-1.5 border-l-4 border-l-[var(--color-portal-accent,#051a36)] py-2.5 sm:py-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-md bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-0">
              <CardTitle className="font-semibold text-slate-600 text-xs sm:text-sm">
                Gain / Loss
              </CardTitle>
              <TrendingUp
                aria-hidden="true"
                className="h-4 w-4 text-[var(--color-portal-accent,#051a36)]"
              />
            </CardHeader>
            <CardContent className="px-4 py-0">
              {isMetricsLoading ? (
                <div className="h-6 w-28 bg-slate-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="font-bold text-slate-900 text-lg sm:text-xl">
                    {formatCurrency(netActivity?.gainLoss)}
                  </div>
                  <p className="font-medium text-[11px] text-slate-500 mt-0.5">
                    Realized & Unrealized G/L
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Rate of Return */}
          <Card className="gap-1.5 border-l-4 border-l-[var(--color-portal-accent,#051a36)] py-2.5 sm:py-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-md bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-0">
              <CardTitle className="font-semibold text-slate-600 text-xs sm:text-sm">
                ROI
              </CardTitle>
              <Percent
                aria-hidden="true"
                className="h-4 w-4 text-[var(--color-portal-accent,#051a36)]"
              />
            </CardHeader>
            <CardContent className="px-4 py-0">
              {isMetricsLoading ? (
                <div className="h-6 w-28 bg-slate-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="font-bold text-slate-900 text-lg sm:text-xl">
                    {formatPercent(netActivity?.rateOfReturn)}
                  </div>
                  <p className="font-medium text-[11px] text-slate-500 mt-0.5">
                    YTD Return
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fund Sources Pie Chart & Performance Balance History */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-2 items-stretch">
        <div className="lg:col-span-4">
          <FundBalancesPieChart
            items={fundBalances}
            isLoading={isBalancesLoading}
          />
        </div>

        <div className="lg:col-span-6">
          <PerfBalanceHistoryChart
            items={perfHistory}
            isLoading={isPerfHistoryLoading}
          />
        </div>
      </div>

      {/* Participant Balances & Statement Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 items-stretch">
        <ParticipantBalancesTable
          data={participantBalances}
          isLoading={isParticipantLoading}
        />
        <ParticipantStatementTable
          data={participantStatements}
          isLoading={isStatementLoading}
        />
      </div>

      {/* Fund Statement Table Section */}
      <div>
        <FundStatementTable
          data={fundStatements}
          isLoading={isFundStatementLoading}
        />
      </div>

      {/* Fund Performance Table Section */}
      <div>
        <FundPerformanceTable
          data={fundPerformance}
          isLoading={isPerfLoading}
        />
      </div>
    </div>
  );
}
