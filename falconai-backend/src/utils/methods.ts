import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
import { ApiResponse, LogLevel, TokenPayload, VerifyTokenResult } from "@app/utils/types";
import { Response } from "express";
import statusCodes, { IStatusCode } from "@app/constants/statusCodes";
import { IUserWithRole } from "@app/schema/types";
import { db } from "@app/config/db";

const AUTH_SECRET_KEY_RAW = process.env.AUTH_SECRET_KEY ?? "";
const AUTH_SECRET_KEY = crypto.createHash("sha256").update(AUTH_SECRET_KEY_RAW).digest();
const AUTH_REFRESH_SECRET_KEY_RAW = process.env.AUTH_REFRESH_SECRET_KEY ?? "";
const AUTH_REFRESH_SECRET_KEY = crypto.createHash("sha256").update(AUTH_REFRESH_SECRET_KEY_RAW).digest();

const generateToken = (userId?: string, expiryInMinutes: number = 5, type: "access" | "refresh" = "access"): string => {
  const expiryTime = Math.floor(Date.now() / 1000) + expiryInMinutes * 60; // Convert minutes to seconds
  const iv = crypto.randomBytes(16);

  const payload = JSON.stringify({
    uid: userId,
    exp: expiryTime,
    rand: crypto.randomBytes(16).toString("hex"), // Random value for uniqueness
  });

  // Encrypt the payload
  const cipher = crypto.createCipheriv("aes-256-cbc", type == "access" ? AUTH_SECRET_KEY : AUTH_REFRESH_SECRET_KEY, iv);
  let encryptedData = cipher.update(payload, "utf8", "hex");
  encryptedData += cipher.final("hex");

  // Generate HMAC signature
  const signature = crypto
    .createHmac("sha256", type == "access" ? AUTH_SECRET_KEY : AUTH_REFRESH_SECRET_KEY)
    .update(encryptedData)
    .digest("hex");

  return `${iv.toString("hex")}.${encryptedData}.${signature}`;
};

const verifyToken = (token: string, type: "access" | "refresh"): VerifyTokenResult => {
  try {
    // Split the token into its components
    const [ivHex, encryptedData, signature] = token.split(".");
    if (!ivHex || !encryptedData || !signature) {
      return { valid: false, error: statusCodes.TokenAuthenticationFailed };
    }

    // Validate signature
    const expectedSignature = crypto
      .createHmac("sha256", type == "access" ? AUTH_SECRET_KEY : AUTH_REFRESH_SECRET_KEY)
      .update(encryptedData)
      .digest("hex");
    if (expectedSignature !== signature) {
      return { valid: false, error: statusCodes.TokenAuthenticationFailed };
    }

    // Decrypt the data
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", type == "access" ? AUTH_SECRET_KEY : AUTH_REFRESH_SECRET_KEY, iv);
    let decryptedData = decipher.update(encryptedData, "hex", "utf8");
    decryptedData += decipher.final("utf8");

    // Parse the payload
    const payload: TokenPayload = JSON.parse(decryptedData);

    // Check expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp <= currentTime) {
      return { valid: false, error: statusCodes.TokenAuthenticationFailed };
    }

    // Token is valid, return user ID
    return { valid: true, userId: payload.uid };
  } catch (error) {
    // Handle decryption or parsing errors
    return { valid: false, error: statusCodes.TokenAuthenticationFailed };
  }
};

/**
 * Encrypts a string using AES-256-CBC.
 * @param data The string to encrypt.
 * @returns A string in the format "iv.encryptedData" (hex).
 */
const encrypt = (data: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", AUTH_SECRET_KEY, iv);

  let encryptedData = cipher.update(data, "utf8", "hex");
  encryptedData += cipher.final("hex");

  return `${iv.toString("hex")}.${encryptedData}`;
};

const decrypt = (encryptedData: string): string => {
  const [ivHex, encrypted] = encryptedData.split(".");
  const decipher = crypto.createDecipheriv("aes-256-cbc", AUTH_SECRET_KEY, Buffer.from(ivHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

const log = (level: LogLevel, ...args: any[]): void => {
  switch (level) {
    case "log":
      console.log(...args);
      break;
    case "info":
      console.info(...args);
      break;
    case "warn":
      console.warn(...args);
      break;
    case "error":
      console.error(...args);
      break;
    default:
      console.log(...args); // Fallback to log
  }
};

/**
 * Generates a random six-digit OTP as a number.
 * @returns A number between 100000 and 999999 (e.g., 123456).
 */
const generateOTP = () => {
  const min = 100000;
  const max = 999999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Current time + 5 minutes (in milliseconds)
  return { otp, otpExpiry };
};

/**
 * Sends a JSON response in a standardized format.
 *
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Optional: Custom message to return in the JSON response.
 *                  If not provided, the default status code message will be returned.
 * @param data - Optional: Additional response data in JSON format.
 */
const sendResponse = (res: Response, statusCode: IStatusCode, message?: string, data?: Record<string, any>): void => {
  res.status(statusCode?.statusCode).json({
    code: statusCode?.code,
    message: message ?? statusCode?.message, // Use custom message or default status message
    ...(data && typeof data === "object" ? data : {}), // Ensure data is an object before spreading
  });
};

const generateUsernameFromEmail = (email: string): string => {
  // Extract the part before "@"
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");

  // Generate a short random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  // Combine base + suffix
  return `${base}_${randomSuffix}`;
};

/**
 * Filters and standardizes user data for API responses.
 * Removes sensitive fields like password, otp, otpExpiry, etc.
 * @param user - User object from database
 * @param includeRole - Whether to include role information (default: false)
 * @returns Filtered user object
 */
const filterUser = (user: Partial<IUserWithRole>, includeRole: boolean = false) => {
  const filteredUser: Partial<IUserWithRole> = {
    id: user?.id,
    email: user?.email,
    fullName: user?.fullName,
    avatarUrl: user?.avatarUrl,
    emailVerified: user?.emailVerified,
    phoneVerified: user?.phoneVerified,
    phone: user?.phone,
    dateOfBirth: user?.dateOfBirth,
    gender: user?.gender,
    country: user?.country,
    status: user?.status,
    profileComplete: user?.profileComplete,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };

  // Include role if requested
  if (includeRole && user?.role) {
    filteredUser.role = user.role;
  }

  return filteredUser;
};

/**
 * Executes a callback within a database transaction.
 * Ensures all operations are atomic - either all succeed or all are rolled back.
 * @param callback - Function to execute within the transaction, receives the transaction instance
 * @returns The result of the callback
 */
const withTransaction = async <T>(callback: (tx: any) => Promise<T>): Promise<T> => {
  return db.transaction(callback);
};

export const methods = {
  generateToken,
  verifyToken,
  encrypt,
  decrypt,
  log,
  generateOTP,
  sendResponse,
  generateUsernameFromEmail,
  filterUser,
  withTransaction,
};
