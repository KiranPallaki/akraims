import { apiClient } from "@/lib/api";
import { getSelectedClient } from "@/stores/authStore";
import {
  ParticipantItem,
  AssociatedFundItem,
  AddParticipantPayload,
  UpdateParticipantPayload,
} from "./types";
import { DEFAULT_MOCK_FUNDS } from "../fund/api";

export const DEFAULT_MOCK_PARTICIPANTS: ParticipantItem[] = [
  {
    participantID: 101,
    participantNumber: "PART-101",
    participantName: "Alex West Retirement Plan",
    participantType: "Plan",
    status: "Active",
    openDate: "1999-04-30",
    closeDate: null,
    fundID: [1, 2],
    fundNames: ["HNF Institutions Fund", "Presbytery Of Boston Endowment"],
  },
  {
    participantID: 102,
    participantNumber: "PART-102",
    participantName: "Logan Hayes Institution Plan",
    participantType: "Plan",
    status: "Active",
    openDate: "1999-04-30",
    closeDate: null,
    fundID: [1],
    fundNames: ["HNF Institutions Fund"],
  },
  {
    participantID: 103,
    participantNumber: "PART-103",
    participantName: "William Berry Family Tust",
    participantType: "Plan",
    status: "Active",
    openDate: "1999-04-30",
    closeDate: null,
    fundID: [1, 3],
    fundNames: ["HNF Institutions Fund", "High Growth Equity Fund"],
  },
  {
    participantID: 104,
    participantNumber: "PART-104",
    participantName: "Finley Lee DB Plan",
    participantType: "Plan",
    status: "Active",
    openDate: "2011-01-27",
    closeDate: null,
    fundID: [2],
    fundNames: ["Presbytery Of Boston Endowment"],
  },
  {
    participantID: 105,
    participantNumber: "PART-105",
    participantName: "Corey Moore Trust Group",
    participantType: "Plan",
    status: "Active",
    openDate: "2011-07-18",
    closeDate: null,
    fundID: [1, 4],
    fundNames: ["HNF Institutions Fund", "Core Bond Income Portfolio"],
  },
  {
    participantID: 106,
    participantNumber: "PART-106",
    participantName: "Samantha Stewart Financial Fund",
    participantType: "Plan",
    status: "Active",
    openDate: "2018-10-26",
    closeDate: null,
    fundID: [3],
    fundNames: ["High Growth Equity Fund"],
  },
  {
    participantID: 107,
    participantNumber: "PART-107",
    participantName: "Eva Newman DC Plan",
    participantType: "Plan",
    status: "Active",
    openDate: "2019-06-23",
    closeDate: null,
    fundID: [1, 2, 3],
    fundNames: ["HNF Institutions Fund", "Presbytery Of Boston Endowment", "High Growth Equity Fund"],
  },
  {
    participantID: 108,
    participantNumber: "PART-108",
    participantName: "John Hopkins Commingled Fund",
    participantType: "Plan",
    status: "Active",
    openDate: "2019-09-02",
    closeDate: null,
    fundID: [1],
    fundNames: ["HNF Institutions Fund"],
  },
  {
    participantID: 109,
    participantNumber: "PART-109",
    participantName: "Maxine Freeman Group Trust",
    participantType: "Plan",
    status: "Active",
    openDate: "2020-03-15",
    closeDate: null,
    fundID: [4],
    fundNames: ["Core Bond Income Portfolio"],
  },
  {
    participantID: 110,
    participantNumber: "PART-110",
    participantName: "Oakridge Pension Foundation",
    participantType: "Plan",
    status: "Active",
    openDate: "2021-05-10",
    closeDate: null,
    fundID: [2, 4],
    fundNames: ["Presbytery Of Boston Endowment", "Core Bond Income Portfolio"],
  },
  {
    participantID: 111,
    participantNumber: "PART-111",
    participantName: "Highland Endowment Fund",
    participantType: "Plan",
    status: "Active",
    openDate: "2022-11-04",
    closeDate: null,
    fundID: [1, 3],
    fundNames: ["HNF Institutions Fund", "High Growth Equity Fund"],
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
 * Loads participant and fund relationship data via RequestParamType: "FundParticipant"
 * Shapes raw records by grouping by participantID (Section 4 Step 3)
 */
export async function fetchParticipantList(
  clientID?: number
): Promise<{ ok: boolean; status: number; data: ParticipantItem[]; error?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestParamType: "FundParticipant" }),
    });

    if (response.ok) {
      const result = await response.json();
      const rawList: any[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];

      if (rawList.length === 0) {
        return { ok: true, status: response.status, data: DEFAULT_MOCK_PARTICIPANTS };
      }

      // Group rows by participantID
      const groupedMap = new Map<string | number, ParticipantItem>();

      rawList.forEach((row) => {
        const pId = row.participantID || row.id || row.participantNumber;
        if (!pId) return;

        if (!groupedMap.has(pId)) {
          groupedMap.set(pId, {
            participantID: pId,
            participantNumber: row.participantNumber || String(pId),
            participantName: row.participantName || row.name || "Unknown Participant",
            participantType: row.participantType || row.type || "Plan",
            status: row.status || (row.isActive ? "Active" : "Active"),
            openDate: row.openDate || row.fundOpenDate,
            closeDate: row.closeDate || null,
            fundID: row.fundID !== undefined && row.fundID !== null ? [row.fundID] : [],
            fundNames: row.fundName ? [row.fundName] : [],
          });
        } else {
          const existing = groupedMap.get(pId)!;
          if (row.fundID !== undefined && row.fundID !== null && !existing.fundID?.includes(row.fundID)) {
            existing.fundID?.push(row.fundID);
            if (row.fundName) {
              existing.fundNames?.push(row.fundName);
            }
          }
        }
      });

      const groupedList = Array.from(groupedMap.values());
      return {
        ok: true,
        status: response.status,
        data: groupedList.length > 0 ? groupedList : DEFAULT_MOCK_PARTICIPANTS,
      };
    }

    return {
      ok: false,
      status: response.status,
      data: DEFAULT_MOCK_PARTICIPANTS,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: DEFAULT_MOCK_PARTICIPANTS,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Loads fund options for participant association (Section 4 Step 1)
 */
export async function fetchFundOptions(
  clientID?: number
): Promise<AssociatedFundItem[]> {
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
      const list: any[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];

      if (list.length > 0) {
        return list.map((item) => ({
          fundID: item.fundID ?? item.id,
          fund: item.fund || item.fundCode || "",
          fundName: item.fundName || item.fund || "",
          fundType: item.fundType || "Pool",
        }));
      }
    }

    return DEFAULT_MOCK_FUNDS.map((f) => ({
      fundID: f.fundID,
      fund: f.fund,
      fundName: f.fundName,
      fundType: f.fundType,
    }));
  } catch {
    return DEFAULT_MOCK_FUNDS.map((f) => ({
      fundID: f.fundID,
      fund: f.fund,
      fundName: f.fundName,
      fundType: f.fundType,
    }));
  }
}

/**
 * Submits new participant via POST /participants
 * Payload contains addFundIds and removeFundIds arrays (Section 4 Step 4)
 */
export async function submitAddParticipant(
  payload: AddParticipantPayload,
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

    const response = await apiClient("/participants", {
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
      `HTTP ${response.status}: Failed to add participant`
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
 * Updates an existing participant via PUT /participants/{id}
 * Per Section 4 Step 7: Empty and undefined values removed, participantNumber removed.
 */
export async function submitUpdateParticipant(
  id: number | string,
  payload: UpdateParticipantPayload,
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

    // Clean payload: strip empty/undefined and participantNumber
    const cleanedPayload: Record<string, any> = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (k !== "participantNumber" && v !== "" && v !== undefined) {
        cleanedPayload[k] = v;
      }
    });

    const response = await apiClient(`/participants/${id}`, {
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
      `HTTP ${response.status}: Failed to update participant`
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
 * Deletes a participant via DELETE /participants/{id}
 */
export async function submitDeleteParticipant(
  id: number | string,
  clientID?: number
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient(`/participants/${id}`, {
      method: "DELETE",
      headers,
    });

    if (response.ok || response.status === 204) {
      return { ok: true, status: response.status };
    }

    const resText = await response.text();
    const errorMsg = extractApiErrorMessage(
      resText,
      `HTTP ${response.status}: Failed to delete participant`
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
