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
): Promise<{ ok: boolean; message?: string; returnCode?: number }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const fundIdStr = String(payload.fundId ?? "").trim();
    const endpoint = fundIdStr
      ? `/funds/${fundIdStr}/allocations`
      : `/funds/allocations`;

    const requestBody = {
      sessionID: payload.sessionID || "test",
      date: payload.date,
      allocateString: payload.allocateString,
      allocType: payload.allocType,
      fundId: payload.fundId,
    };

    const response = await apiClient(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const contentType = response.headers.get("content-type");
    let json: any = null;
    let text = "";

    if (contentType && contentType.includes("application/json")) {
      json = await response.json();
    } else {
      text = await response.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    let returnCode: any = undefined;
    let returnMessage = "";

    if (json) {
      if (typeof json === "string") {
        returnMessage = json;
      } else if (Array.isArray(json) && json.length > 0) {
        const item = json[0];
        returnCode = item?.returnCode ?? item?.returncode ?? item?.ReturnCode;
        returnMessage =
          item?.returnMessage ??
          item?.returnmessage ??
          item?.ReturnMessage ??
          item?.message ??
          item?.Message ??
          "";
      } else if (typeof json === "object") {
        returnCode = json?.returnCode ?? json?.returncode ?? json?.ReturnCode;
        returnMessage =
          json?.returnMessage ??
          json?.returnmessage ??
          json?.ReturnMessage ??
          json?.message ??
          json?.Message ??
          json?.error ??
          json?.Error ??
          "";
      }
    }

    if (!returnMessage && text) {
      returnMessage = text;
    }

    if (typeof returnMessage === "string") {
      returnMessage = returnMessage.trim().replace(/^"|"$/g, "");
    }

    // A return code other than 0 is treated as an error
    const isSuccessCode =
      returnCode === undefined
        ? response.ok
        : returnCode === 0 || returnCode === "0";

    const isSuccess = response.ok && isSuccessCode;

    return {
      ok: isSuccess,
      returnCode: returnCode !== undefined ? Number(returnCode) : undefined,
      message:
        returnMessage ||
        (isSuccess
          ? "Allocations submitted successfully!"
          : `HTTP ${response.status}`),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}
