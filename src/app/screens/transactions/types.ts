export interface TransactionsTransactionItem {
  userID?: string;
  clientID?: number;
  roleID?: number;
  transactionID: number | string;
  fund?: string;
  participantNumber?: string;
  fundName?: string;
  participantName?: string;
  fundID?: number;
  participantID?: number;
  transactionDate?: string;
  settlementDate?: string | null;
  transactionCode?: string;
  transactionCodeDesc?: string;
  transactionAmount?: number;
  transactionUnits?: number | null;
  notes?: string | null;
  fundPrice?: number;
  hasFees?: string;
  feeAmount?: number;
  accountName?: string;
  amount?: number;
  type?: string;
  status?: string;
  description?: string;
  recipientID?: number | string | null;
  [key: string]: any;
}

export type TransactionsTabType = "Transactions" | "pendingTransactions";

export interface TransactionCodeItem {
  transactionCodeID?: number;
  transactionCode: string;
  transactionCodeDesc: string;
  capstockActivity?: string;
  transactionCodeGroup?: string;
  allowAllocations?: string;
  allowManualAllocations?: string;
}

export interface ParticipantFundBalanceItem {
  fundID?: number;
  participantID?: number;
  accountID?: number;
  fund?: string;
  fundName?: string;
  participantNumber?: string;
  participantName: string;
  accountNum?: string;
  balance?: number;
  unitBalance?: number;
  allowFutureDateTransactions?: string;
  maxFundPriceDate?: string;
  fundPrice?: number;
}

export interface RecipientItem {
  recipientID: number;
  recipientName: string;
  recipientCode?: string;
}

export interface TransactionFormValues {
  participantName: string;
  participantID?: number;
  fund: string;
  fundID?: number;
  transactionCodeDesc: string;
  transactionCode?: string;
  fundPrice: string;
  transactionDate: string;
  hasFee: boolean;
  amount: string;
  reEnterAmount: string;
  units: string;
  balance: string;
  notes: string;
  feeAmount: string;
  recipientID?: string;
}

export interface AddTransactionPayload {
  ParticipantId?: number;
  FundId?: number;
  FundPrice?: number;
  SettleDate?: string | null;
  TransactionCode?: string;
  RecipientID?: number | null;
  HasFees: "Y" | "N";
  notes?: string | null;
  transactionUnits?: string;
  TransactionAmount?: number;
  reenterAmount?: number;
  TransactionDate?: string;
  FeeAmount?: number;
  [key: string]: any;
}

export interface EditTransactionPayload {
  FundId?: number;
  FundPrice?: number;
  participantID?: number;
  ParticipantId?: number;
  RecipientID?: number | null;
  TransactionCode?: string;
  HasFees: "Y" | "N";
  notes?: string | null;
  TransactionDate?: string;
  TransactionAmount?: number;
  transactionUnits?: string;
  reenterAmount?: number;
  FeeAmount?: number;
  [key: string]: any;
}
