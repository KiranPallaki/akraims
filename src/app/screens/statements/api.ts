import { getAuthToken, getSelectedClient } from "@/stores/authStore";
import {
  StatementItem,
  StatementsSearchPayload,
  AdminStatementsSearchPayload,
  StatementsApiResponse,
} from "./types";

export const STATEMENTS_API_BASE_URL =
  process.env.NEXT_PUBLIC_STATEMENTS_API_URL ||
  "https://imsdev.akrais.com:8444/IMSWEBAPI/api";

/**
 * Reads a cookie value by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

/**
 * Retrieves the Client ID header value as required by document specifications:
 * Converts Cookies.get('client') with parseInt, falling back to authStore.
 */
export function getClientIDHeader(): string | undefined {
  const clientCookie = getCookie("client");
  if (clientCookie) {
    const parsed = parseInt(clientCookie, 10);
    if (!isNaN(parsed)) return String(parsed);
  }
  const selectedClient = getSelectedClient();
  if (selectedClient?.clientID !== undefined && selectedClient?.clientID !== null) {
    return String(selectedClient.clientID);
  }
  return undefined;
}

/**
 * Retrieves the Auth token value as required by document specifications:
 * Reads Cookies.get('newJwt'), falling back to authStore token.
 */
export function getAuthorizationHeaderToken(): string | null {
  const newJwtCookie = getCookie("newJwt");
  if (newJwtCookie) return newJwtCookie;
  return getAuthToken();
}

/**
 * Helper: statementsList(payload, client, token)
 * POST https://imsdev.akrais.com:8444/IMSWEBAPI/api/statements/search
 * Payload: { "pageNumber": 1, "pageSize": 200 }
 */
export async function statementsList(
  payload: StatementsSearchPayload = { pageNumber: 1, pageSize: 200 },
  customClient?: string | number,
  customToken?: string
): Promise<StatementsApiResponse> {
  const url = `${STATEMENTS_API_BASE_URL.replace(/\/$/, "")}/statements/search`;
  
  const clientID = customClient ? String(customClient) : getClientIDHeader();
  const token = customToken || getAuthorizationHeaderToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (clientID) {
    headers["ClientID"] = clientID;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        pageNumber: payload.pageNumber ?? 1,
        pageSize: payload.pageSize ?? 200,
      }),
    });

    if (!response.ok) {
      console.error(`[Statements API] HTTP error ${response.status}:`, response.statusText);
      return { items: [], message: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Statements API] Request error:", error);
    return { items: [], message: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Helper: adminStatementsList(payload, client, token)
 * POST https://imsdev.akrais.com:8444/IMSWEBAPI/api/adminstatements/search
 * Payload: { "PageNumber": 1, "PageSize": 200 } (Note casing difference!)
 */
export async function adminStatementsList(
  payload: AdminStatementsSearchPayload = { PageNumber: 1, PageSize: 200 },
  customClient?: string | number,
  customToken?: string
): Promise<StatementsApiResponse> {
  const url = `${STATEMENTS_API_BASE_URL.replace(/\/$/, "")}/adminstatements/search`;

  const clientID = customClient ? String(customClient) : getClientIDHeader();
  const token = customToken || getAuthorizationHeaderToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (clientID) {
    headers["ClientID"] = clientID;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        PageNumber: payload.PageNumber ?? 1,
        PageSize: payload.PageSize ?? 200,
      }),
    });

    if (!response.ok) {
      console.error(`[Admin Statements API] HTTP error ${response.status}:`, response.statusText);
      return { items: [], message: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Admin Statements API] Request error:", error);
    return { items: [], message: error instanceof Error ? error.message : "Network error" };
  }
}
