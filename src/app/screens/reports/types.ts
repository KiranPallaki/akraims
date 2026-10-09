export interface ReportItem {
  reportID: number | string;
  reportName: string;
  reportDesc: string;
  reportClassName?: string;
  webPageFile?: string;
}

export interface ReportParameter {
  reportParameterID: number | string;
  reportID: number | string;
  parameterID: number | string;
  parameterName: string;
  parameterType: string; // e.g. "smalldatetime", "int", "varchar"
  parameterOrderID?: number;
  parameterNotes?: string;
}

export interface FundOption {
  fundID: number | string;
  fund: string;
  fundName?: string;
  [key: string]: any;
}

export interface ParticipantOption {
  participantID: number | string;
  participantName: string;
  participant?: string;
  [key: string]: any;
}

export interface ReportParameterValue {
  Name: string;
  Value: string;
}

export interface ReportPayload {
  type: string; // "activereport"
  fileType: "pdf" | "xlsx";
  aciveReport: {
    reportId: string;
    Parameters: ReportParameterValue[];
  };
}

export interface DynamicFormData {
  FundID: string;
  ParticipantID: string;
  YearStartDate: string;
  BeginDate: string;
  EndDate: string;
  [key: string]: string;
}
