export type TaskReturnType = "dataset" | "dataprocess";

export interface TaskMetadata {
  id: string | number;
  name: string;
  label?: string;
  spName?: string;
  description?: string;
  schemaName?: string;
  executionMethod?: string;
  resourceUrl?: string;
  httpMethod?: string;
  returnType: TaskReturnType;
  submitButtonText?: string;
  cancelButtonText?: string;
  allowExecute?: boolean;
  allowPdfExport?: boolean;
  allowCsvExport?: boolean;
  allowExcelExport?: boolean;
  active?: boolean;
  isDataExtract?: boolean;
  roleId?: string;
  [key: string]: any;
}

export interface TaskParameter {
  parameterID: string | number;
  metaID?: string | number;
  parameterName: string;
  name?: string;
  parameterType: "IN" | "OUT" | string;
  inputType?: "select" | "date" | "text" | "number" | string;
  dbType?: "smalldatetime" | "varchar" | "int" | "decimal" | string;
  type?: string;
  position?: number;
  isNullable?: boolean | string;
  defaultValue?: string;
  length?: number;
  precision?: number;
  scale?: number;
  label?: string;
  placeHolder?: string;
  tooltip?: string;
  inputDataSource?: string;
  InputDataSource?: any[];
  options?: Array<{ value: string | number; label: string }>;
  active?: boolean | string;
  pattern?: string;
  [key: string]: any;
}

export interface CreateMetaDataPayload {
  id?: string | number;
  name: string;
  label: string;
  description: string;
  schemaName: string;
  executionMethod: string;
  spName: string;
  resourceUrl: string;
  httpMethod: string;
  returnType: TaskReturnType | string;
  submitButtonText: string;
  cancelButtonText: string;
  allowExecute: boolean;
  allowExcelExport: boolean;
  allowPdfExport: boolean;
  allowCsvExport: boolean;
  active: boolean;
  isDataExtract: boolean;
  roleId: string;
}

export interface CreateParameterPayload {
  parameterID?: string | number;
  metaID?: string | number;
  name: string;
  parameterType: string;
  dbType: string;
  type: string;
  position: number;
  isNullable: boolean;
  defaultValue: string;
  length: number;
  precision: number;
  scale: number;
  inputType: string;
  label: string;
  placeHolder: string;
  tooltip: string;
  InputDataSource: any[];
  options: any[];
  active: boolean;
  pattern: string;
}

export interface ExportParameterPayload {
  exportParameterID?: string | number;
  metaID?: string | number;
  name: string;
  type: string;
  headerText: string;
  position: number;
  allowExcelExport: boolean;
  allowPdfExport: boolean;
  allowCsvExport: boolean;
}

export interface RoleOption {
  roleID?: string | number;
  roleId?: string | number;
  id?: string | number;
  roleName?: string;
  name?: string;
  label?: string;
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
