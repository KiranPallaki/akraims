import { apiClient } from "@/lib/api";
import { getSelectedClient } from "@/stores/authStore";
import {
  DashboardNetActivityData,
  DashboardFundBalanceItem,
  DashboardParticipantBalanceItem,
  DashboardParticipantStatementItem,
  DashboardFundPerformanceItem,
  DashboardFundStatementItem,
  DashboardPerfBalanceHistoryItem,
  DashboardHistoricalParticipantPerformanceItem,
} from "./types";

export async function fetchDashboardNetActivity(
  clientID?: number
): Promise<DashboardNetActivityData | null> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "NetActivity" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    }
    return null;
  } catch (error) {
    console.warn("[Dashboard API] Error fetching NetActivity:", error);
    return null;
  }
}

export async function fetchFundBalances(
  clientID?: number
): Promise<DashboardFundBalanceItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "FundBalances" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    }
    return [];
  } catch (error) {
    console.warn("[Dashboard API] Error fetching FundBalances:", error);
    return [];
  }
}

export async function fetchParticipantBalances(
  clientID?: number
): Promise<DashboardParticipantBalanceItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "ParticipantBalances" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
    }
    return [];
  } catch (error) {
    console.warn("[Dashboard API] Error fetching ParticipantBalances:", error);
    return [];
  }
}

export async function fetchParticipantStatement(
  clientID?: number
): Promise<DashboardParticipantStatementItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "ParticipantStatement" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
    }
    return [];
  } catch (error) {
    console.warn("[Dashboard API] Error fetching ParticipantStatement:", error);
    return [];
  }
}

export async function fetchFundPerformance(
  clientID?: number
): Promise<DashboardFundPerformanceItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "FundPerformance" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
    }
    return [];
  } catch (error) {
    console.warn("[Dashboard API] Error fetching FundPerformance:", error);
    return [];
  }
}

export async function fetchFundStatementValues(
  clientID?: number
): Promise<DashboardFundStatementItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "FundStatementValues" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
    }
    return [];
  } catch (error) {
    console.warn("[Dashboard API] Error fetching FundStatementValues:", error);
    return [];
  }
}

export async function fetchPerfBalanceHistory(
  clientID?: number
): Promise<DashboardPerfBalanceHistoryItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "PerfBalanceHistory" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
    }
    return [];
  } catch (error) {
    console.warn("[Dashboard API] Error fetching PerfBalanceHistory:", error);
    return [];
  }
}

export async function fetchHistoricalParticipantPerformance(
  clientID?: number
): Promise<DashboardHistoricalParticipantPerformanceItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestType: "HistoricalParticipantPerformance" }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
    }
    return [];
  } catch (error) {
    console.warn(
      "[Dashboard API] Error fetching HistoricalParticipantPerformance:",
      error
    );
    return [];
  }
}

