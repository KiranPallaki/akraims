import { getAuthToken, getSelectedClient } from "@/stores/authStore";
import { LoginRequest, LoginResponse } from "@/types/auth";
import { Client } from "@/types/client";
import { ProductMenuItem } from "@/types/menu";

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://imsdev.akrais.com:8444/IMSProdWebAPI/api";

export async function parseResponseData<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  const text = await response.text();
  return { message: text } as T;
}

export async function apiClient(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();
  const selectedClient = getSelectedClient();

  if (!API_BASE_URL && !endpoint.startsWith("http")) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(selectedClient?.clientID !== undefined && selectedClient?.clientID !== null
      ? { ClientID: String(selectedClient.clientID) }
      : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, config);
}

export async function loginApi(
  credentials: LoginRequest,
): Promise<{ ok: boolean; status: number; data: LoginResponse }> {
  try {
    const requestBody = {
      email: credentials.email,
      password: credentials.password,
    };

    const response = await apiClient("/auth/token", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const data = await parseResponseData<LoginResponse>(response);

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("[Auth API] Error:", error);
    let message = "Network error. Please check your internet connection.";
    if (error instanceof Error) {
      message = error.message;
    }
    return {
      ok: false,
      status: 0,
      data: { message, error: message },
    };
  }
}

export async function getClientsApi(): Promise<{
  ok: boolean;
  status: number;
  data: Client[];
  error?: string;
}> {
  try {
    const response = await apiClient("/clients", {
      method: "GET",
    });

    if (response.ok) {
      const data = (await response.json()) as Client[];
      return { ok: true, status: response.status, data };
    } else {
      const text = await response.text();
      return {
        ok: false,
        status: response.status,
        data: [],
        error: text || `Failed to fetch clients (HTTP ${response.status})`,
      };
    }
  } catch (error) {
    let errorMsg = "Network error fetching client list.";
    if (error instanceof Error) errorMsg = error.message;
    return { ok: false, status: 0, data: [], error: errorMsg };
  }
}

export async function fetchProductMenuList(
  clientID?: number,
): Promise<{
  ok: boolean;
  status: number;
  data: ProductMenuItem[];
  error?: string;
}> {
  try {
    const effectiveClientID = clientID ?? getSelectedClient()?.clientID;

    const payload: Record<string, any> = {
      RequestParamType: "ProductMenuList",
    };
    const headers: Record<string, string> = {};

    if (effectiveClientID !== undefined && effectiveClientID !== null) {
      headers["ClientID"] = String(effectiveClientID);
    }

    const response = await apiClient("/data", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const menuList = Array.isArray(data) ? data : data?.data || [];
      return { ok: true, status: response.status, data: menuList };
    }

    return { ok: false, status: response.status, data: [] };
  } catch (error) {
    console.warn("[Menu API] Error fetching product menu list:", error);
    return { ok: false, status: 0, data: [] };
  }
}
