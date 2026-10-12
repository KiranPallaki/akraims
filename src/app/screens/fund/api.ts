import { apiClient } from "@/lib/api";
import { getSelectedClient } from "@/stores/authStore";
import { FundItem, AddFundPayload } from "./types";

export const DEFAULT_MOCK_FUNDS: FundItem[] = [
  {
    fundID: 1,
    fund: "HNF01",
    fundName: "HNF Institutions Fund",
    fundType: "Pool",
    amount: "2500000.00",
    accountType: "Endowment",
    priceSchedule: "Monthly",
    openDate: "1999-04-30",
    baseCurrency: "USD",
    status: "Active",
  },
  {
    fundID: 2,
    fund: "PRB01",
    fundName: "Presbytery Of Boston Endowment",
    fundType: "Pool",
    amount: "1200000.00",
    accountType: "Endowment",
    priceSchedule: "Daily",
    openDate: "2005-01-15",
    baseCurrency: "USD",
    status: "Active",
  },
  {
    fundID: 3,
    fund: "GRW02",
    fundName: "High Growth Equity Fund",
    fundType: "Equity",
    amount: "3400000.00",
    accountType: "Operating",
    priceSchedule: "Daily",
    openDate: "2012-06-01",
    baseCurrency: "USD",
    status: "Active",
  },
  {
    fundID: 4,
    fund: "BND03",
    fundName: "Core Bond Income Portfolio",
    fundType: "Fixed Income",
    amount: "1850000.00",
    accountType: "Pension",
    priceSchedule: "Monthly",
    openDate: "2015-09-20",
    baseCurrency: "USD",
    status: "Active",
  },
];

export function extractApiErrorMessage(data: any, fallbackMessage: string): string {
  if (!data) return fallbackMessage;
  let parsed = data;
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return fallbackMessage;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (parsed && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
    const errorMsgs = parsed.errors
      .map((err: any) => {
        if (typeof err === "string") return err;
        return (
          err.message ||
          err.errorMessage ||
          err.error ||
          (err.propertyName ? `${err.propertyName}: ${err.message}` : null)
        );
      })
      .filter(Boolean);

    if (errorMsgs.length > 0) return errorMsgs.join("\n");
  }

  if (parsed && typeof parsed === "object") {
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error;
    if (typeof parsed.errorMessage === "string" && parsed.errorMessage.trim()) return parsed.errorMessage;
    try {
      return JSON.stringify(parsed, null, 2);
    } catch {
      return fallbackMessage;
    }
  }

  return fallbackMessage;
}

/**
 * Loads the fund list for the selected client using RequestParamType = "Fund"
 */
export async function fetchFundList(
  clientID?: number
): Promise<{ ok: boolean; status: number; data: FundItem[]; error?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestParamType: "Fund" }),
    });

    if (response.ok) {
      const result = await response.json();
      const list: FundItem[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      return {
        ok: true,
        status: response.status,
        data: list.length > 0 ? list : DEFAULT_MOCK_FUNDS,
      };
    }

    return {
      ok: false,
      status: response.status,
      data: DEFAULT_MOCK_FUNDS,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: DEFAULT_MOCK_FUNDS,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Loads a single fund by ID
 */
export async function fetchFundById(
  id: number | string,
  clientID?: number
): Promise<{ ok: boolean; data?: FundItem; error?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient(`/funds/${id}`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: true, data };
    }
    const text = await response.text();
    return { ok: false, error: text || `HTTP ${response.status}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Creates a new fund via POST /funds
 */
export async function submitAddFund(
  payload: AddFundPayload,
  clientID?: number
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/funds", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { ok: true, status: response.status };
    }

    const resText = await response.text();
    const errorMsg = extractApiErrorMessage(
      resText,
      `HTTP ${response.status}: Failed to add fund`
    );
    return { ok: false, status: response.status, message: errorMsg };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Updates an existing fund via PUT /funds/{id}
 * Per Section 3 Step 6: Empty string fields are removed from the payload.
 */
export async function submitUpdateFund(
  id: number | string,
  payload: Partial<AddFundPayload>,
  clientID?: number
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    // Strip empty string fields from payload
    const cleanedPayload: Record<string, any> = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== "" && v !== undefined) {
        cleanedPayload[k] = v;
      }
    });

    const response = await apiClient(`/funds/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(cleanedPayload),
    });

    if (response.ok || response.status === 204) {
      return { ok: true, status: response.status };
    }

    const resText = await response.text();
    const errorMsg = extractApiErrorMessage(
      resText,
      `HTTP ${response.status}: Failed to update fund`
    );
    return { ok: false, status: response.status, message: errorMsg };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Deletes a fund via DELETE /funds/{id}
 */
export async function submitDeleteFund(
  id: number | string,
  clientID?: number
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient(`/funds/${id}`, {
      method: "DELETE",
      headers,
    });

    if (response.ok || response.status === 204) {
      return { ok: true, status: response.status };
    }

    const resText = await response.text();
    const errorMsg = extractApiErrorMessage(
      resText,
      `HTTP ${response.status}: Failed to delete fund`
    );
    return { ok: false, status: response.status, message: errorMsg };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}
