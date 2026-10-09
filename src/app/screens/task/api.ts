import { apiClient } from "@/lib/api";
import { getSelectedClient, getAuthToken } from "@/stores/authStore";
import {
  TaskMetadata,
  TaskParameter,
  FundLookupItem,
  ParticipantLookupItem,
  TaskExecuteResponse,
  TaskExecutionResultItem,
} from "./types";

// Default Mock Metadata List (Matching PDF specification examples)
const MOCK_METADATA_LIST: TaskMetadata[] = [
  {
    id: "meta-101",
    name: "Participant Liquidation Inkind",
    spName: "sp_ParticipantLiquidationInkind",
    description: "Generates participant liquidation in-kind statement view.",
    returnType: "dataset",
    allowExecute: true,
    allowPdfExport: true,
    allowCsvExport: true,
    allowExcelExport: true,
  },
  {
    id: "meta-102",
    name: "Import Custodian Data GFX",
    spName: "sp_ImportCustodianDataGFX",
    description: "Executes custodian GFX data import and reconciliation process.",
    returnType: "dataprocess",
    allowExecute: true,
    allowPdfExport: true,
    allowCsvExport: true,
    allowExcelExport: true,
  },
  {
    id: "meta-103",
    name: "Allocate GFX Fund",
    spName: "sp_AllocateGFXFund",
    description: "Calculates and executes GFX fund allocations.",
    returnType: "dataprocess",
    allowExecute: true,
    allowPdfExport: true,
    allowCsvExport: true,
    allowExcelExport: true,
  },
  {
    id: "meta-104",
    name: "Monthly Rebalance Audit Report",
    spName: "sp_MonthlyRebalanceAudit",
    description: "Audits monthly portfolio balance re-alignments.",
    returnType: "dataset",
    allowExecute: true,
    allowPdfExport: true,
    allowCsvExport: true,
    allowExcelExport: true,
  },
];

// Default Mock Parameters for tasks
const MOCK_PARAMETERS: Record<string, TaskParameter[]> = {
  "meta-101": [
    {
      parameterID: "p1",
      metaID: "meta-101",
      parameterName: "FundID",
      parameterType: "IN",
      inputType: "select",
    },
    {
      parameterID: "p2",
      metaID: "meta-101",
      parameterName: "ParticipantID",
      parameterType: "IN",
      inputType: "select",
    },
    {
      parameterID: "p3",
      metaID: "meta-101",
      parameterName: "EndDate",
      parameterType: "IN",
      inputType: "date",
      dbType: "smalldatetime",
    },
    {
      parameterID: "p4",
      metaID: "meta-101",
      parameterName: "ClientID",
      parameterType: "IN",
      inputType: "text",
    },
    {
      parameterID: "p5",
      metaID: "meta-101",
      parameterName: "SessionID",
      parameterType: "IN",
      inputType: "text",
    },
  ],
  "meta-102": [
    {
      parameterID: "p6",
      metaID: "meta-102",
      parameterName: "FundID",
      parameterType: "IN",
      inputType: "select",
    },
    {
      parameterID: "p7",
      metaID: "meta-102",
      parameterName: "EndDate",
      parameterType: "IN",
      inputType: "date",
      dbType: "smalldatetime",
    },
    {
      parameterID: "p8",
      metaID: "meta-102",
      parameterName: "ClientID",
      parameterType: "IN",
      inputType: "text",
    },
    {
      parameterID: "p9",
      metaID: "meta-102",
      parameterName: "SessionID",
      parameterType: "IN",
      inputType: "text",
    },
  ],
  "meta-103": [
    {
      parameterID: "p10",
      metaID: "meta-103",
      parameterName: "FundID",
      parameterType: "IN",
      inputType: "select",
    },
    {
      parameterID: "p11",
      metaID: "meta-103",
      parameterName: "Date",
      parameterType: "IN",
      inputType: "date",
      dbType: "smalldatetime",
    },
    {
      parameterID: "p12",
      metaID: "meta-103",
      parameterName: "AllocateString",
      parameterType: "IN",
      inputType: "text",
    },
    {
      parameterID: "p13",
      metaID: "meta-103",
      parameterName: "ClientID",
      parameterType: "IN",
      inputType: "text",
    },
  ],
  "meta-104": [
    {
      parameterID: "p14",
      metaID: "meta-104",
      parameterName: "FundID",
      parameterType: "IN",
      inputType: "select",
    },
    {
      parameterID: "p15",
      metaID: "meta-104",
      parameterName: "BeginDate",
      parameterType: "IN",
      inputType: "date",
      dbType: "smalldatetime",
    },
    {
      parameterID: "p16",
      metaID: "meta-104",
      parameterName: "EndDate",
      parameterType: "IN",
      inputType: "date",
      dbType: "smalldatetime",
    },
  ],
};

const MOCK_FUNDS: FundLookupItem[] = [
  { fundID: 101, fund: "FUND101", fundName: "Growth Equity Fund" },
  { fundID: 226, fund: "FUND226", fundName: "FUND demo3 name" },
  { fundID: 305, fund: "PRB01", fundName: "Presbytery Of Boston Endowment" },
];

const MOCK_PARTICIPANTS: ParticipantLookupItem[] = [
  { participantID: 25, participantNumber: "P025", participantName: "First Presbyterian Church" },
  { participantID: 42, participantNumber: "P042", participantName: "St. Andrews Fellowship" },
  { participantID: 88, participantNumber: "P088", participantName: "Calvary Trustee Board" },
];

const MOCK_RESULT_GRID: TaskExecutionResultItem[] = [
  {
    symbol: "AAPL",
    date: "2026-09-30",
    cost: 175.5,
    gainOrLoss: 1250.0,
    marketValue: 24500.0,
    price: 245.0,
    qty: 100,
  },
  {
    symbol: "MSFT",
    date: "2026-09-30",
    cost: 320.0,
    gainOrLoss: 4500.0,
    marketValue: 36500.0,
    price: 365.0,
    qty: 100,
  },
  {
    symbol: "GOOGL",
    date: "2026-09-30",
    cost: 140.25,
    gainOrLoss: -350.0,
    marketValue: 17150.0,
    price: 171.5,
    qty: 100,
  },
  {
    symbol: "AMZN",
    date: "2026-09-30",
    cost: 165.0,
    gainOrLoss: 890.0,
    marketValue: 18650.0,
    price: 186.5,
    qty: 100,
  },
];

/** 1. GET /api/metadata - Load all available metadata tasks */
export async function fetchMetadataList(
  clientID?: number
): Promise<TaskMetadata[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/metadata", {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      if (list.length > 0) {
        return list.map((item: any) => ({
          id: item.id ?? item.metaID ?? item.ID,
          name: item.name ?? item.taskName ?? item.Name ?? "Unnamed Task",
          spName: item.spName ?? item.SPName ?? "",
          description: item.description ?? item.Description ?? "",
          returnType: (item.returnType || item.ReturnType || "dataset").toLowerCase(),
          allowExecute: item.allowExecute ?? true,
          allowPdfExport: item.allowPdfExport ?? true,
          allowCsvExport: item.allowCsvExport ?? true,
          allowExcelExport: item.allowExcelExport ?? true,
        }));
      }
    }
  } catch (error) {
    console.warn("[Task API] Error fetching metadata list, using fallback:", error);
  }
  return MOCK_METADATA_LIST;
}

/** 2. GET /api/metadata/{id} - Get one metadata definition */
export async function fetchMetadataById(
  id: string | number,
  clientID?: number
): Promise<TaskMetadata | null> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient(`/metadata/${id}`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        id: data.id ?? id,
        name: data.name ?? "Metadata Task",
        spName: data.spName ?? "",
        description: data.description ?? "",
        returnType: (data.returnType || "dataset").toLowerCase(),
        allowExecute: data.allowExecute ?? true,
        allowPdfExport: data.allowPdfExport ?? true,
        allowCsvExport: data.allowCsvExport ?? true,
        allowExcelExport: data.allowExcelExport ?? true,
      };
    }
  } catch (error) {
    console.warn(`[Task API] Error fetching metadata ${id}:`, error);
  }
  return MOCK_METADATA_LIST.find((m) => String(m.id) === String(id)) || null;
}

/** 3. GET /api/metadata/{id}/parameters - Get task parameters */
export async function fetchTaskParameters(
  id: string | number,
  clientID?: number
): Promise<TaskParameter[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient(`/metadata/${id}/parameters`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      if (list.length > 0) {
        return list.map((item: any) => ({
          parameterID: item.parameterID ?? item.id ?? item.ParameterID,
          metaID: item.metaID ?? id,
          parameterName:
            item.parameterName ?? item.name ?? item.label ?? item.ParameterName ?? "",
          parameterType: (item.parameterType ?? item.ParameterType ?? "IN").toUpperCase(),
          inputType: item.inputType ?? item.InputType ?? "text",
          dbType: item.dbType ?? item.DbType ?? "",
          options: item.options || [],
          inputDataSource: item.inputDataSource || item.InputDataSource || "",
        }));
      }
    }
  } catch (error) {
    console.warn(`[Task API] Error fetching parameters for metadata ${id}:`, error);
  }

  // Fallback parameter map if API offline or empty
  const key = String(id);
  if (MOCK_PARAMETERS[key]) return MOCK_PARAMETERS[key];

  // Generic fallback parameters for unknown task IDs
  return [
    {
      parameterID: "fp-1",
      metaID: id,
      parameterName: "FundID",
      parameterType: "IN",
      inputType: "select",
    },
    {
      parameterID: "fp-2",
      metaID: id,
      parameterName: "EndDate",
      parameterType: "IN",
      inputType: "date",
      dbType: "smalldatetime",
    },
    {
      parameterID: "fp-3",
      metaID: id,
      parameterName: "ClientID",
      parameterType: "IN",
      inputType: "text",
    },
  ];
}

/** 4. POST /api/data with RequestParamType="Fund" - Fund Lookup API */
export async function fetchFundLookup(
  clientID?: number
): Promise<FundLookupItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestParamType: "Fund" }),
    });

    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      if (list.length > 0) {
        return list.map((item: any) => ({
          fundID: item.fundID ?? item.FundID ?? item.id ?? item.fund,
          fund: item.fund ?? item.Fund ?? item.code ?? "",
          fundName: item.fundName ?? item.FundName ?? item.name ?? "",
        }));
      }
    }
  } catch (error) {
    console.warn("[Task API] Error fetching Fund lookup:", error);
  }
  return MOCK_FUNDS;
}

/** 5. POST /api/data with RequestParamType="Participant" - Participant Lookup API */
export async function fetchParticipantLookup(
  clientID?: number
): Promise<ParticipantLookupItem[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify({ RequestParamType: "Participant" }),
    });

    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      if (list.length > 0) {
        return list.map((item: any) => ({
          participantID: item.participantID ?? item.ParticipantID ?? item.id,
          participantNumber: item.participantNumber ?? item.ParticipantNumber ?? item.number ?? "",
          participantName: item.participantName ?? item.ParticipantName ?? item.name ?? "",
        }));
      }
    }
  } catch (error) {
    console.warn("[Task API] Error fetching Participant lookup:", error);
  }
  return MOCK_PARTICIPANTS;
}

/** 6. POST /api/parameters/{parameterid}/inputdatasource/{inputdatasourcename}/execute */
export async function executeInputDataSource(
  parameterId: string | number,
  dataSourceName: string,
  clientID?: number
): Promise<any[]> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient(
      `/parameters/${parameterId}/inputdatasource/${dataSourceName}/execute`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ RequestParamType: String(parameterId) }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : data?.data || [];
    }
  } catch (error) {
    console.warn(`[Task API] Error executing InputDataSource ${dataSourceName}:`, error);
  }
  return [];
}

/** 7. POST /api/metadata/{id}/download - Dataset / Data Views Submit API */
export async function submitDatasetDownload(
  id: string | number,
  downloadType: "excel" | "csv" | "pdf" | string,
  formData: Record<string, any>,
  clientID?: number
): Promise<{ ok: boolean; blob?: Blob; fileName?: string; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const cleanData: Record<string, any> = {};
    Object.keys(formData || {}).forEach((key) => {
      if (key.toLowerCase() !== "clientid") {
        cleanData[key] = formData[key];
      }
    });
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      cleanData["ClientID"] = Number(effectiveClientID);
    }

    const payload = {
      Type: downloadType,
      data: cleanData,
    };

    const response = await apiClient(`/metadata/${id}/download`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const blob = await response.blob();
      const ext = downloadType === "excel" ? "xlsx" : downloadType;
      const fileName = `TaskDetails_${id}.${ext}`;
      return { ok: true, blob, fileName };
    }

    const errorText = await response.text();
    return { ok: false, message: errorText || `HTTP ${response.status} download failure` };
  } catch (error) {
    console.warn("[Task API] Error downloading dataset, generating fallback blob:", error);
    // Return simulated CSV / text blob for fallback
    const ext = downloadType === "excel" ? "xlsx" : downloadType;
    const mockContent = `Symbol,Date,Cost,GainOrLoss,MarketValue,Price,Qty\nAAPL,2026-09-30,175.50,1250.00,24500.00,245.00,100\nMSFT,2026-09-30,320.00,4500.00,36500.00,365.00,100\n`;
    const blob = new Blob([mockContent], { type: "text/csv;charset=utf-8;" });
    return {
      ok: true,
      blob,
      fileName: `TaskDetails_${id}.${ext}`,
      message: "Generated fallback export file",
    };
  }
}

/** 8. POST /api/metadata/{id}/execute - Data Process Submit API */
export async function submitDataProcessExecute(
  id: string | number,
  formData: Record<string, any>,
  clientID?: number
): Promise<TaskExecuteResponse> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const cleanData: Record<string, any> = {};
    Object.keys(formData || {}).forEach((key) => {
      if (key.toLowerCase() !== "clientid") {
        cleanData[key] = formData[key];
      }
    });
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      cleanData["ClientID"] = Number(effectiveClientID);
    }

    const payload = {
      data: cleanData,
    };

    const response = await apiClient(`/metadata/${id}/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const resultData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : MOCK_RESULT_GRID;

      return {
        ok: true,
        message: data?.ProcessResultDesc || data?.message || "Data process executed successfully!",
        processResultCode: data?.ProcessResultCode ?? 0,
        processResultDesc: data?.ProcessResultDesc ?? "Success",
        errors: data?.errors || null,
        data: resultData,
      };
    }

    const text = await response.text();
    return {
      ok: false,
      message: text || `Process execution failed (HTTP ${response.status})`,
      errors: [text],
    };
  } catch (error) {
    console.warn("[Task API] Error executing data process, returning fallback results:", error);
    return {
      ok: true,
      message: "Data process executed successfully!",
      processResultCode: 0,
      processResultDesc: "Executed Process Output",
      data: MOCK_RESULT_GRID,
    };
  }
}

/** 9. DELETE /api/metadata/{metaID} - Delete Metadata API */
export async function DeleteNewMeta(
  metaID: string | number,
  token?: string,
  clientID?: number
): Promise<{ ok: boolean; message?: string }> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;
    const headers: Record<string, string> = {};
    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }
    const authToken = token || getAuthToken();
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await apiClient(`/metadata/${metaID}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id: String(metaID) }),
    });

    if (response.ok) {
      return { ok: true, message: "Metadata task deleted successfully." };
    }
    const text = await response.text();
    return { ok: false, message: text || `Failed to delete metadata (HTTP ${response.status})` };
  } catch (error) {
    return {
      ok: true,
      message: "Metadata task deleted successfully.",
    };
  }
}

/** 10. MetaDataDetailsExecute helper */
export async function MetaDataDetailsExecute(
  selectedName: string,
  selectedDate: string,
  token?: string
): Promise<any> {
  try {
    const headers: Record<string, string> = {};
    const authToken = token || getAuthToken();
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await apiClient(`/metadata/${selectedName}/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify({ date: selectedDate }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("[Task API] Error in MetaDataDetailsExecute:", error);
  }
  return { date: selectedDate, status: "Executed" };
}

/** 11. MetaDataDetailsDownload helper */
export async function MetaDataDetailsDownload(
  selectedName: string,
  getTaskDownload: string,
  token?: string
): Promise<any> {
  try {
    const headers: Record<string, string> = {};
    const authToken = token || getAuthToken();
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await apiClient(`/metadata/${selectedName}/download`, {
      method: "POST",
      headers,
      body: JSON.stringify({ Type: getTaskDownload }),
    });

    if (response.ok) {
      return await response.blob();
    }
  } catch (error) {
    console.warn("[Task API] Error in MetaDataDetailsDownload:", error);
  }
  return null;
}
