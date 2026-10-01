import {
  TransactionFormValues,
  ParticipantFundBalanceItem,
  TransactionCodeItem,
  AddTransactionPayload,
  EditTransactionPayload,
} from "../types";

/**
 * Formats a string or numeric amount with US style thousand separators (commas).
 * E.g., "16556556" -> "16,556,556", "1000.50" -> "1,000.50"
 */
export function formatAmountWithCommas(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === "") return "";
  
  const strVal = String(val);
  // Remove existing commas
  const cleaned = strVal.replace(/,/g, "");
  
  // Handle leading minus or standalone period
  if (cleaned === ".") return "0.";
  if (cleaned === "-") return "-";

  // Split integer and decimal parts
  const parts = cleaned.split(".");
  const intPart = parts[0].replace(/[^0-9-]/g, "");

  let formattedInt = "";
  if (intPart) {
    const numInt = parseInt(intPart, 10);
    formattedInt = isNaN(numInt) ? "" : numInt.toLocaleString("en-US");
    if (intPart.startsWith("-") && numInt === 0) {
      formattedInt = "-" + formattedInt;
    }
  }

  if (parts.length > 1) {
    const decimalPart = parts[1].replace(/[^0-9]/g, "");
    return `${formattedInt || "0"}.${decimalPart}`;
  }

  return formattedInt;
}

/**
 * Calculates transaction units based on Transaction Amount and Fund Price.
 * Formats with US style thousand separators and 6 decimal places.
 * E.g., 1000000 / 25 -> "40,000.000000"
 */
export function calculateTransactionUnits(
  amount: number | string,
  fundPrice: number | string
): string {
  const numAmt = parseNumericValue(amount);
  const numPrice = parseNumericValue(fundPrice);

  if (numPrice > 0 && numAmt > 0) {
    const rawUnits = numAmt / numPrice;
    const fixedStr = rawUnits.toFixed(6);
    const parts = fixedStr.split(".");
    const intPart = parseInt(parts[0], 10);
    const formattedInt = isNaN(intPart) ? "0" : intPart.toLocaleString("en-US");
    return `${formattedInt}.${parts[1]}`;
  }
  return "0.000000";
}

/**
 * Validates if Transaction Amount and Re-enter Amount match (ignoring commas).
 * Returns true if amounts match, false otherwise.
 */
export function validateAmountMatch(
  amount: string | number,
  reEnterAmount: string | number
): boolean {
  const cleanAmt = String(amount ?? "").replace(/,/g, "").trim();
  const cleanReAmt = String(reEnterAmount ?? "").replace(/,/g, "").trim();
  return cleanAmt === cleanReAmt;
}

/**
 * Clean numeric string parser - strips commas and non-numeric characters.
 */
export function parseNumericValue(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, "").replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Constructs standard Add Transaction API Payload according to PDF & old website specs.
 * Guarantees ParticipantId, FundId, and short TransactionCode (e.g. "CN") are populated.
 */
export function buildAddTransactionPayload(
  values: TransactionFormValues,
  participantFundBalances?: ParticipantFundBalanceItem[],
  transactionCodeList?: TransactionCodeItem[]
): AddTransactionPayload {
  const amount = parseNumericValue(values.amount);
  const reenterAmount = parseNumericValue(values.reEnterAmount);

  let partID = values.participantID;
  let fundID = values.fundID;
  let fundPrice = parseNumericValue(values.fundPrice);
  let txnCode = values.transactionCode;

  // Auto-resolve ParticipantId and FundId from available list if missing
  if ((!partID || !fundID) && participantFundBalances && participantFundBalances.length > 0) {
    const match = participantFundBalances.find(
      (item) =>
        item.participantName === values.participantName &&
        (item.fundName === values.fund || item.fund === values.fund || !values.fund)
    ) || participantFundBalances.find((item) => item.participantName === values.participantName);

    if (match) {
      if (!partID) partID = match.participantID;
      if (!fundID) fundID = match.fundID;
      if (!fundPrice && match.fundPrice) fundPrice = match.fundPrice;
    }
  }

  // Auto-resolve short TransactionCode (e.g. "CN") if missing
  if (!txnCode && transactionCodeList && transactionCodeList.length > 0) {
    const codeMatch = transactionCodeList.find(
      (item) =>
        item.transactionCodeDesc === values.transactionCodeDesc ||
        item.transactionCode === values.transactionCodeDesc
    );
    if (codeMatch) {
      txnCode = codeMatch.transactionCode;
    }
  }

  const rawUnitsStr = amount > 0 && fundPrice > 0 ? (amount / fundPrice).toFixed(6) : "0.000000";
  const txnDate = values.transactionDate && values.transactionDate.trim()
    ? values.transactionDate.trim().split("T")[0]
    : new Date().toISOString().slice(0, 10);

  return {
    ParticipantId: partID,
    FundId: fundID,
    FundPrice: fundPrice,
    SettleDate: null,
    TransactionCode: txnCode || values.transactionCodeDesc,
    RecipientID: values.recipientID ? parseInt(values.recipientID, 10) : null,
    HasFees: values.hasFee ? "Y" : "N",
    notes: values.notes || null,
    transactionUnits: rawUnitsStr,
    TransactionAmount: amount,
    reenterAmount: reenterAmount,
    TransactionDate: txnDate,
    FeeAmount: values.hasFee ? parseNumericValue(values.feeAmount) : 0,
  };
}

/**
 * Constructs standard Edit Transaction API Payload according to PDF & old website specs.
 */
export function buildEditTransactionPayload(
  id: number | string,
  values: TransactionFormValues,
  participantFundBalances?: ParticipantFundBalanceItem[],
  transactionCodeList?: TransactionCodeItem[]
): EditTransactionPayload {
  const amount = parseNumericValue(values.amount);
  const reenterAmount = parseNumericValue(values.reEnterAmount);

  let partID = values.participantID;
  let fundID = values.fundID;
  let fundPrice = parseNumericValue(values.fundPrice);
  let txnCode = values.transactionCode;

  if ((!partID || !fundID) && participantFundBalances && participantFundBalances.length > 0) {
    const match = participantFundBalances.find(
      (item) =>
        item.participantName === values.participantName &&
        (item.fundName === values.fund || item.fund === values.fund || !values.fund)
    ) || participantFundBalances.find((item) => item.participantName === values.participantName);

    if (match) {
      if (!partID) partID = match.participantID;
      if (!fundID) fundID = match.fundID;
      if (!fundPrice && match.fundPrice) fundPrice = match.fundPrice;
    }
  }

  if (!txnCode && transactionCodeList && transactionCodeList.length > 0) {
    const codeMatch = transactionCodeList.find(
      (item) =>
        item.transactionCodeDesc === values.transactionCodeDesc ||
        item.transactionCode === values.transactionCodeDesc
    );
    if (codeMatch) {
      txnCode = codeMatch.transactionCode;
    }
  }

  const rawUnitsStr = amount > 0 && fundPrice > 0 ? (amount / fundPrice).toFixed(6) : "0.000000";
  const txnDate = values.transactionDate && values.transactionDate.trim()
    ? values.transactionDate.trim().split("T")[0]
    : new Date().toISOString().slice(0, 10);

  return {
    transactionID: id,
    participantID: partID,
    ParticipantId: partID,
    FundId: fundID,
    FundPrice: fundPrice,
    TransactionCode: txnCode || values.transactionCodeDesc,
    RecipientID: values.recipientID ? parseInt(values.recipientID, 10) : null,
    HasFees: values.hasFee ? "Y" : "N",
    notes: values.notes || null,
    TransactionDate: txnDate,
    TransactionAmount: amount,
    reenterAmount: reenterAmount,
    transactionUnits: rawUnitsStr,
    FeeAmount: values.hasFee ? parseNumericValue(values.feeAmount) : 0,
  };
}
