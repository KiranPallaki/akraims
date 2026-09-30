import { apiClient } from "@/lib/api";
import { getSelectedClient } from "@/stores/authStore";
import { TransactionsTransactionItem, TransactionsTabType } from "./types";

export async function fetchTransactionsData<T = TransactionsTransactionItem>(
  paramType: TransactionsTabType,
  clientID?: number
): Promise<{
  ok: boolean;
  status: number;
  data: T[];
  error?: string;
}> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};

    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const payload = {
      RequestParamType: paramType,
    };

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      const list: T[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      return { ok: true, status: response.status, data: list };
    }

    const text = await response.text();
    return {
      ok: false,
      status: response.status,
      data: [],
      error: text || `HTTP ${response.status}`,
    };
  } catch (error) {
    let errorMsg = "Error fetching transactions";
    if (error instanceof Error) errorMsg = error.message;
    return { ok: false, status: 0, data: [], error: errorMsg };
  }
}

export async function fetchTransactionCodeList(
  clientID?: number
): Promise<import("./types").TransactionCodeItem[]> {
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
        RequestParamType: "AddTransactionTransactionCodeList",
      }),
    });
    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result : result?.data || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchParticipantFundBalances(
  clientID?: number
): Promise<import("./types").ParticipantFundBalanceItem[]> {
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
        RequestParamType: "AddTransactionParticipantFundBalance",
      }),
    });
    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result : result?.data || [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchRecipientList(
  clientID?: number
): Promise<import("./types").RecipientItem[]> {
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
        RequestParamType: "Recipient",
      }),
    });
    if (response.ok) {
      const result = await response.json();
      return Array.isArray(result) ? result : result?.data || [];
    }
    return [];
  } catch {
    return [];
  }
}

