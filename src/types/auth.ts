export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  Token?: string;
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwtToken?: string;
  jwt_token?: string;
  bearerToken?: string;
  UserId?: string;
  userId?: string;
  id?: string;
  Roles?: string[];
  roles?: string[];
  role?: string;
  email?: string;
  name?: string;
  message?: string;
  error?: string;
  detail?: string;
  title?: string;
  Message?: string;
  Error?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
}

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  SERVER_ERROR_MIN: 500,
} as const;
