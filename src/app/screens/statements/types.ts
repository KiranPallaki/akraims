export interface StatementItem {
  id?: string | number;
  name: string;
  type?: string;
  statementType?: string;
  date?: string;
  filePath?: string;
  fund?: string;
  participantName?: string;
  [key: string]: any;
}

export interface StatementsSearchPayload {
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminStatementsSearchPayload {
  PageNumber?: number;
  PageSize?: number;
}

export interface StatementsApiResponse {
  items?: StatementItem[];
  data?: StatementItem[];
  totalCount?: number;
  message?: string;
  [key: string]: any;
}

export type StatementsTabType = "statements" | "adminStatements";
