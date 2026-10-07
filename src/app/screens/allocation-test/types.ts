export interface AllocTypeItem {
  allocTypeID?: number | string;
  allocType?: string;
  allocTypeDesc?: string;
  id?: number | string;
  name?: string;
}

export interface FundItem {
  fundID?: number | string;
  fund?: string;
  fundName?: string;
  fundType?: string;
  id?: number | string;
  code?: string;
  name?: string;
}

export interface TransactionCodeToAllocateItem {
  transactionCode?: string;
  transactionCodeDesc?: string;
  amountToAlloacate?: number | string;
  amountToAllocate?: number | string;
  amount?: number | string;
  transactionCodeID?: number | string;
  id?: number | string;
}

export interface AllocLastFundPriceDateResponse {
  lastFundPriceDate?: string;
  nextAllocDate?: string;
  LastFundPriceDate?: string;
  NextAllocDate?: string;
}

export interface AllocationRowItem {
  transactionCode: string;
  transactionCodeDesc: string;
  amount: number;
}

export interface AllocationFormData {
  allocType: string;
  fundId: string | number;
  lastFundPriceDate: string;
  allocDate: string;
  allocations: AllocationRowItem[];
}
