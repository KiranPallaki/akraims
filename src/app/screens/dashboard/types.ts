export interface DashboardNetActivityData {
  endDate?: string;
  ytdBeginBalance?: number;
  marketValue?: number;
  contributions?: number;
  redemptions?: number;
  activity?: number;
  income?: number;
  expenses?: number;
  realGL?: number;
  unRealGL?: number;
  transfers?: number;
  other?: number;
  gainLoss?: number;
  rateOfReturn?: number;
}

export interface DashboardFundBalanceItem {
  clientID: number;
  fund: string;
  fundName: string;
  fundType: string;
  fundBalance: number;
  portfolioBalance: number;
  fundPercentage: number;
}

export interface DashboardGroupedFundType {
  fundType: string;
  totalBalance: number;
  aggregatePercentage: number;
  color: string;
  funds: DashboardFundBalanceItem[];
}

export interface DashboardParticipantBalanceItem {
  number?: string | number;
  Number?: string | number;
  participantNumber?: string | number;
  participantNo?: string | number;
  name?: string;
  Name?: string;
  participantName?: string;
  balance?: number;
  Balance?: number;
  participantBalance?: number;
  pct?: number;
  Pct?: number;
  percentage?: number;
  percent?: number;
}

export interface DashboardParticipantStatementItem {
  userID?: string;
  clientID?: number;
  roleID?: number;
  accountID?: number;
  participantID?: number;
  fundID?: number;
  beginDate?: string;
  endDate?: string;
  yearBeginDate?: string;
  transactionCode?: string;
  transactionCodeDesc?: string;
  amount?: number;
  ytdAmount?: number;
  displayOrderID?: number;
  item?: string;
  Item?: string;
  description?: string;
  activityItem?: string;
  mtd?: number;
  MTD?: number;
  ytd?: number;
  YTD?: number;
}

export interface DashboardFundPerformanceItem {
  fundID?: number;
  fund?: string;
  fundName?: string;
  perfDate?: string;
  mtdNet?: number;
  threeMonthsNet?: number;
  qtdNet?: number;
  ytdNet?: number;
  oneYearNet?: number;
  fiveYearNet?: number;
  sevenYearNet?: number;
  tenYearNet?: number;
  sinceInceptionNet?: number;
}

export interface DashboardFundStatementItem {
  fundID?: number;
  fund?: string;
  fundName?: string;
  isActive?: string;
  beginningBalance?: number;
  contributions?: number;
  redemptions?: number;
  income?: number;
  expenses?: number;
  realGainLoss?: number;
  other?: number;
  unrealGainLoss?: number;
  endingBalance?: number;
}

export interface DashboardPerfBalanceHistoryItem {
  userID?: number;
  clientID?: number;
  participantNumber?: number;
  transactionDate?: string;
  marketValue?: number;
  unitBalance?: number;
  previousMarketValue?: number;
  rateOfReturn?: number;
}

export interface DashboardHistoricalParticipantPerformanceItem {
  participantID?: number;
  participantNumber?: string | number;
  participantNo?: string | number;
  number?: string | number;
  participantName?: string;
  name?: string;
  fundID?: number;
  fund?: string;
  fundName?: string;
  perfDate?: string;
  mtdNet?: number;
  threeMonthsNet?: number;
  qtdNet?: number;
  ytdNet?: number;
  oneYearNet?: number;
  fiveYearNet?: number;
  sevenYearNet?: number;
  tenYearNet?: number;
  sinceInceptionNet?: number;
  [key: string]: any;
}

