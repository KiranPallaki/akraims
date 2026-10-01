import { apiClient } from "@/lib/api";
import { getSelectedClient } from "@/stores/authStore";
import {
  TransactionsTransactionItem,
  TransactionsTabType,
  TransactionCodeItem,
  ParticipantFundBalanceItem,
  RecipientItem,
  AddTransactionPayload,
  EditTransactionPayload,
} from "./types";

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
): Promise<TransactionCodeItem[]> {
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
): Promise<ParticipantFundBalanceItem[]> {
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
): Promise<RecipientItem[]> {
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

/**
 * Helper to parse and return the exact backend error response message.
 * Supports errors arrays, error objects, and raw string responses.
 */
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

  // Handle { errors: [ { message: "...", errorCode: "..." } ] }
  if (parsed && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
    const errorMsgs = parsed.errors
      .map((err: any) => {
        if (typeof err === "string") return err;
        return err.message || err.errorMessage || err.error || (err.propertyName ? `${err.propertyName}: ${err.message}` : null);
      })
      .filter(Boolean);

    if (errorMsgs.length > 0) {
      return errorMsgs.join("\n");
    }
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
 * PDF Section 1 & 2: POST /api/transactions
 * Submits Add Transaction API Payload with Authorization and clientID headers.
 */
export async function submitAddTransaction(
  payload: AddTransactionPayload,
  clientID?: number
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["clientId"] = String(effectiveClientID);
    }

    const response = await apiClient("/api/transactions", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { ok: true, status: response.status };
    }

    const resText = await response.text();
    const errorMessage = extractApiErrorMessage(
      resText,
      `HTTP ${response.status}: Failed to submit transaction`
    );
    return { ok: false, status: response.status, message: errorMessage };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * PDF Section 6 & 7: UpdateTransactions(id, payload)
 */
export async function submitUpdateTransaction(
  id: number | string,
  payload: EditTransactionPayload,
  clientID?: number
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["clientId"] = String(effectiveClientID);
    }

    const response = await apiClient(`/api/transactions/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { ok: true, status: response.status };
    }

    const resText = await response.text();
    const errorMessage = extractApiErrorMessage(
      resText,
      `HTTP ${response.status}: Failed to update transaction`
    );
    return { ok: false, status: response.status, message: errorMessage };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * PDF Section 9 & 10: deleteTransactions(id) expecting HTTP 204 No Content
 */
export async function submitDeleteTransaction(
  id: number | string,
  clientID?: number
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["clientId"] = String(effectiveClientID);
    }

    const response = await apiClient(`/api/transactions/${id}`, {
      method: "DELETE",
      headers,
    });

    // PDF Section 10: Expects HTTP 204 No Content
    if (response.status === 204 || response.ok) {
      return { ok: true, status: response.status };
    }

    const resText = await response.text();
    const errorMessage = extractApiErrorMessage(
      resText,
      `HTTP ${response.status}: Failed to delete transaction`
    );
    return { ok: false, status: response.status, message: errorMessage };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}
