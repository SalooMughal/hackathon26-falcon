import { IStatusCode } from "@app/constants/statusCodes";
import { IRole, IUser } from "@app/schema/types";

export interface IGenerateOtpResult {
  success?: boolean;
  error?: IStatusCode;
}

export interface IVerifyOtpResult {
  user?: IUser;
  verified?: boolean;
  error?: IStatusCode;
}

export interface IAuthenticateUserResult {
  authenticated: boolean;
  user?: IUser;
  error?: IStatusCode;
}

export interface IGenerateTokensResult {
  access_token?: string;
  refresh_token?: string;
  error?: IStatusCode;
}

export interface IRefreshTokensResult {
  access_token?: string;
  refresh_token?: string;
  userId?: string;
  error?: IStatusCode;
}
