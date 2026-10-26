import { apiClient } from "@/lib/api";
import { getSelectedClient } from "@/stores/authStore";
import {
  RebalanceDataItem,
  RebalanceParticipantItem,
  CountryRebalanceItem,
  CountryRebalanceTradeItem,
  NewTargetPayloadItem,
  TargetUpdateItem,
  TransferPayload,
} from "./types";

/**
 * 1. Fetch Rebalance Data for Update Targets tab
 *    Endpoint : POST /data
 *    Body     : { RequestType: "RebalanceData" }
 *    Response : flat array of participant × fund rows
 */
export async function fetchRebalanceData(
  clientID?: number,
): Promise<RebalanceDataItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({
        RequestType: "RebalanceData",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const list = Array.isArray(result) ? result : result?.data;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any) => ({
          participantID: Number(item.participantID ?? 0),
          participantNumber: String(item.participantNumber ?? ""),
          participantName: String(item.participantName ?? ""),
          accountID: Number(item.accountID ?? 0),
          fundID: Number(item.fundID ?? 0),
          fund: String(item.fund ?? ""),
          fundName: String(item.fundName ?? ""),
          marketValue: Number(item.marketValue ?? 0),
          participantMarketValue: Number(item.participantMarketValue ?? 0),
          actualPct: Number(item.actualPct ?? 0),
          targetPct: Number(item.targetPct ?? 0),
        }));
      }
    }
  } catch (error) {
    console.warn("[Rebalance API] Error fetching RebalanceData:", error);
  }

  return [];
}

/**
 * 2. Submit new target allocations for a participant
 *    Endpoint : PUT /rebalance/participants/{participantID}
 *    Body     : Array of { fundID, newTarget } — only entries where newTarget !== null
 *    Response : 204 No Content on success
 */
export async function submitNewTargets(
  participantID: number,
  payload: NewTargetPayloadItem[],
  clientID?: number,
): Promise<{ ok: boolean; message: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient(
      `/rebalance/participants/${participantID}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      },
    );

    if (response.ok || response.status === 204) {
      return {
        ok: true,
        message: "Target allocations updated successfully.",
      };
    }

    const errorText = await response.text().catch(() => "");
    return {
      ok: false,
      message: `Server returned HTTP ${response.status}${errorText ? ": " + errorText : ""}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update target allocations",
    };
  }
}

/**
 * 3. Fetch RebalanceParticipant data (Fund Transfer & Fund Rebalance tabs)
 *    Endpoint : POST /data
 *    Body     : { RequestParamType: "RebalanceParticipant" }
 */
export async function fetchRebalanceParticipants(
  clientID?: number,
): Promise<RebalanceParticipantItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/dashboards", {
      method: "POST",
      headers,
      body: JSON.stringify({
        RequestType: "RebalanceParticipant",
        RequestParamType: "RebalanceParticipant",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const list = Array.isArray(result) ? result : result?.data;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => ({
          participantID: Number(item.participantID ?? item.ParticipantID ?? 0),
          participantNumber: String(
            item.participantNumber ?? item.ParticipantNumber ?? "",
          ),
          participantName: String(
            item.participantName ?? item.ParticipantName ?? "",
          ),
          accountID: Number(item.accountID ?? item.AccountID ?? 0),
          fundID: Number(item.fundID ?? item.FundID ?? idx + 1),
          fund: String(item.fund ?? item.Fund ?? ""),
          fundName: String(item.fundName ?? item.FundName ?? ""),
          symbol: item.symbol ?? item.Symbol ?? item.fund ?? item.Fund ?? undefined,
          marketValue: Number(item.marketValue ?? item.MarketValue ?? 0),
          participantMarketValue: Number(
            item.participantMarketValue ?? item.ParticipantMarketValue ?? 0,
          ),
          actualPct: Number(item.actualPct ?? item.ActualPct ?? 0),
          targetPct: Number(item.targetPct ?? item.TargetPct ?? 0),
          targetMarketValue: Number(
            item.targetMarketValue ?? item.TargetMarketValue ?? 0,
          ),
          buyOrSell: Number(item.buyOrSell ?? item.BuyOrSell ?? 0),
          notes: item.notes ?? item.Notes ?? undefined,
        }));
      }
    }
  } catch (error) {
    console.warn("[Rebalance API] Error fetching RebalanceParticipant:", error);
  }

  return [];
}

/**
 * 4. Fetch CountryRebalance data (hidden tab, preserved for future use)
 *    RequestParamType: "CountryRebalance"
 */
export async function fetchCountryRebalance(
  clientID?: number,
): Promise<CountryRebalanceItem[]> {
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
        RequestParamType: "CountryRebalance",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const list = Array.isArray(result) ? result : result?.data;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => ({
          id: Number(item.id ?? idx + 1),
          countryName: String(item.countryName ?? item.CountryName ?? ""),
          countryCode: String(item.countryCode ?? item.CountryCode ?? ""),
          balanceByCountry: Number(
            item.balanceByCountry ?? item.BalanceByCountry ?? 0,
          ),
          portfolioBalance: Number(
            item.portfolioBalance ?? item.PortfolioBalance ?? 0,
          ),
          countryHoldingsPct: Number(
            item.countryHoldingsPct ?? item.CountryHoldingsPct ?? 0,
          ),
          targetPct: Number(item.targetPct ?? item.TargetPct ?? 0),
          targetBalance: Number(item.targetBalance ?? item.TargetBalance ?? 0),
          buyOrSell: Number(item.buyOrSell ?? item.BuyOrSell ?? 0),
        }));
      }
    }
  } catch (error) {
    console.warn("[Rebalance API] Error fetching CountryRebalance:", error);
  }

  return [];
}

/**
 * 5. Fetch CountryRebalanceTrades (hidden tab, preserved for future use)
 *    RequestParamType: "CountryRebalanceTrades"
 */
export async function fetchCountryRebalanceTrades(
  clientID?: number,
): Promise<CountryRebalanceTradeItem[]> {
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
        RequestParamType: "CountryRebalanceTrades",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const list = Array.isArray(result) ? result : result?.data;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => ({
          tradeID: Number(item.tradeID ?? item.TradeID ?? idx + 1),
          countryName: String(item.countryName ?? item.CountryName ?? ""),
          action: (item.action ?? item.Action ?? "BUY") as
            | "BUY"
            | "SELL"
            | "HOLD",
          shares: Number(item.shares ?? item.Shares ?? 0),
          tradeAmount: Number(item.tradeAmount ?? item.TradeAmount ?? 0),
          orderType: String(item.orderType ?? item.OrderType ?? ""),
          status: (item.status ?? item.Status ?? "Pending") as
            | "Pending"
            | "Ready"
            | "Executed",
        }));
      }
    }
  } catch (error) {
    console.warn(
      "[Rebalance API] Error fetching CountryRebalanceTrades:",
      error,
    );
  }

  return [];
}

/**
 * 6. Submit paired fund transfer (Fund Transfer tab)
 *    Sends Transfer Out ("TO") first, then Transfer In ("TI") sequentially.
 */

export async function submitFundTransfer(
  fromPayload: TransferPayload,
  toPayload: TransferPayload,
  clientID?: number,
): Promise<{ ok: boolean; message: string }> {
  try {
    // Use the explicitly provided ID, or fall back to the selected client.
    const selectedClient = getSelectedClient();
    const effectiveClientID = clientID ?? selectedClient?.clientID;

    // Do not send a request without the required ClientID header.
    if (
      effectiveClientID === undefined ||
      effectiveClientID === null ||
      !Number.isFinite(Number(effectiveClientID))
    ) {
      return {
        ok: false,
        message: "No client is selected. Please select a client and try again.",
      };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ClientID: String(effectiveClientID),
    };

    // Step 1: Transfer Out
    const fromResponse = await apiClient("/api/transactions", {
      method: "POST",
      headers,
      body: JSON.stringify(fromPayload),
    });

    if (!fromResponse.ok) {
      const errorText = await fromResponse.text().catch(() => "");
      return {
        ok: false,
        message: `Transfer Out failed (HTTP ${fromResponse.status}): ${
          errorText || fromResponse.statusText || "Unknown API error"
        }`,
      };
    }

    // Step 2: Transfer In — only after Transfer Out succeeds
    const toResponse = await apiClient("/api/transactions", {
      method: "POST",
      headers,
      body: JSON.stringify(toPayload),
    });

    if (!toResponse.ok) {
      const errorText = await toResponse.text().catch(() => "");
      return {
        ok: false,
        message:
          `Transfer Out succeeded, but Transfer In failed ` +
          `(HTTP ${toResponse.status}): ${
            errorText || toResponse.statusText || "Unknown API error"
          }. Please verify the transactions before retrying.`,
      };
    }

    return {
      ok: true,
      message: `Successfully transferred $${Math.abs(
        toPayload.transactionAmount,
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} between funds.`,
    };
  } catch (error) {
    console.error("[Fund Transfer] API error:", error);

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Network error while submitting the fund transfer.",
    };
  }
}

/**
 * 7. Submit Update Targets (legacy - kept for backward compat)
 *    RequestParamType: "UpdateTargets"
 */
export async function submitUpdateTargets(
  targets: TargetUpdateItem[],
  clientID?: number,
): Promise<{ ok: boolean; message: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({
        RequestParamType: "UpdateTargets",
        Targets: targets,
      }),
    });

    if (response.ok) {
      return { ok: true, message: "Target allocations updated successfully." };
    }

    return {
      ok: false,
      message: `Server returned HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update target allocations",
    };
  }
}
