"use client";

import { useState } from "react";
import { loginApi } from "@/lib/api";
import {
  extractRoles,
  extractToken,
  getRedirectPath,
  removeAuthToken,
  saveAuthSession,
} from "@/stores/authStore";
import { HTTP_STATUS, LoginRequest } from "@/types/auth";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const login = async (
    credentials: LoginRequest,
    redirectParam?: string | null
  ) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await loginApi(credentials);

    console.log("[useAuth] Result evaluation:", result);

    // If HTTP status is 200-299 OK, consider it successful
    if (result.ok) {
      saveAuthSession(result.data);
      setSuccessMessage("Login successful! Redirecting...");
      setIsLoading(false);

      const roles = extractRoles(result.data);
      const targetPath = getRedirectPath(redirectParam, roles);
      return { success: true, redirectPath: targetPath };
    } else {
      let msg =
        result.data.message ||
        result.data.error ||
        result.data.detail ||
        result.data.title ||
        result.data.Message ||
        result.data.Error;

      if (!msg) {
        if (
          result.status === HTTP_STATUS.UNAUTHORIZED ||
          result.status === HTTP_STATUS.BAD_REQUEST
        ) {
          msg = "Invalid email or password. Please check your credentials and try again.";
        } else if (result.status === HTTP_STATUS.METHOD_NOT_ALLOWED) {
          msg = "Method not allowed on API server.";
        } else {
          msg = `Sign in failed (HTTP ${result.status}). Please check credentials or API server.`;
        }
      }

      setErrorMessage(msg);
      setIsLoading(false);
      return { success: false, redirectPath: null };
    }
  };

  const logout = () => {
    removeAuthToken();
  };

  return {
    isLoading,
    errorMessage,
    successMessage,
    login,
    logout,
  };
}
