export type RebalanceTabType = "targets" | "transfer" | "rebalance" | "country";

// ─── Update Targets tab (RequestType: "RebalanceData") ──────────────────────

export interface RebalanceDataItem {
  participantID: number;
  participantNumber: string;
  participantName: string;
  accountID: number;
  fundID: number;
  fund: string;          // fund code / ticker
  fundName: string;
  marketValue: number;
  participantMarketValue: number;
  actualPct: number;
  targetPct: number;
}

/** Payload for PUT /rebalance/participants/{participantID}
 *  Only rows where the user typed a newTarget are sent (null rows omitted). */
export interface NewTargetPayloadItem {
  fundID: number;
  newTarget: number | null;
}

// ─── Fund Transfer & Fund Rebalance tabs (RequestParamType: "RebalanceParticipant") ───

export interface RebalanceParticipantItem {
  participantID: number;
  participantNumber?: string;
  participantName: string;
  accountID?: number;
  fundID: number;
  fund?: string;
  fundName: string;
  symbol?: string;
  marketValue: number;
  participantMarketValue?: number;
  actualPct: number;
  targetPct: number;
  targetMarketValue: number;
  buyOrSell: number;
  notes?: string;
}

// ─── Country Rebalance (hidden, preserved for future use) ───────────────────

export interface CountryRebalanceItem {
  id: number;
  countryName: string;
  countryCode: string;
  balanceByCountry: number;
  portfolioBalance: number;
  countryHoldingsPct: number;
  targetPct: number;
  targetBalance: number;
  buyOrSell: number;
}

export interface CountryRebalanceTradeItem {
  tradeID: number;
  countryName: string;
  action: "BUY" | "SELL" | "HOLD";
  shares: number;
  tradeAmount: number;
  orderType: string;
  status: "Pending" | "Ready" | "Executed";
}

// ─── Legacy submit types ─────────────────────────────────────────────────────

export interface TargetUpdateItem {
  fundID: number;
  participantID: number;
  participantName: string;
  fundName: string;
  symbol?: string;
  marketValue: number;
  currentPct: number;
  targetPct: number;
}

export interface TransferPayload {
  fundID: number;
  participantID: number;
  notes: string;
  transactionAmount: number;
  transactionCode: "TO" | "TI";
  transactionDate: string;
}

export interface RebalanceFeedbackBanner {
  type: "success" | "error" | "info" | "warning";
  message: string;
}
