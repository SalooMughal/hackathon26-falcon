import { IStatusCode } from "@app/constants/statusCodes";

export interface TokenPayload {
  uid: string;
  exp: number;
  rand: string;
}

export interface VerifyTokenResult {
  valid: boolean;
  userId?: string;
  error?: IStatusCode;
}

export type LogLevel = "log" | "info" | "warn" | "error";

export interface ApiResponse {
  message?: string;
  data?: any;
}
