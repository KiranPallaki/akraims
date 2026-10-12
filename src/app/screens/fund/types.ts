export interface FundItem {
  fundID: number | string;
  fund: string; // e.g. "HNF01"
  fundName: string; // e.g. "HNF Institutions Fund"
  fundType: string; // e.g. "Pool"
  amount?: number | string;
  accountType?: string;
  priceSchedule?: string;
  openDate?: string;
  fundOpenDate?: string;
  fundMinorIndustryType?: string;
  baseCurrency?: string;
  clientFundCode?: string;
  fundRefCode?: string;
  status?: string;
}

export interface FundFormValues {
  fund: string;
  fundName: string;
  amount: string;
  accountType: string;
  priceSchedule: string;
  openDate: string;
  fundType: string;
  baseCurrency: string;
  clientFundCode?: string;
  fundRefCode?: string;
}

export interface AddFundPayload {
  fundID?: number | string;
  fund: string;
  fundName: string;
  amount?: number | string;
  accountType?: string;
  priceSchedule?: string;
  openDate?: string;
  fundOpenDate?: string;
  fundType?: string;
  fundMinorIndustryType?: string;
  baseCurrency?: string;
  clientFundCode?: string;
  fundRefCode?: string;
}
