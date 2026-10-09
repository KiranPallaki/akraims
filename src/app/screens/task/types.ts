export type TaskReturnType = "dataset" | "dataprocess";

export interface TaskMetadata {
  id: string | number;
  name: string;
  spName?: string;
  description?: string;
  returnType: TaskReturnType;
  allowExecute?: boolean;
  allowPdfExport?: boolean;
  allowCsvExport?: boolean;
  allowExcelExport?: boolean;
  [key: string]: any;
}

export interface TaskParameter {
  parameterID: string | number;
  metaID?: string | number;
  parameterName: string;
  parameterType: "IN" | "OUT" | string;
  inputType?: "select" | "date" | "text" | "number" | string;
  dbType?: "smalldatetime" | "varchar" | "int" | "decimal" | string;
  options?: Array<{ value: string | number; label: string }>;
  inputDataSource?: string;
  inputDataSourceName?: string;
  [key: string]: any;
}

export interface FundLookupItem {
  fundID: number | string;
  fund: string;
  fundName: string;
  [key: string]: any;
}

export interface ParticipantLookupItem {
  participantID: number | string;
  participantNumber?: string;
  participantName: string;
  [key: string]: any;
}

export interface TaskExecutionResultItem {
  symbol?: string;
  date?: string;
  cost?: number;
  gainOrLoss?: number;
  marketValue?: number;
  price?: number;
  qty?: number;
  [key: string]: any;
}

export interface TaskExecuteResponse {
  ok: boolean;
  message?: string;
  processResultCode?: number | string;
  processResultDesc?: string;
  errors?: string[] | any;
  data?: TaskExecutionResultItem[];
  [key: string]: any;
}

export interface DynamicFormSubmitPayload {
  Type?: string;
  data: Record<string, any>;
}
