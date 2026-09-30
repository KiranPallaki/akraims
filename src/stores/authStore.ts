import { LoginResponse } from "@/types/auth";
import { Client } from "@/types/client";

const TOKEN_KEY = "acg_auth_token";
const USER_KEY = "acg_user_data";
const CLIENT_KEY = "acg_selected_client";

export const extractToken = (data: any): string | null => {
  if (!data) return null;
  if (typeof data === "string" && data.length > 10) return data;
  return (
    data.Token ||
    data.token ||
    data.accessToken ||
    data.access_token ||
    data.jwt ||
    data.jwtToken ||
    data.jwt_token ||
    data.bearerToken ||
    data.data?.token ||
    data.data?.Token ||
    null
  );
};

export const extractRoles = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data.Roles)) return data.Roles;
  if (Array.isArray(data.roles)) return data.roles;
  if (typeof data.role === "string") return [data.role];
  if (typeof data.Role === "string") return [data.Role];
  return [];
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CLIENT_KEY);
};

export const saveAuthSession = (authData: any): void => {
  const token = extractToken(authData);
  if (token) {
    setAuthToken(token);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(
      USER_KEY,
      typeof authData === "object" ? JSON.stringify(authData) : String(authData)
    );
  }
};

export const getSavedUserSession = (): LoginResponse | null => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as LoginResponse;
  } catch {
    return null;
  }
};

export const setSelectedClient = (client: Client): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_KEY, JSON.stringify(client));
};

export const getSelectedClient = (): Client | null => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(CLIENT_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as Client;
  } catch {
    return null;
  }
};

export const getRedirectPath = (
  redirectParam?: string | null,
  roles?: string[]
): string => {
  if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
    return redirectParam;
  }

  // After login, navigate directly to client selection screen
  return "/select-client";
};
