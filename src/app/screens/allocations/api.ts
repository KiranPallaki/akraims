import { apiClient } from "@/lib/api";
import { getSelectedClient } from "@/stores/authStore";
import {
  AllocTypeItem,
  FundItem,
  TransactionCodeToAllocateItem,
  AllocLastFundPriceDateResponse,
} from "./types";

export function formatDateToMMDDYYYY(dateStr?: string | null): string {
  if (!dateStr) return "";
  const cleanStr = String(dateStr).trim().split("T")[0];
  const parts = cleanStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${month.padStart(2, "0")}/${day.padStart(2, "0")}/${year}`;
  }
  return dateStr;
}

export async function fetchAllocTypes(
  clientID?: number
): Promise<AllocTypeItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({
        RequestParamType: "AllocType",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result : result?.data || [];
    }
    return [];
  } catch (error) {
    console.warn("[Allocations API] Error fetching AllocType:", error);
    return [];
  }
}

export async function fetchFunds(clientID?: number): Promise<FundItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({
        RequestParamType: "Fund",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result : result?.data || [];
    }
    return [];
  } catch (error) {
    console.warn("[Allocations API] Error fetching Fund list:", error);
    return [];
  }
}

export async function fetchTransactionCodesToAllocate(
  clientID?: number
): Promise<TransactionCodeToAllocateItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({
        RequestParamType: "TransactionCodesToAllocate",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result : result?.data || [];
    }
    return [];
  } catch (error) {
    console.warn(
      "[Allocations API] Error fetching TransactionCodesToAllocate:",
      error
    );
    return [];
  }
}

export async function fetchAllocLastFundPriceDate(
  fundId: string | number,
  clientID?: number
): Promise<AllocLastFundPriceDateResponse | null> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({
        RequestParamType: "AllocLastFundPriceDate",
        Filter: String(fundId),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const item = Array.isArray(result) ? result[0] : result;
      if (item) {
        return {
          lastFundPriceDate:
            item.lastFundPriceDate || item.LastFundPriceDate || "",
          nextAllocDate: item.nextAllocDate || item.NextAllocDate || "",
        };
      }
    }
    return null;
  } catch (error) {
    console.warn(
      "[Allocations API] Error fetching AllocLastFundPriceDate:",
      error
    );
    return null;
  }
}

export async function submitSaveAllocation(
  payload: {
    sessionID?: string;
    date: string;
    allocateString: string;
    allocType?: string;
    fundId?: string | number;
  },
  clientID?: number
): Promise<{ ok: boolean; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const requestBody = {
      RequestParamType: "addAllocations",
      sessionID: payload.sessionID || "test",
      date: payload.date,
      allocateString: payload.allocateString,
      allocType: payload.allocType,
      fundId: payload.fundId,
    };

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      return { ok: true };
    }
    const text = await response.text();
    return { ok: false, message: text || `HTTP ${response.status}` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}
